<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header("Content-Type: text/event-stream");
header("Cache-Control: no-cache");
ini_set("pcre.recursion_limit", 1500);

function validate_domain($domain) { // Cr: http://stackoverflow.com/a/4694816
    return (preg_match("/^([a-z\d]((-|_)*[a-z\d])*)(\.([a-z\d]((-|_)*[a-z\d])*))*$/i", $domain) // Valid chars check
        && preg_match("/^.{1,253}$/", $domain) // Overall length check
        && preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain)); // Length of each label
}

// Validate domain, if set
if(isset($_GET["domain"])) {
    if(validate_domain($_GET["domain"])) {
        $domain = $_GET["domain"];
    } else {
        die("::: Invalid domain");
    }
} else {
    die("::: Domain query not specified");
}

$exact = isset($_GET["exact"]) ? "-exact" : "";

$proc = popen("sudo pihole -q ".escapeshellarg($domain)." $exact", "r");
while (!feof($proc)) {
    echo fread($proc, 4096);
}
?>
