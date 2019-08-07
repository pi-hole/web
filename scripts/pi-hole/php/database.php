<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */

function getGravityDBFilename()
{
	// Get possible non-standard location of FTL's database
	$FTLsettings = parse_ini_file("/etc/pihole/pihole-FTL.conf");
	if(isset($FTLsettings["GRAVITYDB"]))
	{
		return $FTLsettings["GRAVITYDB"];
	}
	else
	{
		return "/etc/pihole/gravity.db";
	}
}

function SQLite3_connect_try($filename, $mode, $trytoreconnect)
{
	try
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

	// Add busy timeout so methods don't fail immediately when, e.g., FTL is currently reading from the DB
	$db->busyTimeout(5000);

	return $db;
}


/**
 * Add domains to a given table
 *
 * @param $db object The SQLite3 database connection object
 * @param $table string The target table
 * @param $domains array Array of domains (strings) to be added to the table
 * @param $wildcardstyle boolean Whether to format the input domains in legacy wildcard notation
 * @param $returnnum boolean Whether to return an integer or a string
 * @return string Success/error and number of processed domains
 */
function add_to_table($db, $table, $domains, $wildcardstyle=false, $returnnum=false)
{
	// Prepare SQLite statememt
	$stmt = $db->prepare("INSERT OR IGNORE INTO ".$table." (domain) VALUES (:domain);");

	// Return early if we failed to prepare the SQLite statement
	if(!$stmt)
	{
		echo "Failed to prepare statement for ".$table." table.";
		if($returnnum)
			return 0;
		else
			return "Error, added: 0\n";
	}

	// Loop over domains and inject the lines into the database
	$num = 0;
	foreach($domains as $domain)
	{
		if($wildcardstyle)
			$domain = "(\\.|^)".str_replace(".","\\.",$domain)."$";

		$stmt->bindValue(":domain", $domain, SQLITE3_TEXT);

		if($stmt->execute() && $stmt->reset())
			$num++;
		else
		{
			$stmt->close();
			if($returnnum)
				return $num;
			else
				return "Error, added: ".$num."\n";
		}
	}

	// Close prepared statement and return number of processed rows
	$stmt->close();
	if($returnnum)
		return $num;
	else
		return "Success, added: ".$num."\n";
}

/**
 * Remove domains from a given table
 *
 * @param $db object The SQLite3 database connection object
 * @param $table string The target table
 * @param $domains array Array of domains (strings) to be removed from the table
 * @param $returnnum boolean Whether to return an integer or a string
 * @return string Success/error and number of processed domains
 */
function remove_from_table($db, $table, $domains, $returnnum=false)
{
	// Prepare SQLite statememt
	$stmt = $db->prepare("DELETE FROM ".$table." WHERE domain = :domain;");

	// Return early if we failed to prepare the SQLite statement
	if(!$stmt)
	{
		echo "Failed to prepare statement for ".$table." table.";
		if($returnnum)
			return 0;
		else
			return "Error, added: 0\n";
	}

	// Loop over domains and remove the lines from the database
	$num = 0;
	foreach($domains as $domain)
	{
		$stmt->bindValue(":domain", $domain, SQLITE3_TEXT);

		if($stmt->execute() && $stmt->reset())
			$num++;
		else
		{
			$stmt->close();
			if($returnnum)
				return $num;
			else
				return "Error, removed: ".$num."\n";
		}
	}

	// Close prepared statement and return number or processed rows
	$stmt->close();
	if($returnnum)
		return $num;
	else
		return "Success, removed: ".$num."\n";
}

?>
