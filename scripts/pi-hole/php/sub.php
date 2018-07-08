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
        exec("sudo pihole -w -q -d ${_POST['domain']}");
        break;
    case "black":
        exec("sudo pihole -b -q -d ${_POST['domain']}");
        break;
    case "regex":
        if(($list = file_get_contents($regexfile)) === FALSE)
        {
            $err = error_get_last()["message"];
            echo "Unable to read ${regexfile}<br>Error message: $err";
        }

        // Remove the regex and any empty lines from the list
        $list = explode("\n", $list);
        $list = array_diff($list, array($_POST['domain'], ""));
        $list = implode("\n", $list);

        if(file_put_contents($regexfile, $list) === FALSE)
        {
            $err = error_get_last()["message"];
            echo "Unable to remove regex \"".htmlspecialchars($_POST['domain'])."\" from ${regexfile}<br>Error message: $err";
        }
        else
        {
            // Send SIGHUP to pihole-FTL using a frontend command
            // to force reloading of the regex domains
            // This will also wipe the resolver's cache
            echo exec("sudo pihole restartdns reload");
        }
        break;
}

?>
