<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('auth.php');

// Authentication checks
if (isset($_POST['token'])) {
    check_cors();
    check_csrf($_POST['token']);
} else {
    log_and_die('Not allowed (login session invalid or expired, please relogin on the Pi-hole dashboard)!');
}

$reload = false;

require_once('func.php');
require_once('database.php');
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

function JSON_success($message = null)
{
    header('Content-type: application/json');
    echo json_encode(array('success' => true, 'message' => $message));
}

function JSON_error($message = null)
{
    header('Content-type: application/json');
    $response = array('success' => false, 'message' => $message);
    if (isset($_POST['action'])) {
        array_push($response, array('action' => $_POST['action']));
    }
    echo json_encode($response);
}

if ($_POST['action'] == 'get_groups') {
    // List all available groups
    try {
        $query = $db->query('SELECT * FROM "group";');
        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            array_push($data, $res);
        }
        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_group') {
    // Add new group
    try {
        $names = explode(' ', trim($_POST['name']));
        $total = count($names);
        $added = 0;
        $stmt = $db->prepare('INSERT INTO "group" (name,description) VALUES (:name,:desc)');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':desc', $_POST['desc'], SQLITE3_TEXT)) {
            throw new Exception('While binding desc: ' . $db->lastErrorMsg());
        }

        foreach ($names as $name) {
            if (!$stmt->bindValue(':name', $name, SQLITE3_TEXT)) {
                throw new Exception('While binding name: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " groups");
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " groups");
            }
            $added++;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_group') {
    // Edit group identified by ID
    try {
        $stmt = $db->prepare('UPDATE "group" SET enabled=:enabled, name=:name, description=:desc WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        $status = ((int) $_POST['status']) !== 0 ? 1 : 0;
        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':name', $_POST['name'], SQLITE3_TEXT)) {
            throw new Exception('While binding name: ' . $db->lastErrorMsg());
        }

        $desc = $_POST['desc'];
        if (strlen($desc) == 0) {
            // Store NULL in database for empty descriptions
            $desc = null;
        }
        if (!$stmt->bindValue(':desc', $desc, SQLITE3_TEXT)) {
            throw new Exception('While binding desc: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: ' . $db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_group') {
    // Delete group identified by ID
    try {
        $table_name = ['domainlist_by_group', 'client_by_group', 'adlist_by_group', 'group'];
        $table_keys = ['group_id', 'group_id', 'group_id', 'id'];
        for ($i = 0; $i < count($table_name); $i++) {
            $table = $table_name[$i];
            $key = $table_keys[$i];

            $stmt = $db->prepare("DELETE FROM \"$table\" WHERE $key = :id;");
            if (!$stmt) {
                throw new Exception("While preparing DELETE FROM $table statement: " . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception("While binding id to DELETE FROM $table statement: " . $db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception("While executing DELETE FROM $table statement: " . $db->lastErrorMsg());
            }

            if (!$stmt->reset()) {
                throw new Exception("While resetting DELETE FROM $table statement: " . $db->lastErrorMsg());
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
            throw new Exception('Error while querying gravity\'s client table: ' . $db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM client_by_group WHERE client_id = ' . $res['id'] . ';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s client_by_group table: ' . $db->lastErrorMsg());
            }

            $stmt = $FTLdb->prepare('SELECT name FROM network WHERE id = (SELECT network_id FROM network_addresses WHERE ip = :ip);');
            if (!$stmt) {
                throw new Exception('Error while preparing network table statement: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':ip', $res['ip'], SQLITE3_TEXT)) {
                throw new Exception('While binding to network table statement: ' . $db->lastErrorMsg());
            }

            $result = $stmt->execute();
            if (!$result) {
                throw new Exception('While executing network table statement: ' . $db->lastErrorMsg());
            }

            // There will always be a result. Unknown host names are NULL
            $name_result = $result->fetchArray(SQLITE3_ASSOC);
            $res['name'] = $name_result['name'];

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $res['groups'] = $groups;
            array_push($data, $res);
        }

        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_unconfigured_clients') {
    // List all available clients WITHOUT already configured clients
    try {
        $QUERYDB = getQueriesDBFilename();
        $FTLdb = SQLite3_connect($QUERYDB);

        $query = $FTLdb->query('SELECT DISTINCT ip,network.name FROM network_addresses AS name LEFT JOIN network ON network.id = network_id ORDER BY ip ASC;');
        if (!$query) {
            throw new Exception('Error while querying FTL\'s database: ' . $db->lastErrorMsg());
        }

        // Loop over results
        $ips = array();
        while ($res = $query->fetchArray(SQLITE3_ASSOC)) {
            $ips[$res['ip']] = $res['name'] !== null ? $res['name'] : '';
        }
        $FTLdb->close();

        $query = $db->query('SELECT ip FROM client;');
        if (!$query) {
            throw new Exception('Error while querying gravity\'s database: ' . $db->lastErrorMsg());
        }

        // Loop over results, remove already configured clients
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            if (isset($ips[$res['ip']])) {
                unset($ips[$res['ip']]);
            }
        }

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
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        foreach ($ips as $ip) {
            if (!$stmt->bindValue(':ip', $ip, SQLITE3_TEXT)) {
                throw new Exception('While binding ip: ' . $db->lastErrorMsg());
            }

            $comment = $_POST['comment'];
            if (strlen($comment) == 0) {
                    // Store NULL in database for empty comments
                    $comment = null;
            }
            if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
                throw new Exception('While binding comment: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " clients");
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " clients");
            }
            $added++;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_client') {
    // Edit client identified by ID
    try {
        $stmt = $db->prepare('UPDATE client SET comment=:comment WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        $comment = $_POST['comment'];
        if (strlen($comment) == 0) {
                // Store NULL in database for empty comments
                $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: ' . $db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM client_by_group WHERE client_id = :id');
        if (!$stmt) {
            throw new Exception('While preparing DELETE statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing DELETE statement: ' . $db->lastErrorMsg());
        }

        $db->query('BEGIN TRANSACTION;');
        foreach ($_POST['groups'] as $gid) {
            $stmt = $db->prepare('INSERT INTO client_by_group (client_id,group_id) VALUES(:id,:gid);');
            if (!$stmt) {
                throw new Exception('While preparing INSERT INTO statement: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                throw new Exception('While binding gid: ' . $db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing INSERT INTO statement: ' . $db->lastErrorMsg());
            }
        }
        $db->query('COMMIT;');

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_client') {
    // Delete client identified by ID
    try {
        $stmt = $db->prepare('DELETE FROM client_by_group WHERE client_id=:id');
        if (!$stmt) {
            throw new Exception('While preparing client_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to client_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing client_by_group statement: ' . $db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM client WHERE id=:id');
        if (!$stmt) {
            throw new Exception('While preparing client statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to client statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing client statement: ' . $db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'get_domains') {
    // List all available groups
    try {
        $limit = "";
        if (isset($_POST["showtype"]) && $_POST["showtype"] === "white"){
            $limit = " WHERE type = 0 OR type = 2";
        } elseif (isset($_POST["showtype"]) && $_POST["showtype"] === "black"){
            $limit = " WHERE type = 1 OR type = 3";
        }
        $query = $db->query('SELECT * FROM domainlist'.$limit);
        if (!$query) {
            throw new Exception('Error while querying gravity\'s domainlist table: ' . $db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM domainlist_by_group WHERE domainlist_id = ' . $res['id'] . ';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s domainlist_by_group table: ' . $db->lastErrorMsg());
            }

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $res['groups'] = $groups;
            if (extension_loaded("intl") &&
                ($res['type'] === ListType::whitelist ||
                 $res['type'] === ListType::blacklist) ) {

                // Try to convert possible IDNA domain to Unicode, we try the UTS #46 standard first
                // as this is the new default, see https://sourceforge.net/p/icu/mailman/message/32980778/
                // We know that this fails for some Google domains violating the standard
                // see https://github.com/pi-hole/AdminLTE/issues/1223
                $utf8_domain = false;
                if (defined("INTL_IDNA_VARIANT_UTS46")) {
                    // We have to use the option IDNA_NONTRANSITIONAL_TO_ASCII here
                    // to ensure sparkasse-gießen.de is not converted into
                    // sparkass-giessen.de but into xn--sparkasse-gieen-2ib.de
                    // as mandated by the UTS #46 standard
                    $utf8_domain = idn_to_utf8($res['domain'], IDNA_NONTRANSITIONAL_TO_ASCII, INTL_IDNA_VARIANT_UTS46);
                }

                // If conversion failed, try with the (deprecated!) IDNA 2003 variant
                // We have to check for its existance as support of this variant is
                // scheduled for removal with PHP 8.0
                // see https://wiki.php.net/rfc/deprecate-and-remove-intl_idna_variant_2003
                if ($utf8_domain === false && defined("INTL_IDNA_VARIANT_2003")) {
                    $utf8_domain = idn_to_utf8($res['domain'], IDNA_DEFAULT, INTL_IDNA_VARIANT_2003);
                }

                // Convert domain name to international form
                // if applicable and extension is available
                if ($utf8_domain !== false && $res['domain'] !== $utf8_domain) {
                    $res['domain'] = $utf8_domain.' ('.$res['domain'].')';
                }
            }
            array_push($data, $res);
        }


        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_domain') {
    // Add new domain
    try {
        $domains = explode(' ', trim($_POST['domain']));
        $total = count($domains);
        $added = 0;
        $stmt = $db->prepare('INSERT INTO domainlist (domain,type,comment) VALUES (:domain,:type,:comment)');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        $type = intval($_POST['type']);

        if (!$stmt->bindValue(':type', $type, SQLITE3_TEXT)) {
            throw new Exception('While binding type: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':comment', $_POST['comment'], SQLITE3_TEXT)) {
            throw new Exception('While binding comment: ' . $db->lastErrorMsg());
        }

        foreach ($domains as $domain) {
            $input = $domain;
            // Convert domain name to IDNA ASCII form for international domains
            if (extension_loaded("intl")) {
                // Be prepared that this may fail and see our comments above
                // (search for "idn_to_utf8)
                $idn_domain = false;
                if (defined("INTL_IDNA_VARIANT_UTS46")) {
                    $idn_domain = idn_to_ascii($domain, IDNA_NONTRANSITIONAL_TO_ASCII, INTL_IDNA_VARIANT_UTS46);
                }
                if ($idn_domain === false && defined("INTL_IDNA_VARIANT_2003")) {
                    $idn_domain = idn_to_ascii($domain, IDNA_DEFAULT, INTL_IDNA_VARIANT_2003);
                }
                if($idn_domain !== false) {
                    $domain = $idn_domain;
                }
            }

            if(strlen($_POST['type']) === 2 && $_POST['type'][1] === 'W')
            {
                // Apply wildcard-style formatting
                $domain = "(\\.|^)".str_replace(".","\\.",$domain)."$";
            }

            if($type === ListType::whitelist || $type === ListType::blacklist)
            {
                // If adding to the exact lists, we convert the domain lower case and check whether it is valid
                $domain = strtolower($domain);
                if(filter_var($domain, FILTER_VALIDATE_DOMAIN, FILTER_FLAG_HOSTNAME) === false)
                {
                    // This is the case when idn_to_ascii() modified the string
                    if($input !== $domain && strlen($domain) > 0)
                        $errormsg = 'Domain ' . htmlentities($input) . ' (converted to "' . htmlentities(utf8_encode($domain)) . '") is not a valid domain.';
                    elseif($input !== $domain)
                        $errormsg = 'Domain ' . htmlentities($input) . ' is not a valid domain.';
                    else
                        $errormsg = 'Domain ' . htmlentities(utf8_encode($domain)) . ' is not a valid domain.';
                    throw new Exception($errormsg . '<br>Added ' . $added . " out of ". $total . " domains");
                }
            }

            if (!$stmt->bindValue(':domain', $domain, SQLITE3_TEXT)) {
                throw new Exception('While binding domain: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " domains");
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " domains");
            }
            $added++;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_domain') {
    // Edit domain identified by ID
    try {
        $stmt = $db->prepare('UPDATE domainlist SET enabled=:enabled, comment=:comment, type=:type WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        $status = intval($_POST['status']);
        if ($status !== 0) {
                $status = 1;
        }

        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: ' . $db->lastErrorMsg());
        }

        $comment = $_POST['comment'];
        if (strlen($comment) == 0) {
                // Store NULL in database for empty comments
                $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':type', intval($_POST['type']), SQLITE3_INTEGER)) {
            throw new Exception('While binding type: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: ' . $db->lastErrorMsg());
        }

        if (isset($_POST['groups'])) {
            $stmt = $db->prepare('DELETE FROM domainlist_by_group WHERE domainlist_id = :id');
            if (!$stmt) {
                throw new Exception('While preparing DELETE statement: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: ' . $db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing DELETE statement: ' . $db->lastErrorMsg());
            }

            $db->query('BEGIN TRANSACTION;');
            foreach ($_POST['groups'] as $gid) {
                $stmt = $db->prepare('INSERT INTO domainlist_by_group (domainlist_id,group_id) VALUES(:id,:gid);');
                if (!$stmt) {
                    throw new Exception('While preparing INSERT INTO statement: ' . $db->lastErrorMsg());
                }

                if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                    throw new Exception('While binding id: ' . $db->lastErrorMsg());
                }

                if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                    throw new Exception('While binding gid: ' . $db->lastErrorMsg());
                }

                if (!$stmt->execute()) {
                    throw new Exception('While executing INSERT INTO statement: ' . $db->lastErrorMsg());
                }
            }
            $db->query('COMMIT;');
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_domain') {
    // Delete domain identified by ID
    try {
        $stmt = $db->prepare('DELETE FROM domainlist_by_group WHERE domainlist_id=:id');
        if (!$stmt) {
            throw new Exception('While preparing domainlist_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to domainlist_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist_by_group statement: ' . $db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM domainlist WHERE id=:id');
        if (!$stmt) {
            throw new Exception('While preparing domainlist statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to domainlist statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing domainlist statement: ' . $db->lastErrorMsg());
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
            throw new Exception('Error while querying gravity\'s adlist table: ' . $db->lastErrorMsg());
        }

        $data = array();
        while (($res = $query->fetchArray(SQLITE3_ASSOC)) !== false) {
            $group_query = $db->query('SELECT group_id FROM adlist_by_group WHERE adlist_id = ' . $res['id'] . ';');
            if (!$group_query) {
                throw new Exception('Error while querying gravity\'s adlist_by_group table: ' . $db->lastErrorMsg());
            }

            $groups = array();
            while ($gres = $group_query->fetchArray(SQLITE3_ASSOC)) {
                array_push($groups, $gres['group_id']);
            }
            $res['groups'] = $groups;
            array_push($data, $res);
        }


        echo json_encode(array('data' => $data));
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'add_adlist') {
    // Add new adlist
    try {
        $addresses = explode(' ', trim($_POST['address']));
        $total = count($addresses);
        $added = 0;

        $stmt = $db->prepare('INSERT INTO adlist (address,comment) VALUES (:address,:comment)');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':comment', $_POST['comment'], SQLITE3_TEXT)) {
            throw new Exception('While binding comment: ' . $db->lastErrorMsg());
        }

        foreach ($addresses as $address) {
            if(preg_match("/[^a-zA-Z0-9:\/?&%=~._()-]/", $address) !== 0) {
                throw new Exception('<strong>Invalid adlist URL ' . htmlentities($address) . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " adlists");
            }

            if (!$stmt->bindValue(':address', $address, SQLITE3_TEXT)) {
                throw new Exception('While binding address: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " adlists");
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing: <strong>' . $db->lastErrorMsg() . '</strong><br>'.
                'Added ' . $added . " out of ". $total . " adlists");
            }
            $added++;
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'edit_adlist') {
    // Edit adlist identified by ID
    try {
        $stmt = $db->prepare('UPDATE adlist SET enabled=:enabled, comment=:comment WHERE id = :id');
        if (!$stmt) {
            throw new Exception('While preparing statement: ' . $db->lastErrorMsg());
        }

        $status = intval($_POST['status']);
        if ($status !== 0) {
                $status = 1;
        }

        if (!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER)) {
            throw new Exception('While binding enabled: ' . $db->lastErrorMsg());
        }

        $comment = $_POST['comment'];
        if (strlen($comment) == 0) {
                // Store NULL in database for empty comments
                $comment = null;
        }
        if (!$stmt->bindValue(':comment', $comment, SQLITE3_TEXT)) {
            throw new Exception('While binding comment: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing: ' . $db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM adlist_by_group WHERE adlist_id = :id');
        if (!$stmt) {
            throw new Exception('While preparing DELETE statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing DELETE statement: ' . $db->lastErrorMsg());
        }

        $db->query('BEGIN TRANSACTION;');
        foreach ($_POST['groups'] as $gid) {
            $stmt = $db->prepare('INSERT INTO adlist_by_group (adlist_id,group_id) VALUES(:id,:gid);');
            if (!$stmt) {
                throw new Exception('While preparing INSERT INTO statement: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
                throw new Exception('While binding id: ' . $db->lastErrorMsg());
            }

            if (!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER)) {
                throw new Exception('While binding gid: ' . $db->lastErrorMsg());
            }

            if (!$stmt->execute()) {
                throw new Exception('While executing INSERT INTO statement: ' . $db->lastErrorMsg());
            }
        }
        $db->query('COMMIT;');

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} elseif ($_POST['action'] == 'delete_adlist') {
    // Delete adlist identified by ID
    try {
        $stmt = $db->prepare('DELETE FROM adlist_by_group WHERE adlist_id=:id');
        if (!$stmt) {
            throw new Exception('While preparing adlist_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to adlist_by_group statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing adlist_by_group statement: ' . $db->lastErrorMsg());
        }

        $stmt = $db->prepare('DELETE FROM adlist WHERE id=:id');
        if (!$stmt) {
            throw new Exception('While preparing adlist statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->bindValue(':id', intval($_POST['id']), SQLITE3_INTEGER)) {
            throw new Exception('While binding id to adlist statement: ' . $db->lastErrorMsg());
        }

        if (!$stmt->execute()) {
            throw new Exception('While executing adlist statement: ' . $db->lastErrorMsg());
        }

        $reload = true;
        JSON_success();
    } catch (\Exception $ex) {
        JSON_error($ex->getMessage());
    }
} else {
    log_and_die('Requested action not supported!');
}
// Reload lists in pihole-FTL after having added something
if ($reload) {
    echo shell_exec('sudo pihole restartdns reload-lists');
}
