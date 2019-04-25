<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

if(!isset($_GET['list']))
    die("Missing parameter");

$listtype = $_GET['list'];

require_once("func.php");

// Get possible non-standard location of FTL's database
$FTLsettings = parse_ini_file("/etc/pihole/pihole-FTL.conf");
if(isset($FTLsettings["GRAVITYDB"]))
{
	$GRAVITYDB = $FTLsettings["GRAVITYDB"];
}
else
{
	$GRAVITYDB = "/etc/pihole/gravity.db";
}

function SQLite3_connect($dbfile, $trytoreconnect)
{
	try
	{
		// connect to database
		return new SQLite3($dbfile, SQLITE3_OPEN_READONLY);
	}
	catch (Exception $exception)
	{
		// sqlite3 throws an exception when it is unable to connect, try to reconnect after 3 seconds
		if($trytoreconnect)
		{
			sleep(3);
			$db = SQLite3_connect($dbfile, false);
		}
	}
}

if(strlen($GRAVITYDB) > 0)
{
	$db = SQLite3_connect($GRAVITYDB, true);

	// Check if we successfully opened the database
	if(!$db)
	{
		die("Error connecting to database");
	}
}
else
{
	die("No database available");
}

function getTableContent($listname) {
	global $db;
	$entries = array();
	$results = $db->query("SELECT * FROM $listname");

	while($results !== false && $res = $results->fetchArray(SQLITE3_ASSOC))
	{
		array_push($entries, $res);
	}

	return array($listname => $entries);
}

function filterArray(&$inArray) {
	$outArray = array();
	foreach ($inArray as $key => $value)
	{
		if (is_array($value))
		{
			$outArray[htmlspecialchars($key)] = filterArray($value);
		}
		else
		{
			$outArray[htmlspecialchars($key)] = htmlspecialchars($value);
		}
	}
	return $outArray;
}

switch ($listtype)
{
	case "white":
		$list = getTableContent("whitelist");
		break;

	case "black":
		$exact = getTableContent("blacklist");
		$regex = getTableContent("regex");
		$list = array_merge($exact, $regex);
		break;

	default:
		die("Invalid list parameter");
		break;
}
// Protect against XSS attacks
$output = filterArray($list);

// Return results
header('Content-type: application/json');
echo json_encode($output);
