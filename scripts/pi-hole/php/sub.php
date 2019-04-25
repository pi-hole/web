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

// Don't check if the added item is a valid domain for regex expressions.
// Regex filters are validated by FTL on import and skipped if invalid
if($type !== "regex") {
    check_domain();
}

// Escape shell metacharacters
$domain = escapeshellcmd($_POST['domain']);

switch($type) {
    case "white":
        exec("sudo pihole -w -q -d ".$domain);
        break;
    case "black":
        exec("sudo pihole -b -q -d ".$domain);
        break;
    case "regex":
        exec("sudo pihole --regex -q -d ".$domain);
        break;
}

?>
