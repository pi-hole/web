<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require_once 'func.php';
require_once 'database.php';

$MACDB = getMacVendorsDBFilename();
$macDB = SQLite3_connect($MACDB);

$vendors = array();

function getVendor($mac)
{
    global $macDB;
    global $vendors;

    if (!is_string($mac)) {
        return 'Error: Argument type has to be of type string';
    }
    if (!validMAC($mac)) {
        return 'Error: Argument is not an acceptable MAC address format';
    }
    $mac = strtoupper($mac);
    $prefix = getPrefix($mac);

    // if we haven't cached this OUI/MA-L prefix, search the DB
    if (!array_key_exists($prefix, $vendors)) {
        $stmt = $macDB->prepare('SELECT * FROM macvendor WHERE mac LIKE :prefix');
        $stmt->bindValue(':prefix', $prefix.'%');
        $results = $stmt->execute();

        while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
            $dbMac = strtoupper($row['mac']);

            if (str_ends_with($dbMac, '/36')) {
                $vendors[getPrefix36($dbMac)] = $row['vendor'];
            } elseif (str_ends_with($dbMac, '/28')) {
                $vendors[getPrefix28($dbMac)] = $row['vendor'];
            } else {
                // OUI/MA-L prefixes are stored without a mask, just the first 3 bytes.
                $vendors[$dbMac] = $row['vendor'];
            }
        }
    }

    $prefix28 = getPrefix28($mac);
    $prefix36 = getPrefix36($mac);
    if (array_key_exists($prefix36, $vendors)) {
        return $vendors[$prefix36];
    }
    if (array_key_exists($prefix28, $vendors)) {
        return $vendors[$prefix28];
    }
    if (array_key_exists($prefix, $vendors)) {
        return $vendors[$prefix];
    }

    // short-circuit unassigned OUI/MA-L blocks for future calls
    $vendors[$prefix] = 'unknown';

    return 'unknown';
}

function getPrefix($mac)
{
    return substr($mac, 0, 8);
}

function getPrefix28($mac)
{
    return substr($mac, 0, 10);
}

function getPrefix36($mac)
{
    return substr($mac, 0, 13);
}

/**
 * sourced from
 * https://github.com/symfony/polyfill-php80/blob/6caa57379c4aec19c0a12a38b59b26487dcfe4b5/Php80.php.
 */
function str_ends_with(string $haystack, string $needle): bool
{
    if ($needle === '' || $needle === $haystack) {
        return true;
    }

    if ($haystack === '') {
        return false;
    }

    $needleLength = \strlen($needle);

    return $needleLength <= \strlen($haystack) && substr_compare($haystack, $needle, -$needleLength) === 0;
}
