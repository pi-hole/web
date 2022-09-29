<?php

require_once 'func.php';
require_once 'auth.php';

// Authentication checks
if (!isset($api)) {
    if (isset($_POST['token'])) {
        check_cors();
        check_csrf($_POST['token']);
    } else {
        log_and_die('Not allowed (login session invalid or expired, please relogin on the Pi-hole dashboard)!');
    }
}

switch ($_REQUEST['action']) {
    case 'get':     echo json_encode(echoCustomDNSEntries());
        break;

    case 'add':     echo json_encode(addCustomDNSEntry());
        break;

    case 'edit': echo json_encode(editCustomDNSEntry());
        break;

    case 'delete':  echo json_encode(deleteCustomDNSEntry());
        break;

    default:
        exit('Wrong action');
}
