<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require "password.php";
if (!$auth) die("Not authorized");

require_once 'func.php';

ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

// Test if domain is set
if (isset($_GET["domain"])) {
    // Is this a valid domain?
    $url = $_GET["domain"];
    if (!is_valid_domain_name($url)) {
        echoEvent("Invalid domain!");
        die();
    }
} else {
    echoEvent("No domain provided");
    die();
}

if (isset($_GET["exact"])) {
    $exact = "-exact";
} else {
    $exact = "";
}

$proc = popen("sudo pihole -q " . $url . " " . $exact, 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
