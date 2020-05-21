<?php

    require_once "func.php";

    switch ($_REQUEST['action'])
    {
        case 'get':     echo json_encode(echoCustomDNSEntries()); break;
        case 'add':     echo json_encode(addCustomDNSEntry());    break;
        case 'delete':  echo json_encode(deleteCustomDNSEntry()); break;
        default:
            die("Wrong action");
    }
?>
