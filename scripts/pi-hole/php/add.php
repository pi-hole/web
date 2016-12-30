<?php
require('auth.php');

$type = $_POST['list'];

// All of the verification for list editing
list_verify($type);

switch($type) {
    case "white":
        echo exec("sudo pihole -w -q ${_POST['domain']}");
        break;
    case "black":
        echo exec("sudo pihole -b -q ${_POST['domain']}");
        break;
}

?>
