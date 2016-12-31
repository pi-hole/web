<?php
require('auth.php');

$type = $_POST['list'];

// All of the verification for list editing
list_verify($type);

switch($type) {
    case "white":
        exec("sudo pihole -w -q -d ${_POST['domain']}");
        break;
    case "black":
        exec("sudo pihole -b -q -d ${_POST['domain']}");
        break;
    case "wild":
        exec("sudo pihole -wild -q -d ${_POST['domain']}");
        break;
}

?>
