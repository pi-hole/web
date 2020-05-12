<?php

    require_once "func.php";

    $customCNAMEFile = "/etc/dnsmasq.d/05-pihole-custom-cname.conf";

    switch ($_REQUEST['action'])
    {
        case 'get':     echo json_encode(echoCustomCNAMEEntries());   break;
        case 'add':     echo json_encode(addCustomCNAMEEntry());      break;
        case 'delete':  echo json_encode(deleteCustomCNAMEEntry());   break;
        default:
            die("Wrong action");
    }

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

    function addCustomCNAMEEntry()
    {
        try
        {
            $target = !empty($_REQUEST['target']) ? $_REQUEST['target']: "";
            $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

            if (empty($target))
                return errorJsonResponse("Target must be set");

            if (empty($domain))
                return errorJsonResponse("Domain must be set");

            // Check if each submitted domain is valid
            $domains = array_map('trim', explode(",", $domain));
            foreach ($domains as $d) {
                if (!is_valid_domain_name($d))
                    return errorJsonResponse("Domain '$d' is not valid");
            }

            $existingEntries = getCustomCNAMEEntries();

            // Check if a record for one of the domains already exists
            foreach ($existingEntries as $entry)
                foreach ($domains as $d)
                    if (in_array($d, $entry->domains))
                        return errorJsonResponse("There is already a CNAME record for '$d'");

            exec("sudo pihole -a addcustomcname ".$domain." ".$target);

            return successJsonResponse();
        }
        catch (\Exception $ex)
        {
            return errorJsonResponse($ex->getMessage());
        }
    }

    function deleteCustomCNAMEEntry()
    {
        try
        {
            $target = !empty($_REQUEST['target']) ? $_REQUEST['target']: "";
            $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

            if (empty($target))
                return errorJsonResponse("Target must be set");

            if (empty($domain))
                return errorJsonResponse("Domain must be set");

            $existingEntries = getCustomCNAMEEntries();

            $found = false;
            foreach ($existingEntries as $entry)
                if ($entry->domain == $domain)
                    if ($entry->target == $target) {
                        $found = true;
                        break;
                    }

            if (!$found)
                return errorJsonResponse("This domain/ip association does not exist");

            exec("sudo pihole -a removecustomcname ".$domain." ".$target);

            return successJsonResponse("sudo pihole -a removecustomcname ".$domain." ".$target);
        }
        catch (\Exception $ex)
        {
            return errorJsonResponse($ex->getMessage());
        }
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
