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

switch($type) {
	case "white":
		echo remove_from_table($db, "whitelist", $domains);
		break;

	case "black":
		echo remove_from_table($db, "blacklist", $domains);
		break;

	case "black_regex":
		echo remove_from_table($db, "regex_blacklist", $domains);
		break;

	case "white_regex":
		echo remove_from_table($db, "regex_whitelist", $domains);
		break;

	default:
		echo "Invalid list!";
		exit();
		break;
}

// Reload lists in pihole-FTL after having removed something
echo shell_exec("sudo pihole restartdns reload");
?>
