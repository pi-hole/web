<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('auth.php');

$list = $_POST['list'];

// Perform all of the authentication for list editing
// when NOT invoked and authenticated from API
if (empty($api)) {
    list_verify($list);
}

// Split individual domains into array
$domains = preg_split('/\s+/', trim($_POST['domain']));

// Get comment if available
$comment = null;
if(isset($_POST['comment'])) {
	$comment = trim($_POST['comment']);
}

// Convert domain name to IDNA ASCII form for international domains
// Do this only for exact domains, not for regex filters
// Only do it when the php-intl extension is available
if (extension_loaded("intl") && ($list === "white" || $list === "black")) {
	foreach($domains as &$domain)
	{
		$domain = idn_to_ascii($domain);
	}
}

// Only check domains we add to the exact lists.
// Regex are validated by FTL during import
$check_lists = ["white","black","audit"];
if(in_array($list, $check_lists)) {
    check_domain($domains);
}

require_once("func.php");
require_once("database.php");
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

$reload = true;
switch($list) {
	case "white":
		$domains = array_map('strtolower', $domains);
		echo add_to_table($db, "domainlist", $domains, $comment, false, false, ListType::whitelist);
		break;

	case "black":
		$domains = array_map('strtolower', $domains);
		echo add_to_table($db, "domainlist", $domains, $comment, false, false, ListType::blacklist);
		break;

	case "white_regex":
		echo add_to_table($db, "domainlist", $domains, $comment, false, false, ListType::regex_whitelist);
		break;

	case "white_wild":
		echo add_to_table($db, "domainlist", $domains, $comment, true, false, ListType::regex_whitelist);
		break;

	case "black_regex":
		echo add_to_table($db, "domainlist", $domains, $comment, false, false, ListType::regex_blacklist);
		break;

	case "black_wild":
		echo add_to_table($db, "domainlist", $domains, $comment, true, false, ListType::regex_blacklist);
		break;

	case "audit":
		$reload = false;
		echo add_to_table($db, "domain_audit", $domains);
		break;

	default:
		die("Invalid list!");
}

// Reload lists in pihole-FTL after having added something
if ($reload) {
	echo shell_exec("sudo pihole restartdns reload-lists");
}
?>

