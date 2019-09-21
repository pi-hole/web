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

require("database.php");
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB);

function getTableContent($listname) {
	global $db;
	$entries = array();
	$querystr = implode(" ",array("SELECT ${listname}.*,\"group\".enabled as group_enabled",
	                              "FROM ${listname}",
	                              "LEFT JOIN ${listname}_by_group ON ${listname}_by_group.${listname}_id = ${listname}.id",
	                              "LEFT JOIN \"group\" ON \"group\".id = ${listname}_by_group.group_id",
	                              "GROUP BY domain;"));
	$results = $db->query($querystr);

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
		$exact = getTableContent("whitelist");
		$regex = getTableContent("regex_whitelist");
		$list  = array_merge($exact, $regex);
		break;

	case "black":
		$exact = getTableContent("blacklist");
		$regex = getTableContent("regex_blacklist");
		$list  = array_merge($exact, $regex);
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
