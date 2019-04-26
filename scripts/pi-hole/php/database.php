<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */

function SQLite3_connect_try($filename, $mode, $trytoreconnect)
{	try
	{
		// connect to database
		return new SQLite3($filename, $mode);
	}
	catch (Exception $exception)
	{
		// sqlite3 throws an exception when it is unable to connect, try to reconnect after 3 seconds
		if($trytoreconnect)
		{
			sleep(3);
			$db = SQLite3_connect_try($filename, $mode, false);
		}
	}
}

function SQLite3_connect($filename, $mode=SQLITE3_OPEN_READONLY)
{
	if(strlen($filename) > 0)
	{
		$db = SQLite3_connect_try($filename, $mode, true);
	}
	else
	{
		die("No database available");
	}
	if(!$db)
	{
		die("Error connecting to database");
	}
	return $db;
}
?>
