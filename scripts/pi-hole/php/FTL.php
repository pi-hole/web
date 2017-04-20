<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

function testFTL()
{
	$ret = shell_exec("pidof pihole-FTL");
	return intval($ret);
}

function connectFTL($address, $port=4711, $quiet=true)
{
	if(!$quiet)
	{
		echo "Attempting to connect to '$address' on port '$port'...\n";
	}

	if($address == "127.0.0.1")
	{
		// Read port
		$portfile = file_get_contents("/var/run/pihole-FTL.port");
		if(is_numeric($portfile))
			$port = intval($portfile);
	}

	// Create a TCP/IP socket
	$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)
	or die("socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n");

	$result = socket_connect($socket, $address, $port)
	or die("socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($socket)) . "\n");

	// Set timeout to 10 seconds
	socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, ['sec'=>10, 'usec'=>0]);
	socket_set_option($socket, SOL_SOCKET, SO_SNDTIMEO, ['sec'=>10, 'usec'=>0]);

	if(!$quiet)
	{
		echo "Success!\n\n";
	}

	return $socket;
}
function sendRequestFTL($requestin, $quiet=true)
{
	global $socket;

	$request = ">".$requestin;
	if(!$quiet)
	{
		echo "Sending request (".$request.")...\n";
	}

	socket_write($socket, $request, strlen($request)) or die("Could not send data to server\n");
	if(!$quiet)
	{
		echo "OK.\n";
	}
}

function getResponseFTL($quiet=true)
{
	global $socket;
	if(!$quiet)
	{
		echo "Reading response:\n";
	}

	$response = [];

	while(true)
	{
		$out = socket_read($socket, 2048, PHP_NORMAL_READ);
		if(!$quiet)
		{
			echo $out;
		}
		if(strrpos($out,"---EOM---") !== false)
		{
			break;
		}
		$out = rtrim($out);
		if(strlen($out) > 0)
		{
			$response[] = $out;
		}
	}

	return $response;
}

function disconnectFTL($quiet=true)
{
	global $socket;
	if(!$quiet)
	{
		echo "Closing socket...";
	}

	socket_close($socket);

	if(!$quiet)
	{
		echo "OK.\n\n";
	}
}
?>
