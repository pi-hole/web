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

function add_regex($regex)
{
    global $regexfile;
    if(file_put_contents($regexfile, "\n".$regex, FILE_APPEND) === FALSE)
    {
        $err = error_get_last()["message"];
        echo "Unable to add regex \"".htmlspecialchars($regex)."\" to ${regexfile}<br>Error message: $err";
    }
    else
    {
        // Send SIGHUP to pihole-FTL using a frontend command
        // to force reloading of the regex domains
        // This will also wipe the resolver's cache
        echo exec("sudo pihole restartdns reload");
    }
}

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
        // Escape "." so it won't be interpreted as the wildcard character
        $domain = str_replace(".","\.",$_POST['domain']);
        // Add regex filter for legacy wildcard behavior
        add_regex("((^)|(\.))".$domain."$");
    case "regex":
        add_regex($_POST['domain']);
    case "audit":
        echo exec("sudo pihole -a audit ${_POST['domain']}");
        break;
}

?>
