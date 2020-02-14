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

function getTableContent($type) {
	global $db;
	$entries = array();
	$querystr = implode(" ",array("SELECT domainlist.*,\"group\".enabled as group_enabled",
	                              "FROM domainlist",
	                              "LEFT JOIN domainlist_by_group ON domainlist_by_group.domainlist_id = domainlist.id",
	                              "LEFT JOIN \"group\" ON \"group\".id = domainlist_by_group.group_id",
	                              "WHERE type = $type",
	                              "GROUP BY domain;"));
	$results = $db->query($querystr);

	while($results !== false && $res = $results->fetchArray(SQLITE3_ASSOC))
	{
		if ($res['type'] === ListType::whitelist || $res['type'] === ListType::blacklist) {
			$utf8_domain = idn_to_utf8($res['domain']);
			// Convert domain name to international form
			// if applicable
			if($res['domain'] !== $utf8_domain)
			{
				$res['domain'] = $utf8_domain.' ('.$res['domain'].')';
			}
		}
		array_push($entries, $res);
	}

	return $entries;
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
		$exact = array("whitelist" => getTableContent(ListType::whitelist));
		$regex = array("regex_whitelist" => getTableContent(ListType::regex_whitelist));
		$list  = array_merge($exact, $regex);
		break;

	case "black":
		$exact = array("blacklist" => getTableContent(ListType::blacklist));
		$regex = array("regex_blacklist" => getTableContent(ListType::regex_blacklist));
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
