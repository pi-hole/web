<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

function connectFTL($address, $port=4711)
{
	if($address == "127.0.0.1")
	{
		// Read port
		$portfile = file_get_contents("/var/run/pihole-FTL.port");
		if(is_numeric($portfile))
			$port = intval($portfile);
	}

	// Open Internet socket connection
	$socket = @fsockopen($address, $port, $errno, $errstr, 1.0);

	return $socket;
}
function sendRequestFTL($requestin)
{
	global $socket;

	$request = ">".$requestin;
	fwrite($socket, $request) or die("Could not send data to server\n");
}

function getResponseFTL()
{
	global $socket;

	$response = [];

	while(true)
	{
		$out = fgets($socket);
		if(strrpos($out,"---EOM---") !== false)
			break;

		$out = rtrim($out);
		if(strlen($out) > 0)
			$response[] = $out;
	}

	return $response;
}

function disconnectFTL()
{
	global $socket;
	fclose($socket);
}
?>
