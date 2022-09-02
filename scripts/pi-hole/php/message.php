<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2021 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require_once 'auth.php';
require_once 'func.php';
require_once 'database.php';

// Authentication checks
if (!isset($api)) {
    if (isset($_POST['token'])) {
        check_cors();
        check_csrf($_POST['token']);
    } else {
        log_and_die('Not allowed (login session invalid or expired, please relogin on the Pi-hole dashboard)!');
    }
}

$reload = false;

$QueriesDB = getQueriesDBFilename();
$db = SQLite3_connect($QueriesDB, SQLITE3_OPEN_READWRITE);

// Delete message identified by IDs
if ($_POST['action'] == 'delete_message' && isset($_POST['id'])) {
    try {
        $ids = json_decode($_POST['id']);
        if (!is_array($ids)) {
            throw new Exception('Invalid payload: id is not an array');
        }
        // Exploit prevention: Ensure all entries in the ID array are integers
        foreach ($ids as $value) {
            if (!is_numeric($value)) {
                throw new Exception('Invalid payload: id contains non-numeric entries');
            }
        }
        $stmt = $db->prepare('DELETE FROM message WHERE id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing message statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing message statement: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} else {
    log_and_die('Requested action not supported!');
}
