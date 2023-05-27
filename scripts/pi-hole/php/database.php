<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license
*/

// List Type Constants
const LISTTYPE_WHITELIST = 0;
const LISTTYPE_BLACKLIST = 1;
const LISTTYPE_REGEX_WHITELIST = 2;
const LISTTYPE_REGEX_BLACKLIST = 3;

function getGravityDBFilename()
{
    // Get possible non-standard location of FTL's database
    $FTLsettings = parse_ini_file('/etc/pihole/pihole-FTL.conf');
    if (isset($FTLsettings['GRAVITYDB'])) {
        return $FTLsettings['GRAVITYDB'];
    }

    return '/etc/pihole/gravity.db';
}

function getQueriesDBFilename()
{
    // Get possible non-standard location of FTL's database
    $FTLsettings = parse_ini_file('/etc/pihole/pihole-FTL.conf');
    if (isset($FTLsettings['DBFILE'])) {
        return $FTLsettings['DBFILE'];
    }

    return '/etc/pihole/pihole-FTL.db';
}

function SQLite3_connect_try($filename, $mode, $trytoreconnect)
{
    try {
        // connect to database
        return new SQLite3($filename, $mode);
    } catch (Exception $exception) {
        // sqlite3 throws an exception when it is unable to connect, try to reconnect after 3 seconds
        if ($trytoreconnect) {
            sleep(3);

            return SQLite3_connect_try($filename, $mode, false);
        }
        // If we should not try again (or are already trying again!), we return the exception string
        // so the user gets it on the dashboard
        return $filename.': '.$exception->getMessage();
    }
}

function SQLite3_connect($filename, $mode = SQLITE3_OPEN_READONLY)
{
    if (strlen($filename) > 0) {
        $db = SQLite3_connect_try($filename, $mode, true);
    } else {
        exit('No database available');
    }
    if (is_string($db)) {
        exit("Error connecting to database\n".$db);
    }

    // Add busy timeout so methods don't fail immediately when, e.g., FTL is currently reading from the DB
    $db->busyTimeout(5000);

    return $db;
}

/**
 * Add domains to a given table.
 *
 * @param            $db            object The SQLite3 database connection object
 * @param            $table         string The target table
 * @param            $domains       array Array of domains (strings) to be added to the table
 * @param            $wildcardstyle boolean Whether to format the input domains in legacy wildcard notation
 * @param            $returnnum     boolean Whether to return an integer or a string
 * @param            $type          integer The target type (0 = exact whitelist, 1 = exact blacklist, 2 = regex whitelist, 3 = regex blacklist)
 * @param mixed|null $comment
 *
 * @return string Success/error and number of processed domains
 */
function add_to_table($db, $table, $domains, $comment = null, $wildcardstyle = false, $returnnum = false, $type = -1)
{
    if (!is_int($type)) {
        return 'Error: Argument type has to be of type integer (is '.gettype($type).')';
    }

    // Begin transaction
    if (!$db->exec('BEGIN TRANSACTION;')) {
        if ($returnnum) {
            return 0;
        }

        return "Error: Unable to begin transaction for {$table} table.";
    }

    // To which column should the record be added to?
    if ($table === 'adlist') {
        $field = 'address';
    } else {
        $field = 'domain';
    }

    // Get initial count of domains in this table
    if ($type === -1) {
        $countquery = "SELECT COUNT(*) FROM {$table};";
    } else {
        $countquery = "SELECT COUNT(*) FROM {$table} WHERE type = {$type};";
    }
    $initialcount = intval($db->querySingle($countquery));

    // Prepare INSERT SQLite statement
    $bindcomment = false;
    if ($table === 'domain_audit') {
        $querystr = "INSERT OR IGNORE INTO {$table} ({$field}) VALUES (:{$field});";
    } elseif ($type === -1) {
        $querystr = "INSERT OR IGNORE INTO {$table} ({$field},comment) VALUES (:{$field}, :comment);";
        $bindcomment = true;
    } else {
        $querystr = "REPLACE INTO {$table} ({$field},comment,type) VALUES (:{$field}, :comment, {$type});";
        $bindcomment = true;
    }
    $stmt = $db->prepare($querystr);

    // Return early if we failed to prepare the SQLite statement
    if (!$stmt) {
        if ($returnnum) {
            return 0;
        }

        return "Error: Failed to prepare statement for {$table} table (type = {$type}, field = {$field}).";
    }

    // Loop over domains and inject the lines into the database
    $num = 0;
    foreach ($domains as $domain) {
        // Limit max length for a domain entry to 253 chars
        if (strlen($domain) > 253) {
            continue;
        }

        if ($wildcardstyle) {
            $domain = '(\\.|^)'.str_replace('.', '\\.', $domain).'$';
        }

        $stmt->bindValue(":{$field}", htmlentities($domain), SQLITE3_TEXT);
        if ($bindcomment) {
            $stmt->bindValue(':comment', htmlentities($comment), SQLITE3_TEXT);
        }

        if ($stmt->execute() && $stmt->reset()) {
            ++$num;
        } else {
            $stmt->close();
            if ($returnnum) {
                return $num;
            }
            if ($num === 1) {
                $plural = '';
            } else {
                $plural = 's';
            }

            return 'Error: '.$db->lastErrorMsg().', added '.$num.' domain'.$plural;
        }
    }

    // Close prepared statement and return number of processed rows
    $stmt->close();
    $db->exec('COMMIT;');

    if ($returnnum) {
        return $num;
    }
    $finalcount = intval($db->querySingle($countquery));
    $modified = $finalcount - $initialcount;

    // If we add less domains than the user specified, then they wanted to add duplicates
    if ($modified !== $num) {
        $delta = $num - $modified;
        $extra = ' (skipped '.$delta.' duplicates)';
    } else {
        $extra = '';
    }

    if ($num === 1) {
        $plural = '';
    } else {
        $plural = 's';
    }

    return 'Success, added '.$modified.' of '.$num.' domain'.$plural.$extra;
}

/**
 * Remove domains from a given table.
 *
 * @param $db        object The SQLite3 database connection object
 * @param $table     string The target table
 * @param $domains   array Array of domains (strings) to be removed from the table
 * @param $returnnum boolean Whether to return an integer or a string
 * @param $type      integer The target type (0 = exact whitelist, 1 = exact blacklist, 2 = regex whitelist, 3 = regex blacklist)
 *
 * @return string Success/error and number of processed domains
 */
function remove_from_table($db, $table, $domains, $returnnum = false, $type = -1)
{
    if (!is_int($type)) {
        return 'Error: Argument type has to be of type integer (is '.gettype($type).')';
    }

    // Begin transaction
    if (!$db->exec('BEGIN TRANSACTION;')) {
        if ($returnnum) {
            return 0;
        }

        return 'Error: Unable to begin transaction for domainlist table.';
    }

    // Get initial count of domains in this table
    if ($type === -1) {
        $countquery = "SELECT COUNT(*) FROM {$table};";
    } else {
        $countquery = "SELECT COUNT(*) FROM {$table} WHERE type = {$type};";
    }
    $initialcount = intval($db->querySingle($countquery));

    // Prepare SQLite statement
    if ($type === -1) {
        $querystr = "DELETE FROM {$table} WHERE domain = :domain AND type = {$type};";
    } else {
        $querystr = "DELETE FROM {$table} WHERE domain = :domain;";
    }
    $stmt = $db->prepare($querystr);

    // Return early if we failed to prepare the SQLite statement
    if (!$stmt) {
        if ($returnnum) {
            return 0;
        }

        return 'Error: Failed to prepare statement for '.$table.' table (type = '.$type.').';
    }

    // Loop over domains and remove the lines from the database
    $num = 0;
    foreach ($domains as $domain) {
        $stmt->bindValue(':domain', $domain, SQLITE3_TEXT);

        if ($stmt->execute() && $stmt->reset()) {
            ++$num;
        } else {
            $stmt->close();
            if ($returnnum) {
                return $num;
            }
            if ($num === 1) {
                $plural = '';
            } else {
                $plural = 's';
            }

            return 'Error: '.$db->lastErrorMsg().', removed '.$num.' domain'.$plural;
        }
    }

    // Close prepared statement and return number or processed rows
    $stmt->close();
    $db->exec('COMMIT;');

    if ($returnnum) {
        return $num;
    }
    if ($num === 1) {
        $plural = '';
    } else {
        $plural = 's';
    }

    return 'Success, removed '.$num.' domain'.$plural;
}
