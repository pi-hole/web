<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */ ?>

<?php
require('auth.php');

$type = $_POST['list'];

// All of the verification for list editing
list_verify($type);

switch($type) {
    case "white":
        if(!isset($_POST["auditlog"]))
            echo exec("sudo pihole -w -q ${_POST['domain']}");
        else
        {
            echo exec("sudo pihole -w -q -n ${_POST['domain']}");
            echo exec("sudo pihole -a audit ${_POST['domain']}");
        }
        break;
    case "black":
        if(!isset($_POST["auditlog"]))
            echo exec("sudo pihole -b -q ${_POST['domain']}");
        else
        {
            echo exec("sudo pihole -b -q -n ${_POST['domain']}");
            echo exec("sudo pihole -a audit ${_POST['domain']}");
        }
        break;
    case "wild":
        if(!isset($_POST["auditlog"]))
            echo exec("sudo pihole -wild -q ${_POST['domain']}");
        else
        {
            echo exec("sudo pihole -wild -q -n ${_POST['domain']}");
            echo exec("sudo pihole -a audit ${_POST['domain']}");
        }
    case "audit":
        echo exec("sudo pihole -a audit ${_POST['domain']}");
        break;
}

?>
