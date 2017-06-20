<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require "password.php";
if(!$auth) die("Not authorized");

// Not using SplFileObject here, since direct
// usage of f-streams will be much faster for
// files as large as the pihole.log
if(isset($_GET["FTL"]))
{
	$file = fopen("/var/log/pihole-FTL.log","r");
}
else
{
	$file = fopen("/var/log/pihole.log","r");
}

if(!$file)
{
	die(json_encode(array("offset" => 0, "lines" => array("Failed to open log file. Check permissions!\n"))));
}

if(isset($_GET["offset"]))
{
	$offset = intval($_GET['offset']);
	if($offset > 0)
	{
		// Seeks on the file pointer where we want to continue reading is known
		fseek($file, $offset);
		$lines = [];
		while (!feof($file))
			array_push($lines, htmlspecialchars(fgets($file)));
		die(json_encode(array("offset" => ftell($file), "lines" => $lines)));
	}
}

// Locate the current position of the file read/write pointer
fseek($file, -1, SEEK_END);
// Add one to skip the very last "\n" in the log file
die(json_encode(array("offset" => ftell($file)+1)));

?>
