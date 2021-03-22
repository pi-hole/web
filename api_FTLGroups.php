<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */


if(!isset($api))
{
	die("Direct call to api_FTLGroups.php is not allowed!");
}

if ((isset($_GET['enableGroup']) || isset($_GET['disableGroup'])) && $auth) {
	// Enable or disable group based on name

	$GRAVITYDB = getGravityDBFilename();
	$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

	$groupname="";
	$enabled=0;

	if (isset($_GET['enableGroup'])) {
		$groupname=$_GET['enableGroup'];
		$enabled=1;
	} elseif (isset($_GET['disableGroup'])) {

		$groupname=$_GET['disableGroup'];
		$enabled=0;
	} else {
		die("We shouldn't ever be here");
	}

	try {
		$stmt = $db->prepare('UPDATE "group" SET enabled=:enabled WHERE name = :name');
		if (!$stmt) {
			throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
		}

		$status = ((int) $enabled) !== 0 ? 1 : 0;
		if (!$stmt->bindValue(':enabled', $enabled, SQLITE3_INTEGER)) {
			throw new Exception('While binding enabled: ' . $db->lastErrorMsg());
		}

		if (!$stmt->bindValue(':name', $groupname, SQLITE3_TEXT)) {
			throw new Exception('While binding name: ' . $db->lastErrorMsg());
		}

		if (!$stmt->execute()) {
			throw new Exception('While executing: ' . $db->lastErrorMsg());
		}
		
		pihole_execute('restartdns reload-lists');

		$data=array('success' => true, 'message' => 'No exceptions thrown');	
	} catch (\Exception $ex) {
		$data=array('success' => false, 'message' => $ex->getMessage());
	}
} elseif (isset($_GET['getGroupEnabled']) && $auth) {
	//Check status of group

	$GRAVITYDB = getGravityDBFilename();
	$db = SQLite3_connect($GRAVITYDB);

	try {
		$stmt = $db->prepare('SELECT enabled FROM "group" WHERE name = :name');
		if (!$stmt) {
			throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
		}

		if (!$stmt->bindValue(':name', $_GET['getGroupEnabled'], SQLITE3_TEXT)) {
			throw new Exception('While binding name: ' . $db->lastErrorMsg());
		}

		$results = $stmt->execute();
		
		if (is_bool($results)) {
			throw new Exception('While executing: ' . $db->lastErrorMsg());
		}

		$data=array('success' => true, 'group' => $_GET['getGroupEnabled'], 'enabled' => (bool)($results->fetchArray())['enabled']);

	} catch (\Exception $ex) {
		$data=array('success' => false, 'message' => $ex->getMessage());
	}

}
?>
