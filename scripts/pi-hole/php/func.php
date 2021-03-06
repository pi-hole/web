<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

function is_valid_domain_name($domain_name)
{
    return (preg_match("/^((-|_)*[a-z\d]((-|_)*[a-z\d])*(-|_)*)(\.(-|_)*([a-z\d]((-|_)*[a-z\d])*))*$/i", $domain_name) && // Valid chars check
        preg_match("/^.{1,253}$/", $domain_name) && // Overall length check
        preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)); // Length of each label
}

function get_ip_type($ip)
{
    return  filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) ? 4 :
           (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) ? 6 :
            0);
}

function checkfile($filename) {
    if(is_readable($filename))
    {
        return $filename;
    }
    else
    {
        // substitute dummy file
        return "/dev/null";
    }
}

// Credit: http://php.net/manual/en/function.hash-equals.php#119576
if(!function_exists('hash_equals')) {
    function hash_equals($known_string, $user_string) {
        $ret = 0;

        if (strlen($known_string) !== strlen($user_string)) {
         $user_string = $known_string;
         $ret = 1;
        }

        $res = $known_string ^ $user_string;

        for ($i = strlen($res) - 1; $i >= 0; --$i) {
         $ret |= ord($res[$i]);
        }

        return !$ret;
   }
}

/**
 * More safely execute a command with pihole shell script.
 *
 * For example,
 *
 *   pihole_execute("-h");
 *
 * would execute command
 *
 *   sudo pihole -h
 *
 * and returns output of that command as a string.
 *
 * @param $argument_string String of arguments to run pihole with.
 * @param $error_on_failure If true, a warning is raised if command execution fails. Defaults to true.
 */
function pihole_execute($argument_string, $error_on_failure = true) {
    $escaped = escapeshellcmd($argument_string);
    $output = null;
    $return_status = -1;
    $command = "sudo pihole " . $escaped;
    exec($command, $output, $return_status);
    if($return_status !== 0)
    {
        trigger_error("Executing {$command} failed.", E_USER_WARNING);
    }
    return $output;
}

// Custom DNS
$customDNSFile = "/etc/pihole/custom.list";

function echoCustomDNSEntries()
{
    $entries = getCustomDNSEntries();

    $data = [];
    foreach ($entries as $entry)
        $data[] = [ $entry->domain, $entry->ip ];

    return [ "data" => $data ];
}

function getCustomDNSEntries()
{
    global $customDNSFile;

    $entries = [];

    $handle = fopen($customDNSFile, "r");
    if ($handle)
    {
        while (($line = fgets($handle)) !== false) {
            $line = str_replace("\r","", $line);
            $line = str_replace("\n","", $line);
            $explodedLine = explode (" ", $line);

            if (count($explodedLine) != 2)
                continue;

            $data = new \stdClass();
            $data->ip = $explodedLine[0];
            $data->domain = $explodedLine[1];
            $entries[] = $data;
        }

        fclose($handle);
    }

    return $entries;
}

function addCustomDNSEntry($ip="", $domain="", $json=true)
{
    try
    {
        if(isset($_REQUEST['ip']))
            $ip = trim($_REQUEST['ip']);

        if(isset($_REQUEST['domain']))
            $domain = trim($_REQUEST['domain']);

        if (empty($ip))
            return returnError("IP must be set", $json);

        $ipType = get_ip_type($ip);

        if (!$ipType)
            return returnError("IP must be valid", $json);

        if (empty($domain))
            return returnError("Domain must be set", $json);

        if (!is_valid_domain_name($domain))
            return returnError("Domain must be valid", $json);

        // Only check for duplicates if adding new records from the web UI (not through Teleporter)
        if(isset($_REQUEST['ip']) || isset($_REQUEST['domain']))
        {
            $existingEntries = getCustomDNSEntries();
            foreach ($existingEntries as $entry)
                if ($entry->domain == $domain && get_ip_type($entry->ip) == $ipType)
                    return returnError("This domain already has a custom DNS entry for an IPv" . $ipType, $json);
        }

        // Add record
        pihole_execute("-a addcustomdns ".$ip." ".$domain);

        return returnSuccess("", $json);
    }
    catch (\Exception $ex)
    {
        return returnError($ex->getMessage(), $json);
    }
}

function deleteCustomDNSEntry()
{
    try
    {
        $ip = !empty($_REQUEST['ip']) ? $_REQUEST['ip']: "";
        $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

        if (empty($ip))
            return returnError("IP must be set");

        if (empty($domain))
            return returnError("Domain must be set");

        $existingEntries = getCustomDNSEntries();

        $found = false;
        foreach ($existingEntries as $entry)
            if ($entry->domain == $domain)
                if ($entry->ip == $ip) {
                    $found = true;
                    break;
                }

        if (!$found)
            return returnError("This domain/ip association does not exist");

        pihole_execute("-a removecustomdns ".$ip." ".$domain);

        return returnSuccess();
    }
    catch (\Exception $ex)
    {
        return returnError($ex->getMessage());
    }
}

function deleteAllCustomDNSEntries()
{
    if (isset($customDNSFile))
    {
        $handle = fopen($customDNSFile, "r");
        if ($handle)
        {
            try
            {
                while (($line = fgets($handle)) !== false) {
                    $line = str_replace("\r","", $line);
                    $line = str_replace("\n","", $line);
                    $explodedLine = explode (" ", $line);

                    if (count($explodedLine) != 2)
                        continue;

                    $ip = $explodedLine[0];
                    $domain = $explodedLine[1];

                    pihole_execute("-a removecustomdns ".$ip." ".$domain);
                }
            }
            catch (\Exception $ex)
            {
                return returnError($ex->getMessage());
            }

            fclose($handle);
        }
    }

    return returnSuccess();
}

// CNAME
$customCNAMEFile = "/etc/dnsmasq.d/05-pihole-custom-cname.conf";

function echoCustomCNAMEEntries()
{
    $entries = getCustomCNAMEEntries();

    $data = [];
    foreach ($entries as $entry)
        $data[] = [ $entry->domain, $entry->target ];

    return [ "data" => $data ];
}

function getCustomCNAMEEntries()
{
    global $customCNAMEFile;

    $entries = [];

    if (!file_exists($customCNAMEFile)) return $entries;

    $handle = fopen($customCNAMEFile, "r");
    if ($handle)
    {
        while (($line = fgets($handle)) !== false) {
            $line = str_replace("cname=","", $line);
            $line = str_replace("\r","", $line);
            $line = str_replace("\n","", $line);
            $explodedLine = explode (",", $line);

            if (count($explodedLine) <= 1)
                continue;

            $data = new \stdClass();
            $data->domains = array_slice($explodedLine, 0, -1);
            $data->domain = implode(",", $data->domains);
            $data->target = $explodedLine[count($explodedLine)-1];
            $entries[] = $data;
        }

        fclose($handle);
    }

    return $entries;
}

function addCustomCNAMEEntry($domain="", $target="", $json=true)
{
    try
    {
        if(isset($_REQUEST['domain']))
            $domain = $_REQUEST['domain'];

        if(isset($_REQUEST['target']))
            $target = trim($_REQUEST['target']);

        if (empty($domain))
            return returnError("Domain must be set", $json);

        if (empty($target))
            return returnError("Target must be set", $json);

        if (!is_valid_domain_name($target))
            return returnError("Target must be valid", $json);

        // Check if each submitted domain is valid
        $domains = array_map('trim', explode(",", $domain));
        foreach ($domains as $d) {
            if (!is_valid_domain_name($d))
                return returnError("Domain '$d' is not valid", $json);
        }

        $existingEntries = getCustomCNAMEEntries();

        // Check if a record for one of the domains already exists
        foreach ($existingEntries as $entry)
            foreach ($domains as $d)
                if (in_array($d, $entry->domains))
                    return returnError("There is already a CNAME record for '$d'", $json);

        pihole_execute("-a addcustomcname ".$domain." ".$target);

        return returnSuccess("", $json);
    }
    catch (\Exception $ex)
    {
        return returnError($ex->getMessage(), $json);
    }
}

function deleteCustomCNAMEEntry()
{
    try
    {
        $target = !empty($_REQUEST['target']) ? $_REQUEST['target']: "";
        $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

        if (empty($target))
            return returnError("Target must be set");

        if (empty($domain))
            return returnError("Domain must be set");

        $existingEntries = getCustomCNAMEEntries();

        $found = false;
        foreach ($existingEntries as $entry)
            if ($entry->domain == $domain)
                if ($entry->target == $target) {
                    $found = true;
                    break;
                }

        if (!$found)
            return returnError("This domain/ip association does not exist");

        pihole_execute("-a removecustomcname ".$domain." ".$target);

        return returnSuccess();
    }
    catch (\Exception $ex)
    {
        return returnError($ex->getMessage());
    }
}

function deleteAllCustomCNAMEEntries()
{
    try
    {
        $existingEntries = getCustomCNAMEEntries();

        foreach ($existingEntries as $entry) {
            pihole_execute("-a removecustomcname ".$entry->domain." ".$entry->target);
        }

    }
    catch (\Exception $ex)
    {
        return returnError($ex->getMessage());
    }

    return returnSuccess();
}

function returnSuccess($message = "", $json = true)
{
    if ($json) {
        return [ "success" => true, "message" => $message ];
    } else {
        echo $message."<br>";
        return true;
    }
}

function returnError($message = "", $json = true)
{
    if ($json) {
        return [ "success" => false, "message" => $message ];
    } else {
        echo $message."<br>";
        return false;
    }
}

function getQueryTypeStr($querytype)
{
    $qtypes = ["A (IPv4)", "AAAA (IPv6)", "ANY", "SRV", "SOA", "PTR", "TXT", "NAPTR", "MX", "DS", "RRSIG", "DNSKEY", "NS", "OTHER", "SVCB", "HTTPS"];
    $qtype = intval($querytype);
    if($qtype > 0 && $qtype <= count($qtypes))
        return $qtypes[$qtype-1];
    else
        return "TYPE".($qtype - 100);
}

?>
