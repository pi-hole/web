<?php
require('auth.php');

switch($_POST['list']) {
    case "white":
        echo exec("sudo pihole -w -q ${_POST['domain']}");
        break;
    case "black":
        echo exec("sudo pihole -b -q ${_POST['domain']}");
        break;
}

?>
