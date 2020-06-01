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

function addCustomDNSEntry($ip="", $domain="", $json_reply=true)
{
    function error($msg)
    {
        global $json_reply;
        if($json_reply)
            return errorJsonResponse($msg);
        else {
            echo $msg."<br>";
            return false;
        }
    }

    try
    {
        if(isset($_REQUEST['ip']))
            $ip = trim($_REQUEST['ip']);

        if(isset($_REQUEST['domain']))
            $domain = trim($_REQUEST['domain']);

        if (empty($ip))
            return error("IP must be set");

        $ipType = get_ip_type($ip);

        if (!$ipType)
            return error("IP must be valid");

        if (empty($domain))
            return error("Domain must be set");

        if (!is_valid_domain_name($domain))
            return error("Domain must be valid");

        // Only check for duplicates if adding new records from the web UI (not through Teleporter)
        if(isset($_REQUEST['ip']) || isset($_REQUEST['domain']))
        {
            $existingEntries = getCustomDNSEntries();
            foreach ($existingEntries as $entry)
                if ($entry->domain == $domain && get_ip_type($entry->ip) == $ipType)
                    return error("This domain already has a custom DNS entry for an IPv" . $ipType);
        }

        // Add record
        pihole_execute("-a addcustomdns ".$ip." ".$domain);

        return $json_reply ? successJsonResponse() : true;
    }
    catch (\Exception $ex)
    {
        return error($ex->getMessage());
    }
}

function deleteCustomDNSEntry()
{
    try
    {
        $ip = !empty($_REQUEST['ip']) ? $_REQUEST['ip']: "";
        $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

        if (empty($ip))
            return errorJsonResponse("IP must be set");

        if (empty($domain))
            return errorJsonResponse("Domain must be set");

        $existingEntries = getCustomDNSEntries();

        $found = false;
        foreach ($existingEntries as $entry)
            if ($entry->domain == $domain)
                if ($entry->ip == $ip) {
                    $found = true;
                    break;
                }

        if (!$found)
            return errorJsonResponse("This domain/ip association does not exist");

        pihole_execute("-a removecustomdns ".$ip." ".$domain);

        return successJsonResponse();
    }
    catch (\Exception $ex)
    {
        return errorJsonResponse($ex->getMessage());
    }
}

function deleteAllCustomDNSEntries()
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
            return errorJsonResponse($ex->getMessage());
        }

        fclose($handle);
    }

    return successJsonResponse();
}

function successJsonResponse($message = "")
{
    return [ "success" => true, "message" => $message ];
}

function errorJsonResponse($message = "")
{
    return [ "success" => false, "message" => $message ];
}

?>
