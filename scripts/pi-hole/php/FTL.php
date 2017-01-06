<?php

function connectFTL($address, $port, $quiet=true)
{
	if(!$quiet)
	{
		echo "Attempting to connect to '$address' on port '$port'...\n";
	}

	// Create a TCP/IP socket
	$socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP)
	or die("socket_create() failed: reason: " . socket_strerror(socket_last_error()) . "\n");

	$result = socket_connect($socket, $address, $port)
	or die("socket_connect() failed.\nReason: ($result) " . socket_strerror(socket_last_error($socket)) . "\n");

	socket_set_nonblock($socket);

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
		$response[] = rtrim($out);
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
