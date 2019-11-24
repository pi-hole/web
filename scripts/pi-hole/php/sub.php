<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('auth.php');

$type = $_POST['list'];

// Perform all of the authentication for list editing
// when NOT invoked and authenticated from API
if (empty($api)) {
    list_verify($type);
}

// Don't check if the added item is a valid domain for regex expressions. Regex
// filters are validated by FTL on import and skipped if invalid
if($type !== "regex") {
    check_domain();
}

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

        if(file_put_contents($regexfile, $list."\n") === FALSE)
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
