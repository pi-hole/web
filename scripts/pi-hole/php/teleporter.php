<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require 'password.php';
require 'auth.php'; // Also imports func.php
require 'database.php';
require 'savesettings.php';

if (php_sapi_name() !== 'cli') {
    if (!$auth) {
        exit('Not authorized');
    }
    check_csrf(isset($_POST['token']) ? $_POST['token'] : '');
}

$db = SQLite3_connect(getGravityDBFilename(), SQLITE3_OPEN_READWRITE);

$flushed_tables = array();

function archive_add_file($path, $name, $subdir = '')
{
    global $archive;
    if (file_exists($path.$name)) {
        $archive[$subdir.$name] = file_get_contents($path.$name);
    }
}

/**
 * Add the contents of a table to the archive.
 *
 * @param $name string The name of the file in the archive to save the table to
 * @param $table string The table to export
 * @param $type integer Type of domains to store
 */
function archive_add_table($name, $table, $type = -1)
{
    global $archive, $db;

    if ($type > -1) {
        $querystr = "SELECT * FROM \"{$table}\" WHERE type = {$type};";
    } else {
        $querystr = "SELECT * FROM \"{$table}\";";
    }
    $results = $db->query($querystr);

    // Return early without creating a file if the
    // requested table cannot be accessed
    if (is_null($results)) {
        return;
    }

    $content = array();
    while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
        array_push($content, $row);
    }

    $archive[$name] = json_encode($content);
}

/**
 * Restore the contents of a table from an uploaded archive.
 *
 * @param $file object The file in the archive to restore the table from
 * @param $table string The table to import
 * @param $flush boolean Whether to flush the table before importing the archived data
 *
 * @return int Number of restored rows
 */
function archive_restore_table($file, $table, $flush = false)
{
    global $db, $flushed_tables;

    $json_string = file_get_contents($file);
    // Return early if we cannot extract the JSON string
    if (is_null($json_string)) {
        return 0;
    }

    $contents = json_decode($json_string, true);
    // Return early if we cannot decode the JSON string
    if (is_null($contents)) {
        return 0;
    }

    // Flush table if requested. Only flush each table once, and only if it exists
    if ($flush && !in_array($table, $flushed_tables)) {
        $tableExists = $db->querySingle("SELECT name FROM sqlite_master WHERE type='table' AND name='".$table."';");
        if ($tableExists) {
            $db->exec('DELETE FROM "'.$table.'"');
            array_push($flushed_tables, $table);
        }
    }

    // Prepare fields depending on the table we restore to
    if ($table === 'adlist') {
        $sql = 'INSERT OR IGNORE INTO adlist';
        $sql .= ' (id,address,enabled,date_added,comment)';
        $sql .= ' VALUES (:id,:address,:enabled,:date_added,:comment);';
    } elseif ($table === 'domain_audit') {
        $sql = 'INSERT OR IGNORE INTO domain_audit';
        $sql .= ' (id,domain,date_added)';
        $sql .= ' VALUES (:id,:domain,:date_added);';
    } elseif ($table === 'domainlist') {
        $sql = 'INSERT OR IGNORE INTO domainlist';
        $sql .= ' (id,domain,enabled,date_added,comment,type)';
        $sql .= ' VALUES (:id,:domain,:enabled,:date_added,:comment,:type);';
    } elseif ($table === 'group') {
        $sql = 'INSERT OR IGNORE INTO "group"';
        $sql .= ' (id,name,date_added,description)';
        $sql .= ' VALUES (:id,:name,:date_added,:description);';
    } elseif ($table === 'client') {
        $sql = 'INSERT OR IGNORE INTO client';
        $sql .= ' (id,ip,date_added,comment)';
        $sql .= ' VALUES (:id,:ip,:date_added,:comment);';
    } elseif ($table === 'domainlist_by_group') {
        $sql = 'INSERT OR IGNORE INTO domainlist_by_group';
        $sql .= ' (domainlist_id,group_id)';
        $sql .= ' VALUES (:domainlist_id,:group_id);';
    } elseif ($table === 'client_by_group') {
        $sql = 'INSERT OR IGNORE INTO client_by_group';
        $sql .= ' (client_id,group_id)';
        $sql .= ' VALUES (:client_id,:group_id);';
    } elseif ($table === 'adlist_by_group') {
        $sql = 'INSERT OR IGNORE INTO adlist_by_group';
        $sql .= ' (adlist_id,group_id)';
        $sql .= ' VALUES (:adlist_id,:group_id);';
    } else {
        if ($table === 'whitelist') {
            $type = 0;
        } elseif ($table === 'blacklist') {
            $type = 1;
        } elseif ($table === 'regex_whitelist') {
            $type = 2;
        } elseif ($table === 'regex_blacklist') {
            $type = 3;
        }

        $sql = 'INSERT OR IGNORE INTO domainlist';
        $sql .= ' (id,domain,enabled,date_added,comment,type)';
        $sql .= " VALUES (:id,:domain,:enabled,:date_added,:comment,{$type});";
        $field = 'domain';
    }

    // Prepare SQLite statement
    $stmt = $db->prepare($sql);

    // Return early if we fail to prepare the SQLite statement
    if (!$stmt) {
        echo 'Failed to prepare statement for '.$table.' table.';
        echo $sql;

        return 0;
    }

    // Loop over rows and inject the entries into the database
    $num = 0;
    foreach ($contents as $row) {
        // Limit max length for a domain entry to 253 chars
        if (isset($field) && strlen($row[$field]) > 253) {
            continue;
        }

        // Bind properties from JSON data
        // Note that only defined above are actually used
        // so even maliciously modified Teleporter files
        // cannot be dangerous in any way
        foreach ($row as $key => $value) {
            $type = gettype($value);
            $sqltype = null;

            switch ($type) {
                case 'integer':
                    $sqltype = SQLITE3_INTEGER;

                    break;

                case 'string':
                    $sqltype = SQLITE3_TEXT;

                    break;

                case 'NULL':
                    $sqltype = SQLITE3_NULL;

                    break;

                default:
                    $sqltype = 'UNK';
            }
            $stmt->bindValue(':'.$key, htmlentities($value), $sqltype);
        }

        if ($stmt->execute() && $stmt->reset() && $stmt->clear()) {
            ++$num;
        } else {
            $stmt->close();

            return $num;
        }
    }

    // Close database connection and return number or processed rows
    $stmt->close();

    return $num;
}

/**
 * Create table rows from an uploaded archive file.
 *
 * @param $file object The file in the archive to import
 * @param $table string The target table
 * @param $flush boolean Whether to flush the table before importing the archived data
 * @param $wildcardstyle boolean Whether to format the input domains in legacy wildcard notation
 *
 * @return int Number of processed rows from the imported file
 */
function archive_insert_into_table($file, $table, $flush = false, $wildcardstyle = false)
{
    global $db;

    $domains = array_filter(explode("\n", file_get_contents($file)));
    // Return early if we cannot extract the lines in the file
    if (is_null($domains)) {
        return 0;
    }

    // Generate comment
    $prefix = 'phar:///tmp/';
    if (substr($file, 0, strlen($prefix)) == $prefix) {
        $file = substr($file, strlen($prefix));
    }
    $comment = 'Imported from '.$file;

    // Determine table and type to import to
    $type = null;
    if ($table === 'whitelist') {
        $table = 'domainlist';
        $type = LISTTYPE_WHITELIST;
    } elseif ($table === 'blacklist') {
        $table = 'domainlist';
        $type = LISTTYPE_BLACKLIST;
    } elseif ($table === 'regex_blacklist') {
        $table = 'domainlist';
        $type = LISTTYPE_REGEX_BLACKLIST;
    } elseif ($table === 'domain_audit') {
        $table = 'domain_audit';
        $type = -1; // -1 -> not used inside add_to_table()
    } elseif ($table === 'adlist') {
        $table = 'adlist';
        $type = -1; // -1 -> not used inside add_to_table()
    }

    // Flush table if requested
    if ($flush) {
        flush_table($table, $type);
    }

    // Add domains to requested table
    return add_to_table($db, $table, $domains, $comment, $wildcardstyle, true, $type);
}

/**
 * Flush table if requested. This subroutine flushes each table only once.
 *
 * @param $table string The target table
 * @param $type integer Type of item to flush in table (applies only to domainlist table)
 */
function flush_table($table, $type = null)
{
    global $db, $flushed_tables;

    if (!in_array($table, $flushed_tables)) {
        if ($type !== null) {
            $sql = 'DELETE FROM "'.$table.'" WHERE type = '.$type;
            array_push($flushed_tables, $table.$type);
        } else {
            $sql = 'DELETE FROM "'.$table.'"';
            array_push($flushed_tables, $table);
        }
        $db->exec($sql);
    }
}

function archive_add_directory($path, $subdir = '')
{
    if ($dir = opendir($path)) {
        while (false !== ($entry = readdir($dir))) {
            if ($entry !== '.' && $entry !== '..') {
                archive_add_file($path, $entry, $subdir);
            }
        }
        closedir($dir);
    }
}

function limit_length(&$item, $key)
{
    // limit max length for a domain entry to 253 chars
    // return only a part of the string if it is longer
    $item = substr($item, 0, 253);
}

function process_file($contents)
{
    $domains = array_filter(explode("\n", $contents));
    // Walk array and apply a max string length
    // function to every member of the array of domains
    array_walk($domains, 'limit_length');

    return $domains;
}

function noun($num)
{
    if ($num === 1) {
        return ' entry';
    }

    return ' entries';
}

if (isset($_POST['action'])) {
    if ($_FILES['zip_file']['name'] && $_POST['action'] == 'in') {
        $filename = $_FILES['zip_file']['name'];
        $source = $_FILES['zip_file']['tmp_name'];
        $type = mime_content_type($source);

        // verify the file mime type
        $accepted_types = array('application/gzip', 'application/tar', 'application/x-compressed', 'application/x-gzip');
        $mime_valid = in_array($type, $accepted_types);

        // verify the file extension (Looking for ".tar.gz" at the end of the file name)
        $ext = array_slice(explode('.', $filename), -2, 2);
        $ext_valid = strtolower($ext[0]) == 'tar' && strtolower($ext[1]) == 'gz' ? true : false;

        if (!$ext_valid || !$mime_valid) {
            exit('The file you are trying to upload is not a .tar.gz file (filename: '.htmlentities($filename).', type: '.htmlentities($type).'). Please try again.');
        }

        $fullfilename = sys_get_temp_dir().'/'.$filename;

        if (!move_uploaded_file($source, $fullfilename)) {
            exit('Failed moving '.htmlentities($source).' to '.htmlentities($fullfilename));
        }

        $archive = new PharData($fullfilename);

        $importedsomething = false;
        $fullpiholerestart = false;
        $reloadsettingspage = false;

        $flushtables = isset($_POST['flushtables']);

        foreach (new RecursiveIteratorIterator($archive) as $file) {
            if (isset($_POST['blacklist']) && $file->getFilename() === 'blacklist.txt') {
                $num = archive_insert_into_table($file, 'blacklist', $flushtables);
                echo 'Processed blacklist (exact) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['whitelist']) && $file->getFilename() === 'whitelist.txt') {
                $num = archive_insert_into_table($file, 'whitelist', $flushtables);
                echo 'Processed whitelist (exact) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['regexlist']) && $file->getFilename() === 'regex.list') {
                $num = archive_insert_into_table($file, 'regex_blacklist', $flushtables);
                echo 'Processed blacklist (regex) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            // Also try to import legacy wildcard list if found
            if (isset($_POST['regexlist']) && $file->getFilename() === 'wildcardblocking.txt') {
                $num = archive_insert_into_table($file, 'regex_blacklist', $flushtables, true);
                echo 'Processed blacklist (regex, wildcard style) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['auditlog']) && $file->getFilename() === 'auditlog.list') {
                $num = archive_insert_into_table($file, 'domain_audit', $flushtables);
                echo 'Processed audit log ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['adlist']) && $file->getFilename() === 'adlists.list') {
                $num = archive_insert_into_table($file, 'adlist', $flushtables);
                echo 'Processed adlists ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['blacklist']) && $file->getFilename() === 'blacklist.exact.json') {
                $num = archive_restore_table($file, 'blacklist', $flushtables);
                echo 'Processed blacklist (exact) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['regexlist']) && $file->getFilename() === 'blacklist.regex.json') {
                $num = archive_restore_table($file, 'regex_blacklist', $flushtables);
                echo 'Processed blacklist (regex) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['whitelist']) && $file->getFilename() === 'whitelist.exact.json') {
                $num = archive_restore_table($file, 'whitelist', $flushtables);
                echo 'Processed whitelist (exact) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['regex_whitelist']) && $file->getFilename() === 'whitelist.regex.json') {
                $num = archive_restore_table($file, 'regex_whitelist', $flushtables);
                echo 'Processed whitelist (regex) ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['adlist']) && $file->getFilename() === 'adlist.json') {
                $num = archive_restore_table($file, 'adlist', $flushtables);
                echo 'Processed adlist ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['auditlog']) && $file->getFilename() === 'domain_audit.json') {
                $num = archive_restore_table($file, 'domain_audit', $flushtables);
                echo 'Processed domain_audit ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['group']) && $file->getFilename() === 'group.json') {
                $num = archive_restore_table($file, 'group', $flushtables);
                echo 'Processed group ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['client']) && $file->getFilename() === 'client.json') {
                $num = archive_restore_table($file, 'client', $flushtables);
                echo 'Processed client ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['client']) && $file->getFilename() === 'client_by_group.json') {
                $num = archive_restore_table($file, 'client_by_group', $flushtables);
                echo 'Processed client group assignments ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if ((isset($_POST['whitelist']) || isset($_POST['regex_whitelist'])
                || isset($_POST['blacklist']) || isset($_POST['regex_blacklist']))
                && $file->getFilename() === 'domainlist_by_group.json') {
                $num = archive_restore_table($file, 'domainlist_by_group', $flushtables);
                echo 'Processed black-/whitelist group assignments ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['adlist']) && $file->getFilename() === 'adlist_by_group.json') {
                $num = archive_restore_table($file, 'adlist_by_group', $flushtables);
                echo 'Processed adlist group assignments ('.$num.noun($num).")<br>\n";
                $importedsomething = true;
            }

            if (isset($_POST['staticdhcpleases']) && $file->getFilename() === '04-pihole-static-dhcp.conf') {
                if ($flushtables) {
                    $local_file = @fopen('/etc/dnsmasq.d/04-pihole-static-dhcp.conf', 'r+');
                    if ($local_file !== false) {
                        ftruncate($local_file, 0);
                        fclose($local_file);
                    }
                }
                $num = 0;
                $staticdhcpleases = process_file(file_get_contents($file));
                foreach ($staticdhcpleases as $lease) {
                    list($mac, $ip, $hostname) = explode(',', $lease);
                    $mac = formatMAC($mac);
                    if (addStaticDHCPLease($mac, $ip, $hostname)) {
                        ++$num;
                    }
                }

                readStaticLeasesFile();
                echo 'Processed static DHCP leases ('.$num.noun($num).")<br>\n";
                if ($num > 0) {
                    $importedsomething = true;
                    $reloadsettingspage = true;
                }
            }

            if (isset($_POST['localdnsrecords']) && $file->getFilename() === 'custom.list') {
                ob_start();
                $reload = 'false';
                if ($flushtables) {
                    // Defined in func.php included via auth.php
                    // passing reload="false" will not restart Pi-hole
                    deleteAllCustomDNSEntries($reload);
                }
                $num = 0;
                $localdnsrecords = process_file(file_get_contents($file));
                foreach ($localdnsrecords as $record) {
                    list($ip, $domain) = explode(' ', $record);
                    if (addCustomDNSEntry($ip, $domain, $reload, false)) {
                        ++$num;
                    }
                }
                ob_end_clean();
                echo 'Processed local DNS records ('.$num.noun($num).")<br>\n";
                if ($num > 0) {
                    // we need a full pihole restart
                    $fullpiholerestart = true;
                }
            }

            if (isset($_POST['localcnamerecords']) && $file->getFilename() === '05-pihole-custom-cname.conf') {
                ob_start();
                $reload = 'false';
                if ($flushtables) {
                    // Defined in func.php included via auth.php
                    // passing reload="false" will not restart Pi-hole
                    deleteAllCustomCNAMEEntries($reload);
                }

                $num = 0;
                $localcnamerecords = process_file(file_get_contents($file));
                foreach ($localcnamerecords as $record) {
                    $line = str_replace('cname=', '', $record);
                    $line = str_replace("\r", '', $line);
                    $line = str_replace("\n", '', $line);
                    $explodedLine = explode(',', $line);

                    $domain = implode(',', array_slice($explodedLine, 0, -1));
                    $target = $explodedLine[count($explodedLine) - 1];

                    if (addCustomCNAMEEntry($domain, $target, $reload, false)) {
                        ++$num;
                    }
                }
                ob_end_clean();
                echo 'Processed local CNAME records ('.$num.noun($num).")<br>\n";
                if ($num > 0) {
                    // we need a full pihole restart
                    $fullpiholerestart = true;
                }
            }
        }

        // do we need a full restart of Pi-hole or reloading the lists?
        if ($fullpiholerestart) {
            pihole_execute('restartdns');
        } else {
            if ($importedsomething) {
                pihole_execute('restartdns reload');
            }
        }

        unlink($fullfilename);
        echo 'OK';
        if ($reloadsettingspage) {
            echo "<br>\n<span data-forcereload></span>";
        }
    } else {
        exit('No file transmitted or parameter error.');
    }
} else {
    $hostname = gethostname() ? str_replace('.', '_', gethostname()).'-' : '';
    $tarname = 'pi-hole-'.$hostname.'teleporter_'.date('Y-m-d_H-i-s').'.tar';
    $filename = $tarname.'.gz';
    $archive_file_name = tempnam(sys_get_temp_dir(), 'pihole_teleporter_'); // create a random file name in the system's tmp dir for the intermediate archive
    unlink($archive_file_name); // remove intermediate file created by tempnam()
    $archive_file_name .= '.tar'; // Append ".tar" extension

    $archive = new PharData($archive_file_name);

    if ($archive->isWritable() !== true) {
        exit('cannot open/create '.htmlentities($archive_file_name)."<br>\nPHP user: ".exec('whoami')."\n");
    }

    archive_add_table('whitelist.exact.json', 'domainlist', LISTTYPE_WHITELIST);
    archive_add_table('whitelist.regex.json', 'domainlist', LISTTYPE_REGEX_WHITELIST);
    archive_add_table('blacklist.exact.json', 'domainlist', LISTTYPE_BLACKLIST);
    archive_add_table('blacklist.regex.json', 'domainlist', LISTTYPE_REGEX_BLACKLIST);
    archive_add_table('adlist.json', 'adlist');
    archive_add_table('domain_audit.json', 'domain_audit');
    archive_add_table('group.json', 'group');
    archive_add_table('client.json', 'client');

    // Group linking tables
    archive_add_table('domainlist_by_group.json', 'domainlist_by_group');
    archive_add_table('adlist_by_group.json', 'adlist_by_group');
    archive_add_table('client_by_group.json', 'client_by_group');

    archive_add_file('/etc/pihole/', 'setupVars.conf');
    archive_add_file('/etc/pihole/', 'dhcp.leases');
    archive_add_file('/etc/pihole/', 'custom.list');
    archive_add_file('/etc/pihole/', 'pihole-FTL.conf');
    archive_add_file('/etc/', 'hosts', 'etc/');
    archive_add_directory('/etc/dnsmasq.d/', 'dnsmasq.d/');

    $archive->compress(Phar::GZ); // Creates a gzipped copy
    unlink($archive_file_name); // Unlink original tar file as it is not needed anymore
    $archive_file_name .= '.gz'; // Append ".gz" extension to ".tar"

    header('Content-type: application/gzip');
    header('Content-Transfer-Encoding: binary');
    header('Content-Disposition: attachment; filename='.$filename);
    header('Content-length: '.filesize($archive_file_name));
    header('Pragma: no-cache');
    header('Expires: 0');
    if (ob_get_length() > 0) {
        ob_end_clean();
    }
    readfile($archive_file_name);
    ignore_user_abort(true);
    unlink($archive_file_name);

    exit;
}
