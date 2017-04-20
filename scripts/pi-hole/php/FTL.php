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
	$timeout = 3;

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

	socket_set_nonblock($socket) or die("Unable to set nonblock on socket\n");

	$time = time();
	while (!@socket_connect($socket, $address, $port))
	{
		$err = socket_last_error($socket);
		if ($err == 115 || $err == 114)
		{
			if ((time() - $time) >= $timeout)
			{
				socket_close($socket);
				die("Connection timed out.\n");
			}
			// Wait for 1 millisecond
			usleep(1000);
			continue;
		}
		die(socket_strerror($err) . "\n");
	}

	socket_set_block($socket) or die("Unable to set block on socket\n");

	// Set timeout to 3 seconds
	socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, ['sec'=>$timeout, 'usec'=>0]);
	socket_set_option($socket, SOL_SOCKET, SO_SNDTIMEO, ['sec'=>$timeout, 'usec'=>0]);

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
