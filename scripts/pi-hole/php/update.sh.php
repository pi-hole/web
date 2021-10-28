<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require "password.php";
if(!$auth) die("Not authorized");

ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

$proc = popen("sudo pihole -up", 'r');
while (!feof($proc)) {
	echo "data: ".implode("\ndata: ", explode("\n",fread($proc, 4096)))."\n\n";
}
?>
