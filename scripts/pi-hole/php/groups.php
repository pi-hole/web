<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
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

$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

function verify_ID_array($arr)
{
    if (!is_array($arr)) {
        throw new Exception('Invalid payload: id is not an array');
    }

    // Exploit prevention: Ensure all entries in the ID array are integers
    foreach ($arr as $value) {
        if (!is_numeric($value)) {
            throw new Exception('Invalid payload: id contains non-numeric entries');
        }
    }
}

if ($_POST['action'] == 'get_groups') {
    // List all available groups
    try {
        $query = $db->query('SELECT * FROM "group";');
        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            array_push($data, $res);
        }

        header('Content-type: application/json');
        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_group') {
    // Add new group
    try {
        $input = html_entity_decode(trim($_POST['name']));
        $names = str_getcsv($input, ' ');
        $total = count($names);
        $added = 0;
        $stmt = $db->prepare('INSERT INTO "group" (name,description) VALUES (:name,:desc)');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $desc = $_POST['desc'];
        if (strlen($desc) === 0) {
            // Store NULL in database for empty descriptions
            $desc = null;
        }
        if (!$stmt->bindValue(':desc', $desc, SQLITE3_TEXT)) {
            throw new Exception('While binding desc: '.$db->lastErrorMsg());
        }

        foreach ($names as $name) {
            // Silently skip this entry when it is empty or not a string (e.g. NULL)
            if (!is_string($name) || strlen($name) == 0) {
                continue;
            }

            if (!$stmt->bindValue(':name', $name, SQLITE3_TEXT)) {
                throw new Exception('While binding name: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' groups');
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' groups');
            }
            ++$added;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_group') {
    // Edit group identified by ID
    try {
        $name = html_entity_decode($_POST['name']);
        $desc = html_entity_decode($_POST['desc']);

        $stmt = $db->prepare('UPDATE "group" SET enabled=:enabled, name=:name, description=:desc WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $status = ((int) $_POST['status']) !== 0 ? 1 : 0;
        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':name', $name, SQLITE3_TEXT)) {
            throw new Exception('While binding name: '.$db->lastErrorMsg());
        }

        if (strlen($desc) === 0) {
            // Store NULL in database for empty descriptions
            $desc = null;
        }
        if (!$stmt->bindValue(':desc', $desc, SQLITE3_TEXT)) {
            throw new Exception('While binding desc: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_group') {
    // Delete group identified by ID
    try {
        $ids = json_decode($_POST['id']);

        // Exploit prevention: Ensure all entries in the ID array are integers
        verify_ID_array($ids);

        $table_name = array('domainlist_by_group', 'client_by_group', 'adlist_by_group', '"group"'); // quote reserved word
        $table_keys = array('group_id', 'group_id', 'group_id', 'id');

        for ($i = 0; $i < count($table_name); ++$i) {
            $table = $table_name[$i];
            $key = $table_keys[$i];

            $stmt = $db->prepare('DELETE FROM '.$table.' WHERE '.$key.' IN ('.implode(',', $ids).')');
            if (!$stmt) {
                throw new Exception("While preparing DELETE FROM {$table} statement: ".$db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception("While executing DELETE FROM {$table} statement: ".$db->lastErrorMsg());
            }

            if (!$stmt->reset()) {
                throw new Exception("While resetting DELETE FROM {$table} statement: ".$db->lastErrorMsg());
            }
        }
        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_clients') {
    // List all available groups
    try {
        $QUERYDB = getQueriesDBFilename();
        $FTLdb = SQLite3_connect($QUERYDB);

        $query = $db->query('SELECT * FROM client;');
        if (!$query) {
            throw new Exception('Error while querying gravity\'s client table: '.$db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM client_by_group WHERE client_id = '.$res['id'].';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s client_by_group table: '.$db->lastErrorMsg());
            }

            $stmt = $FTLdb->prepare('SELECT name FROM network_addresses WHERE ip = :ip;');
            if (!$stmt) {
                throw new Exception('Error while preparing network table statement: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':ip', $res['ip'], SQLITE3_TEXT)) {
                throw new Exception('While binding to network table statement: '.$db->lastErrorMsg());
            }

            $result = $stmt->execute();
            if (!$result) {
                throw new Exception('While executing network table statement: '.$db->lastErrorMsg());
            }

            // Check if got a hostname from the database. This may not be the case if the client is
            // specified by MAC address, a hostname or via a more general selector like an interface.
            $name_result = $result->fetchArray(SQLITE3_ASSOC);
            if (!is_bool($name_result)) {
                $res['name'] = $name_result['name'];
                error_log('IP: '.$name_result['name']);
            } else {
                // Check if we can get a host name from the database when looking up the MAC
                // address of this client instead.
                $stmt = $FTLdb->prepare('SELECT name FROM network n JOIN network_addresses na ON na.network_id = n.id WHERE hwaddr=:hwaddr COLLATE NOCASE AND name IS NOT NULL;');
                if (!$stmt) {
                    throw new Exception('Error while preparing network table statement: '.$db->lastErrorMsg());
                }

                if (!$stmt->bindValue(':hwaddr', $res['ip'], SQLITE3_TEXT)) {
                    throw new Exception('While binding to network table statement: '.$db->lastErrorMsg());
                }

                $result = $stmt->execute();
                if (!$result) {
                    throw new Exception('While executing network table statement: '.$db->lastErrorMsg());
                }

                // Check if we found a result. There may be multiple entries for
                // this client in the network_addresses table. We use the first
                // hostname we find for the sake of simplicity.
                $name_result = $result->fetchArray(SQLITE3_ASSOC);
                if (!is_bool($name_result)) {
                    $res['name'] = $name_result['name'];
                } else {
                    $res['name'] = null;
                }
            }

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $group_query->finalize();
            $res['groups'] = $groups;
            array_push($data, $res);
        }

        header('Content-type: application/json');
        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_unconfigured_clients') {
    // List all available clients WITHOUT already configured clients
    try {
        $QUERYDB = getQueriesDBFilename();
        $FTLdb = SQLite3_connect($QUERYDB);

        $query = $FTLdb->query('SELECT DISTINCT id,hwaddr,macVendor FROM network ORDER BY firstSeen DESC;');
        if (!$query) {
            throw new Exception('Error while querying FTL\'s database: '.$db->lastErrorMsg());
        }

        // Loop over results
        $ips = array();
        while ($res = $query->fetchArray(SQLITE3_ASSOC)) {
            $id = intval($res['id']);

            // Get possibly associated IP addresses and hostnames for this client
            $query_ips = $FTLdb->query("SELECT ip,name FROM network_addresses WHERE network_id = {$id} ORDER BY lastSeen DESC;");
            $addresses = array();
            $names = array();
            while ($res_ips = $query_ips->fetchArray(SQLITE3_ASSOC)) {
                array_push($addresses, utf8_encode($res_ips['ip']));
                if ($res_ips['name'] !== null) {
                    array_push($names, utf8_encode($res_ips['name']));
                }
            }
            $query_ips->finalize();

            // Prepare extra information
            $extrainfo = '';
            // Add list of associated host names to info string (if available)
            if (count($names) === 1) {
                $extrainfo .= 'hostname: '.$names[0];
            } elseif (count($names) > 0) {
                $extrainfo .= 'hostnames: '.implode(', ', $names);
            }

            // Add device vendor to info string (if available)
            if (strlen($res['macVendor']) > 0) {
                if (count($names) > 0) {
                    $extrainfo .= '; ';
                }
                $extrainfo .= 'vendor: '.htmlspecialchars($res['macVendor']);
            }

            // Add list of associated host names to info string (if available and if this is not a mock device)
            if (stripos($res['hwaddr'], 'ip-') === false) {
                if ((count($names) > 0 || strlen($res['macVendor']) > 0) && count($addresses) > 0) {
                    $extrainfo .= '; ';
                }

                if (count($addresses) === 1) {
                    $extrainfo .= 'address: '.$addresses[0];
                } elseif (count($addresses) > 0) {
                    $extrainfo .= 'addresses: '.implode(', ', $addresses);
                }
            }

            $ips[strtoupper($res['hwaddr'])] = $extrainfo;
        }
        $FTLdb->close();

        $query = $db->query('SELECT ip FROM client;');
        if (!$query) {
            throw new Exception('Error while querying gravity\'s database: '.$db->lastErrorMsg());
        }

        // Loop over results, remove already configured clients
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            if (isset($ips[$res['ip']])) {
                unset($ips[$res['ip']]);
            }
            if (isset($ips['IP-'.$res['ip']])) {
                unset($ips['IP-'.$res['ip']]);
            }
        }

        header('Content-type: application/json');
        echo json_encode($ips);
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_client') {
    // Add new client
    try {
        $ips = explode(' ', trim($_POST['ip']));
        $total = count($ips);
        $added = 0;
        $stmt = $db->prepare('INSERT INTO client (ip,comment) VALUES (:ip,:comment)');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        foreach ($ips as $ip) {
            // Encode $ip variable to prevent XSS
            $ip = htmlspecialchars($ip);
            // Silently skip this entry when it is empty or not a string (e.g. NULL)
            if (!is_string($ip) || strlen($ip) == 0) {
                continue;
            }

            if (!$stmt->bindValue(':ip', $ip, SQLITE3_TEXT)) {
                throw new Exception('While binding ip: '.$db->lastErrorMsg());
            }

            $comment = html_entity_decode($_POST['comment']);
            if (strlen($comment) === 0) {
                // Store NULL in database for empty comments
                $comment = null;
            }
            if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
                throw new Exception('While binding comment: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' clients');
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' clients');
            }
            ++$added;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_client') {
    // Edit client identified by ID
    try {
        $db->query('BEGIN TRANSACTION;');

        $stmt = $db->prepare('UPDATE client SET comment=:comment WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $comment = html_entity_decode($_POST['comment']);
        if (strlen($comment) === 0) {
            // Store NULL in database for empty comments
            $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: '.$db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM client_by_group WHERE client_id = :id');
        if (!$stmt) {
            throw new Exception('While preparing DELETE statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing DELETE statement: '.$db->lastErrorMsg());
        }

        $groups = array();
        if (isset($_POST['groups'])) {
            $groups = $_POST['groups'];
        }
        foreach ($groups as $gid) {
            $stmt = $db->prepare('INSERT INTO client_by_group (client_id,group_id) VALUES(:id,:gid);');
            if (!$stmt) {
                throw new Exception('While preparing INSERT INTO statement: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                throw new Exception('While binding gid: '.$db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing INSERT INTO statement: '.$db->lastErrorMsg());
            }
        }
        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_client') {
    // Delete client identified by ID
    try {
        $ids = json_decode($_POST['id']);

        // Exploit prevention: Ensure all entries in the ID array are integers
        verify_ID_array($ids);

        $db->query('BEGIN TRANSACTION;');

        // Delete from: client_by_group
        $stmt = $db->prepare('DELETE FROM client_by_group WHERE client_id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing client_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing client_by_group statement: '.$db->lastErrorMsg());
        }

        // Delete from: client
        $stmt = $db->prepare('DELETE FROM client WHERE id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing client statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing client statement: '.$db->lastErrorMsg());
        }
        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_domains') {
    // List all available groups
    try {
        $limit = '';
        if (isset($_POST['type']) && is_numeric($_POST['type'])) {
            $limit = ' WHERE type = '.$_POST['type'];
        }
        $query = $db->query('SELECT * FROM domainlist'.$limit);
        if (!$query) {
            throw new Exception('Error while querying gravity\'s domainlist table: '.$db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM domainlist_by_group WHERE domainlist_id = '.$res['id'].';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s domainlist_by_group table: '.$db->lastErrorMsg());
            }

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $res['groups'] = $groups;
            if ($res['type'] === LISTTYPE_WHITELIST || $res['type'] === LISTTYPE_BLACKLIST) {
                // Convert domain name to international form
                // Skip this for the root zone `.`
                if ($res['domain'] != '.') {
                    $utf8_domain = convertIDNAToUnicode($res['domain']);

                    // if domain and international form are different, show both
                    if ($res['domain'] !== $utf8_domain) {
                        $res['domain'] = $utf8_domain.' ('.$res['domain'].')';
                    }
                }
            }
            // Prevent domain and comment fields from returning any arbitrary javascript code which could be executed on the browser.
            $res['domain'] = htmlentities($res['domain']);
            $res['comment'] = htmlentities($res['comment']);
            array_push($data, $res);
        }

        header('Content-type: application/json');
        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_domain' || $_POST['action'] == 'replace_domain') {
    // Add new domain
    try {
        $domains = explode(' ', html_entity_decode(trim($_POST['domain'])));
        $before = intval($db->querySingle('SELECT COUNT(*) FROM domainlist;'));
        $total = count($domains);
        $added = 0;

        $db->query('BEGIN TRANSACTION;');

        // Prepare INSERT INTO statement
        $insert_stmt = $db->prepare('INSERT OR IGNORE INTO domainlist (domain,type) VALUES (:domain,:type)');
        if (!$insert_stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        // Prepare UPDATE statement
        $update_stmt = $db->prepare('UPDATE domainlist SET comment = :comment WHERE domain = :domain AND type = :type');
        if (!$update_stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $check_stmt = null;
        $delete_stmt = null;
        if ($_POST['action'] == 'replace_domain') {
            // Check statement will reveal any group associations for a given (domain,type) which do NOT belong to the default group
            $check_stmt = $db->prepare('SELECT EXISTS(SELECT domain FROM domainlist_by_group dlbg JOIN domainlist dl on dlbg.domainlist_id = dl.id WHERE dl.domain = :domain AND dlbg.group_id != 0)');
            if (!$check_stmt) {
                throw new Exception('While preparing check statement: '.$db->lastErrorMsg());
            }
            // Delete statement will remove this domain from any type of list
            $delete_stmt = $db->prepare('DELETE FROM domainlist WHERE domain = :domain');
            if (!$delete_stmt) {
                throw new Exception('While preparing delete statement: '.$db->lastErrorMsg());
            }
        }

        if (isset($_POST['type'])) {
            $type = intval($_POST['type']);
        } elseif (isset($_POST['list']) && $_POST['list'] === 'white') {
            $type = LISTTYPE_WHITELIST;
        } elseif (isset($_POST['list']) && $_POST['list'] === 'black') {
            $type = LISTTYPE_BLACKLIST;
        }

        if (!$insert_stmt->bindValue(':type', $type, SQLITE3_TEXT)
            || !$update_stmt->bindValue(':type', $type, SQLITE3_TEXT)) {
            throw new Exception('While binding type: '.$db->lastErrorMsg());
        }

        $comment = html_entity_decode($_POST['comment']);
        if (strlen($comment) === 0) {
            // Store NULL in database for empty comments
            $comment = null;
        }
        if (!$update_stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: '.$db->lastErrorMsg());
        }

        foreach ($domains as $domain) {
            // Silently skip this entry when it is empty or not a string (e.g. NULL)
            if (!is_string($domain) || strlen($domain) == 0) {
                continue;
            }

            if ($_POST['type'] != '2' && $_POST['type'] != '3') {
                // If not adding a RegEx....
                $input = $domain;
                // Convert domain name to IDNA ASCII form for international domains
                // Skip this for the root zone `.`
                if ($domain != '.') {
                    $domain = convertUnicodeToIDNA($domain);
                }
                // convert the domain lower case and check whether it is valid
                $domain = strtolower($domain);
                $msg = '';
                if (!validDomain($domain, $msg)) {
                    // This is the case when convertUnicodeToIDNA() modified the string
                    if ($input !== $domain && strlen($domain) > 0) {
                        $errormsg = 'Domain '.htmlentities($input).' (converted to "'.htmlentities(utf8_encode($domain)).'") is not a valid domain because '.$msg.'.';
                    } elseif ($input !== $domain) {
                        $errormsg = 'Domain '.htmlentities($input).' is not a valid domain because '.$msg.'.';
                    } else {
                        $errormsg = 'Domain '.htmlentities(utf8_encode($domain)).' is not a valid domain because '.$msg.'.';
                    }

                    throw new Exception($errormsg.'<br>Added '.$added.' out of '.$total.' domains');
                }
            }

            if (isset($_POST['type']) && strlen($_POST['type']) === 2 && $_POST['type'][1] === 'W') {
                // Apply wildcard-style formatting
                $domain = '(\\.|^)'.str_replace('.', '\\.', $domain).'$';
            }

            // First try to delete any occurrences of this domain if we're in
            // replace mode. Only do this when the domain to be replaced is in
            // the default group! Otherwise, we would shuffle group settings and
            // just throw an error at the user to tell them to change this
            // domain manually. This ensures user's will really get what they
            // want from us.
            if ($_POST['action'] == 'replace_domain') {
                if (!$check_stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
                    throw new Exception('While binding domain to check: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
                }

                $check_result = $check_stmt->execute();
                if (!$check_result) {
                    throw new Exception('While executing check: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
                }

                // Check return value of CHECK query (0 = only default group, 1 = special group assignments)
                $only_default_group = ($check_result->fetchArray(SQLITE3_NUM)[0] == 0) ? true : false;
                if (!$only_default_group) {
                    throw new Exception('Domain '.$domain.' is configured with special group settings.<br>Please modify the domain on the respective group management pages.');
                }

                if (!$delete_stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
                    throw new Exception('While binding domain: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
                }

                if (!$delete_stmt->execute()) {
                    throw new Exception('While executing: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
                }
            }

            if (!$insert_stmt->bindValue(':domain', $domain, SQLITE3_TEXT)
                || !$update_stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
                throw new Exception('While binding domain: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
            }

            // First execute INSERT OR IGNORE statement to create a record for
            // this domain (ignore if already existing)
            if (!$insert_stmt->execute()) {
                throw new Exception('While executing INSERT OR IGNORE: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
            }

            // Then update the record with a new comment (and modification date
            // due to the trigger event) We are not using REPLACE INTO to avoid
            // the initial DELETE event (losing group assignments in case an
            // entry did already exist).
            if (!$update_stmt->execute()) {
                throw new Exception('While executing UPDATE: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
            }
            ++$added;
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $after = intval($db->querySingle('SELECT COUNT(*) FROM domainlist;'));
        $difference = $after - $before;
        if ($total === 1) {
            if ($difference !== 1) {
                $msg = 'Not adding '.htmlentities(utf8_encode($domain)).' as it is already on the list';
            } else {
                $msg = 'Added '.htmlentities(utf8_encode($domain));
            }
        } else {
            if ($difference !== $total) {
                $msg = 'Added '.($after - $before).' out of '.$total.' domains (skipped duplicates)';
            } else {
                $msg = 'Added '.$total.' domains';
            }
        }
        $reload = true;
        JSON_success($msg);
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_domain') {
    // Edit domain identified by ID
    try {
        $db->query('BEGIN TRANSACTION;');

        $stmt = $db->prepare('UPDATE domainlist SET enabled=:enabled, comment=:comment, type=:type WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $status = intval($_POST['status']);
        if ($status !== 0) {
            $status = 1;
        }

        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: '.$db->lastErrorMsg());
        }

        $comment = html_entity_decode($_POST['comment']);
        if (strlen($comment) === 0) {
            // Store NULL in database for empty comments
            $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':type', intval($_POST['type']), SQLITE3_INTEGER)) {
            throw new Exception('While binding type: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: '.$db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM domainlist_by_group WHERE domainlist_id = :id');
        if (!$stmt) {
            throw new Exception('While preparing DELETE statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing DELETE statement: '.$db->lastErrorMsg());
        }

        $groups = array();
        if (isset($_POST['groups'])) {
            $groups = $_POST['groups'];
        }
        foreach ($groups as $gid) {
            $stmt = $db->prepare('INSERT INTO domainlist_by_group (domainlist_id,group_id) VALUES(:id,:gid);');
            if (!$stmt) {
                throw new Exception('While preparing INSERT INTO statement: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                throw new Exception('While binding gid: '.$db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing INSERT INTO statement: '.$db->lastErrorMsg());
            }
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_domain') {
    // Delete domain identified by ID
    try {
        $ids = json_decode($_POST['id']);

        // Exploit prevention: Ensure all entries in the ID array are integers
        verify_ID_array($ids);

        $db->query('BEGIN TRANSACTION;');

        // Delete from: domainlist_by_group
        $stmt = $db->prepare('DELETE FROM domainlist_by_group WHERE domainlist_id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        // Delete from: domainlist
        $stmt = $db->prepare('DELETE FROM domainlist WHERE id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_domain_string') {
    // Delete domain identified by the domain string itself
    try {
        $db->query('BEGIN TRANSACTION;');

        $domain = html_entity_decode(trim($_POST['domain']));
        // Convert domain name to IDNA ASCII form for international domains
        $domain = convertUnicodeToIDNA($domain);

        $stmt = $db->prepare('DELETE FROM domainlist_by_group WHERE domainlist_id=(SELECT id FROM domainlist WHERE domain=:domain AND type=:type);');
        if (!$stmt) {
            throw new Exception('While preparing domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
            throw new Exception('While binding domain to domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':type', intval($_POST['type']), SQLITE3_INTEGER)) {
            throw new Exception('While binding type to domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist_by_group statement: '.$db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM domainlist WHERE domain=:domain AND type=:type');
        if (!$stmt) {
            throw new Exception('While preparing domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
            throw new Exception('While binding domain to domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':type', intval($_POST['type']), SQLITE3_INTEGER)) {
            throw new Exception('While binding type to domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist statement: '.$db->lastErrorMsg());
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_adlists') {
    // List all available groups
    try {
        $query = $db->query('SELECT * FROM adlist;');
        if (!$query) {
            throw new Exception('Error while querying gravity\'s adlist table: '.$db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM adlist_by_group WHERE adlist_id = '.$res['id'].';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s adlist_by_group table: '.$db->lastErrorMsg());
            }

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $res['groups'] = $groups;
            array_push($data, $res);
        }

        header('Content-type: application/json');
        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_adlist') {
    // Add new adlist
    try {
        $db->query('BEGIN TRANSACTION;');

        $addresses = explode(' ', html_entity_decode(trim($_POST['address'])));
        $total = count($addresses);
        $added = 0;
        $ignored = 0;

        $stmt = $db->prepare('INSERT INTO adlist (address,comment) VALUES (:address,:comment)');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $comment = html_entity_decode($_POST['comment']);
        if (strlen($comment) === 0) {
            // Store NULL in database for empty comments
            $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: '.$db->lastErrorMsg());
        }

        $added_list = '';
        $ignored_list = '';
        foreach ($addresses as $address) {
            // Silently skip this entry when it is empty or not a string (e.g. NULL)
            if (!is_string($address) || strlen($address) == 0) {
                continue;
            }

            // this will remove first @ that is after schema and before domain
            // $1 is optional schema, $2 is userinfo
            $check_address = preg_replace('|([^:/]*://)?([^/]+)@|', '$1$2', $address, 1);

            if (preg_match('/[^a-zA-Z0-9:\\/?&%=~._()-;]/', $check_address) !== 0) {
                throw new Exception('<strong>Invalid adlist URL '.htmlentities($address).'</strong><br>Added '.$added.' out of '.$total.' adlists');
            }

            if (!$stmt->bindValue(':address', $address, SQLITE3_TEXT)) {
                throw new Exception('While binding address: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' adlists');
            }

            if (!$stmt->execute()) {
                if ($db->lastErrorCode() == 19) {
                    // ErrorCode 19 is "Constraint violation", here the unique constraint of `address`
                    //   is violated (https://www.sqlite.org/rescode.html#constraint).
                    // If the list is already in database, add to ignored list, but don't throw error
                    ++$ignored;
                    $ignored_list .= '<small>'.$address.'</small><br>';
                } else {
                    throw new Exception('While executing: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' adlists');
                }
            } else {
                ++$added;
                $added_list .= '<small>'.$address.'</small><br>';
            }
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        if ($ignored_list != '') {
            // Send added and ignored lists
            $msg = '<b>Ignored duplicated adlists: '.$ignored.'</b><br>'.$ignored_list;
            if ($added_list != '') {
                $msg .= '<br><b>Added adlists: '.$added.'</b><br>'.$added_list;
            }
            $msg .= '<br><b>Total: '.$total.' adlist(s) processed.</b>';
            JSON_warning($msg);
        } else {
            // All adlists added
            $msg = $added_list.'<br><b>Total: '.$total.' adlist(s) processed.</b>';
            JSON_success($msg);
        }
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_adlist') {
    // Edit adlist identified by ID
    try {
        $db->query('BEGIN TRANSACTION;');

        $stmt = $db->prepare('UPDATE adlist SET enabled=:enabled, comment=:comment WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        $status = intval($_POST['status']);
        if ($status !== 0) {
            $status = 1;
        }

        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: '.$db->lastErrorMsg());
        }

        $comment = html_entity_decode($_POST['comment']);
        if (strlen($comment) === 0) {
            // Store NULL in database for empty comments
            $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: '.$db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM adlist_by_group WHERE adlist_id = :id');
        if (!$stmt) {
            throw new Exception('While preparing DELETE statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing DELETE statement: '.$db->lastErrorMsg());
        }

        $groups = array();
        if (isset($_POST['groups'])) {
            $groups = $_POST['groups'];
        }
        foreach ($groups as $gid) {
            $stmt = $db->prepare('INSERT INTO adlist_by_group (adlist_id,group_id) VALUES(:id,:gid);');
            if (!$stmt) {
                throw new Exception('While preparing INSERT INTO statement: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: '.$db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                throw new Exception('While binding gid: '.$db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing INSERT INTO statement: '.$db->lastErrorMsg());
            }
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_adlist') {
    // Delete adlist identified by ID
    try {
        // Accept only an array
        $ids = json_decode($_POST['id']);

        // Exploit prevention: Ensure all entries in the ID array are integers
        verify_ID_array($ids);

        $db->query('BEGIN TRANSACTION;');

        // Delete from: adlists_by_group
        $stmt = $db->prepare('DELETE FROM adlist_by_group WHERE adlist_id IN ('.implode(',', $ids).')');

        if (!$stmt) {
            throw new Exception('While preparing adlist_by_group statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing adlist_by_group statement: '.$db->lastErrorMsg());
        }

        // Delete from: adlists
        $stmt = $db->prepare('DELETE FROM adlist WHERE id IN ('.implode(',', $ids).')');
        if (!$stmt) {
            throw new Exception('While preparing adlist statement: '.$db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing adlist statement: '.$db->lastErrorMsg());
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_audit') {
    // Add new domain
    try {
        $domains = explode(' ', html_entity_decode(trim($_POST['domain'])));
        $before = intval($db->querySingle('SELECT COUNT(*) FROM domain_audit;'));
        $total = count($domains);
        $added = 0;

        $db->query('BEGIN TRANSACTION;');

        $stmt = $db->prepare('REPLACE INTO domain_audit (domain) VALUES (:domain)');
        if (!$stmt) {
            throw new Exception('While preparing statement: '.$db->lastErrorMsg());
        }

        foreach ($domains as $domain) {
            // Silently skip this entry when it is empty or not a string (e.g. NULL)
            if (!is_string($domain) || strlen($domain) == 0) {
                continue;
            }

            if (!$stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
                throw new Exception('While binding domain: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>'.$db->lastErrorMsg().'</strong><br>Added '.$added.' out of '.$total.' domains');
            }
            ++$added;
        }

        if (!$db->query('COMMIT;')) {
            throw new Exception('While committing changes to the database: '.$db->lastErrorMsg());
        }

        $after = intval($db->querySingle('SELECT COUNT(*) FROM domain_audit;'));
        $difference = $after - $before;
        if ($total === 1) {
            if ($difference !== 1) {
                $msg = 'Not adding '.htmlentities(utf8_encode($domain)).' as it is already on the list';
            } else {
                $msg = 'Added '.htmlentities(utf8_encode($domain));
            }
        } else {
            if ($difference !== $total) {
                $msg = 'Added '.($after - $before).' out of '.$total.' domains (skipped duplicates)';
            } else {
                $msg = 'Added '.$total.' domains';
            }
        }

        // Reloading isn't necessary for audit domains (no effect on blocking)
        $reload = false;
        JSON_success($msg);
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} else {
    log_and_die('Requested action not supported!');
}
// Reload lists in pihole-FTL after having added something
if ($reload) {
    $output = pihole_execute('restartdns reload-lists');
}
