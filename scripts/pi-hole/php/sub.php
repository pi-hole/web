<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('auth.php');

$type = $_POST['list'];

// Perform all of the authentication for list editing
// when NOT invoked and authenticated from API
if (empty($api)) {
    list_verify($type);
}

// Escape shell metacharacters
$domains = explode(",",$_POST['domain']);

require_once("func.php");

require("database.php");
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

function remove_from_table($table, $domains)
{
	global $db;
	// Prepare SQLite statememt
	$stmt = $db->prepare("DELETE FROM ".$table." WHERE domain = :domain;");

	// Return early if we prepare the SQLite statement
	if(!$stmt)
	{
		echo "Failed to prepare statement for ".$table." table.";
		echo $sql;
		return 0;
	}

	// Loop over domains and remove the lines from the database
	$num = 0;
	foreach($domains as $row)
	{
		$stmt->bindValue(":domain", $row, SQLITE3_TEXT);

		if($stmt->execute() && $stmt->reset() && $stmt->clear())
			$num++;
		else
		{
			$stmt->close();
			return "Error, removed: ".$num."\n";
		}
	}

	// Close database connection and return number or processed rows
	$stmt->close();
	return "Success, removed: ".$num."\n";
}

switch($type) {
	case "white":
		echo remove_from_table("whitelist", $domains);
		break;

	case "black":
		echo remove_from_table("blacklist", $domains);
		break;

	case "black_regex":
		echo remove_from_table("regex_blacklist", $domains);
		break;

	case "white_regex":
		echo remove_from_table("regex_whitelist", $domains);
		break;
}
?>
