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

switch ($_POST['action']) {
    case 'get':     echo json_encode(echoCustomCNAMEEntries());
        break;

    case 'add':     echo json_encode(addCustomCNAMEEntry());
        break;

    case 'delete':  echo json_encode(deleteCustomCNAMEEntry());
        break;

    default:
        exit('Wrong action');
}
