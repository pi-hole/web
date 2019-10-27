<?php

    require_once "func.php";

    $customDNSFile = "/etc/pihole/custom.list";

    switch ($_REQUEST['action'])
    {
        case 'get':     echo json_encode(echoCustomDNSEntries());    break;
        case 'add':     echo json_encode(addCustomDNSEntry());      break;
        case 'delete':  echo json_encode(deleteCustomDNSEntry());   break;
        default:
            die("Wrong action");
    }

    function echoCustomDNSEntries()
    {
        $entries = getCustomDNSEntries();

        $data = [];

        foreach ($entries as $domain => $ip)
            $data[] = [ $domain, $ip ];

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

                $entries[$explodedLine[1]] = $explodedLine[0];
            }

            fclose($handle);
        }

        return $entries;
    }

    function addCustomDNSEntry()
    {
        try
        {
            $ip = !empty($_REQUEST['ip']) ? $_REQUEST['ip']: "";
            $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

            if (empty($ip))
                return errorJsonResponse("IP must be set");

            if (!filter_var($ip, FILTER_VALIDATE_IP))
                return errorJsonResponse("IP must be valid");

            if (empty($domain))
                return errorJsonResponse("Domain must be set");

            if (!is_valid_domain_name($domain))
                return errorJsonResponse("Domain must be valid");

            $existingEntries = getCustomDNSEntries();

            if (array_key_exists($domain, $existingEntries))
                return errorJsonResponse("This domain already has a custom DNS entry");

            exec("sudo pihole -a addcustomdns ".$ip." ".$domain);
            exec("sudo pihole -a restartdns");

            return successJsonResponse();
        }
        catch (\Exception $ex)
        {
            return errorJsonResponse($ex->getMessage());
        }
    }

    function deleteCustomDNSEntry()
    {
        try
        {
            $domain = !empty($_REQUEST['domain']) ? $_REQUEST['domain']: "";

            if (empty($domain))
                return errorJsonResponse("Domain must be set");

            $existingEntries = getCustomDNSEntries();

            if (!array_key_exists($domain, $existingEntries))
                return errorJsonResponse("This domain does not have a custom DNS entry");

            exec("sudo pihole -a removecustomdns ".$domain);
            exec("sudo pihole -a restartdns");

            return successJsonResponse();
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
