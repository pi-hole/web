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

// Don't check if the added item is a valid domain for regex expressions. Regex
// filters are validated by FTL on import and skipped if invalid
$check_lists = ["white","black","audit"];
if(in_array($list, $check_lists)) {
    check_domain();
}

// Escape shell metacharacters
$domains = explode(",",$_POST['domain']);

require_once("func.php");

require("database.php");
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

function add_to_table($table, $domains, $wildcardstyle=false)
{
	global $db;
	// Prepare SQLite statememt
	$stmt = $db->prepare("INSERT OR IGNORE INTO ".$table." (domain) VALUES (:domain);");

	// Return early if we prepare the SQLite statement
	if(!$stmt)
	{
		echo "Failed to prepare statement for ".$table." table.";
		echo $sql;
		return 0;
	}

	// Loop over domains and inject the lines into the database
	$num = 0;
	foreach($domains as $row)
	{
		if($wildcardstyle)
			$line = "(\\.|^)".str_replace(".","\\.",$row)."$";
		else
			$line = $row;

		$stmt->bindValue(":domain", $line, SQLITE3_TEXT);

		if($stmt->execute() && $stmt->reset() && $stmt->clear())
			$num++;
		else
		{
			$stmt->close();
			return "Error, added: ".$num."\n";
		}
	}

	// Close database connection and return number or processed rows
	$stmt->close();
	return "Success, added: ".$num."\n";
}

switch($type) {
	case "white":
		if(isset($_POST["auditlog"]))
			echo add_to_table("domain_audit", $domains);
		echo add_to_table("whitelist", $domains);
		break;

	case "black":
		if(isset($_POST["auditlog"]))
			echo add_to_table("domain_audit", $domains);
		echo add_to_table("blacklist", $domains);
		break;

	case "black_regex":
		echo add_to_table("regex_blacklist", $domains);
		break;

	case "white_regex":
		echo add_to_table("regex_whitelist", $domains);
		break;

	case "black_wild":
		echo add_to_table("regex_blacklist", $domains, true);
		break;

	case "white_wild":
		echo add_to_table("regex_whitelist", $domains, true);
		break;

	case "audit":
		echo add_to_table("domain_audit", $domains);
		break;
}
?>
