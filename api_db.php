<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license
*/

$api = true;
require 'scripts/pi-hole/php/password.php';

header('Content-type: application/json');
require 'scripts/pi-hole/php/database.php';
require 'scripts/pi-hole/php/auth.php';
require_once 'scripts/pi-hole/php/func.php';
check_cors();

// Set maximum execution time to 10 minutes
ini_set('max_execution_time', '600');

$data = array();

// Needs package php5-sqlite, e.g.
//    sudo apt-get install php5-sqlite

$QUERYDB = getQueriesDBFilename();
$db = SQLite3_connect($QUERYDB);

if (isset($_GET['network']) && $auth) {
    $network = array();
    $results = $db->query('SELECT * FROM network');

    while ($results !== false && $res = $results->fetchArray(SQLITE3_ASSOC)) {
        $id = intval($res['id']);

        // Get IP addresses and host names for this device
        $res['ip'] = array();
        $res['name'] = array();
        $network_addresses = $db->query("SELECT ip,name FROM network_addresses WHERE network_id = {$id} ORDER BY lastSeen DESC");
        while ($network_addresses !== false && $network_address = $network_addresses->fetchArray(SQLITE3_ASSOC)) {
            array_push($res['ip'], $network_address['ip']);
            if ($network_address['name'] !== null) {
                array_push($res['name'], utf8_encode($network_address['name']));
            } else {
                array_push($res['name'], '');
            }
        }
        $network_addresses->finalize();

        // UTF-8 encode vendor
        $res['macVendor'] = utf8_encode($res['macVendor']);
        array_push($network, $res);
    }
    $results->finalize();

    $data = array_merge($data, array('network' => $network));
}

if (isset($_GET['getAllQueries']) && $auth) {
    $allQueries = array();
    if ($_GET['getAllQueries'] !== 'empty') {
        $from = intval($_GET['from']);
        $until = intval($_GET['until']);

        // Use table "query_storage"
        //   - replace domain ID with domain
        //   - replace client ID with client name
        //   - replace forward ID with forward destination
        $dbquery = 'SELECT timestamp, type,';
        $dbquery .= " CASE typeof(domain) WHEN 'integer' THEN (SELECT domain FROM domain_by_id d WHERE d.id = q.domain) ELSE domain END domain,";
        $dbquery .= " CASE typeof(client) WHEN 'integer' THEN (";
        $dbquery .= "   SELECT CASE TRIM(name) WHEN '' THEN c.ip ELSE c.name END name FROM client_by_id c WHERE c.id = q.client";
        $dbquery .= ' ) ELSE client END client,';
        $dbquery .= " CASE typeof(forward) WHEN 'integer' THEN (SELECT forward FROM forward_by_id f WHERE f.id = q.forward) ELSE forward END forward,";
        $dbquery .= ' status, reply_type, reply_time, dnssec';
        $dbquery .= ' FROM query_storage q';
        $dbquery .= ' WHERE timestamp >= :from AND timestamp <= :until ';
        if (isset($_GET['types'])) {
            $types = $_GET['types'];
            if (preg_match('/^[0-9]+(?:,[0-9]+)*$/', $types) === 1) {
                // Append selector to DB query. The used regex ensures
                // that only numbers, separated by commas are accepted
                // to avoid code injection and other malicious things
                // We accept only valid lists like "1,2,3"
                // We reject ",2,3", "1,2," and similar arguments
                $dbquery .= 'AND status IN ('.$types.') ';
            } else {
                exit('Error. Selector types specified using an invalid format.');
            }
        }
        $dbquery .= 'ORDER BY timestamp ASC';
        $stmt = $db->prepare($dbquery);
        $stmt->bindValue(':from', intval($from), SQLITE3_INTEGER);
        $stmt->bindValue(':until', intval($until), SQLITE3_INTEGER);
        $results = $stmt->execute();

        // Start the JSON string
        echo '{"data":[';

        if (!is_bool($results)) {
            $first = true;
            while ($row = $results->fetchArray(SQLITE3_ASSOC)) {
                // Insert a comma before the next record (except on the first one)
                if (!$first) {
                    echo ',';
                } else {
                    $first = false;
                }

                // Format, encode, transform each field (if necessary).
                $time = $row['timestamp'];
                $query_type = getQueryTypeStr($row['type']); // Convert query type ID to name
                $domain = utf8_encode(str_replace('~', ' ', $row['domain']));
                $client = $row['client'];
                $status = $row['status'];
                $destination = utf8_encode($row['forward']);
                $reply_type = $row['reply_type'];
                $reply_time = $row['reply_time'];
                $dnssec = $row['dnssec'];

                // Insert into array and output it in JSON format
                echo json_encode(array($time, $query_type, $domain, $client, $status, $destination, $reply_type, $reply_time, $dnssec));
            }
        }

        // Finish the JSON string
        echo ']}';

        // exit at the end
        exit;
    }
    // only used if getAllQueries==empty
    $result = array('data' => $allQueries);
    $data = array_merge($data, $result);
}

if (isset($_GET['topClients']) && $auth) {
    // $from = intval($_GET["from"]);
    $limit = '';
    if (isset($_GET['from'], $_GET['until'])) {
        $limit = 'WHERE timestamp >= :from AND timestamp <= :until';
    } elseif (isset($_GET['from']) && !isset($_GET['until'])) {
        $limit = 'WHERE timestamp >= :from';
    } elseif (!isset($_GET['from']) && isset($_GET['until'])) {
        $limit = 'WHERE timestamp <= :until';
    }
    $dbquery = "SELECT CASE typeof(client) WHEN 'integer' THEN (";
    $dbquery .= " SELECT CASE TRIM(name) WHEN '' THEN c.ip ELSE c.name END name FROM client_by_id c WHERE c.id = q.client)";
    $dbquery .= ' ELSE client END client, count(client) FROM query_storage q '.$limit.' GROUP BY client ORDER BY count(client) DESC LIMIT 20';

    $stmt = $db->prepare($dbquery);
    $stmt->bindValue(':from', intval($_GET['from']), SQLITE3_INTEGER);
    $stmt->bindValue(':until', intval($_GET['until']), SQLITE3_INTEGER);
    $results = $stmt->execute();

    $clientnums = array();

    if (!is_bool($results)) {
        while ($row = $results->fetchArray()) {
            // $row[0] is the client IP

            if (array_key_exists($row[0], $clientnums)) {
                // Entry already exists, add to it (might appear multiple times due to mixed capitalization in the database)
                $clientnums[$row[0]] += intval($row[1]);
            } else {
                // Entry does not yet exist
                $clientnums[$row[0]] = intval($row[1]);
            }
        }
    }

    // Sort by number of hits
    arsort($clientnums);

    // Extract only the first ten entries
    $clientnums = array_slice($clientnums, 0, 10);

    $result = array('top_sources' => $clientnums);
    $data = array_merge($data, $result);
}

if (isset($_GET['topDomains']) && $auth) {
    $limit = '';

    if (isset($_GET['from'], $_GET['until'])) {
        $limit = ' AND timestamp >= :from AND timestamp <= :until';
    } elseif (isset($_GET['from']) && !isset($_GET['until'])) {
        $limit = ' AND timestamp >= :from';
    } elseif (!isset($_GET['from']) && isset($_GET['until'])) {
        $limit = ' AND timestamp <= :until';
    }
    // Select top permitted domains only
    $stmt = $db->prepare('SELECT domain,count(domain) FROM queries WHERE status IN (2,3,12,13,14)'.$limit.' GROUP by domain order by count(domain) desc limit 20');
    $stmt->bindValue(':from', intval($_GET['from']), SQLITE3_INTEGER);
    $stmt->bindValue(':until', intval($_GET['until']), SQLITE3_INTEGER);
    $results = $stmt->execute();

    $domains = array();

    if (!is_bool($results)) {
        while ($row = $results->fetchArray()) {
            // Convert domain to lower case UTF-8
            $c = utf8_encode(strtolower($row[0]));
            if (array_key_exists($c, $domains)) {
                // Entry already exists, add to it (might appear multiple times due to mixed capitalization in the database)
                $domains[$c] += intval($row[1]);
            } else {
                // Entry does not yet exist
                $domains[$c] = intval($row[1]);
            }
        }
    }

    // Sort by number of hits
    arsort($domains);

    // Extract only the first ten entries
    $domains = array_slice($domains, 0, 10);

    $result = array('top_domains' => $domains);
    $data = array_merge($data, $result);
}

if (isset($_GET['topAds']) && $auth) {
    $limit = '';

    if (isset($_GET['from'], $_GET['until'])) {
        $limit = ' AND timestamp >= :from AND timestamp <= :until';
    } elseif (isset($_GET['from']) && !isset($_GET['until'])) {
        $limit = ' AND timestamp >= :from';
    } elseif (!isset($_GET['from']) && isset($_GET['until'])) {
        $limit = ' AND timestamp <= :until';
    }
    $stmt = $db->prepare('SELECT domain,count(domain) FROM queries WHERE status IN (1,4,5,6,7,8,9,10,11)'.$limit.' GROUP by domain order by count(domain) desc limit 10');
    $stmt->bindValue(':from', intval($_GET['from']), SQLITE3_INTEGER);
    $stmt->bindValue(':until', intval($_GET['until']), SQLITE3_INTEGER);
    $results = $stmt->execute();

    $addomains = array();

    if (!is_bool($results)) {
        while ($row = $results->fetchArray()) {
            $addomains[utf8_encode($row[0])] = intval($row[1]);
        }
    }
    $result = array('top_ads' => $addomains);
    $data = array_merge($data, $result);
}

if (isset($_GET['getMinTimestamp']) && $auth) {
    $results = $db->query('SELECT MIN(timestamp) FROM queries');

    if (!is_bool($results)) {
        $result = array('mintimestamp' => $results->fetchArray()[0]);
    } else {
        $result = array();
    }

    $data = array_merge($data, $result);
}

if (isset($_GET['getMaxTimestamp']) && $auth) {
    $results = $db->query('SELECT MAX(timestamp) FROM queries');

    if (!is_bool($results)) {
        $result = array('maxtimestamp' => $results->fetchArray()[0]);
    } else {
        $result = array();
    }

    $data = array_merge($data, $result);
}

if (isset($_GET['getQueriesCount']) && $auth) {
    $results = $db->query('SELECT COUNT(timestamp) FROM queries');

    if (!is_bool($results)) {
        $result = array('count' => $results->fetchArray()[0]);
    } else {
        $result = array();
    }

    $data = array_merge($data, $result);
}

if (isset($_GET['getDBfilesize']) && $auth) {
    $filesize = filesize('/etc/pihole/pihole-FTL.db');
    $result = array('filesize' => $filesize);
    $data = array_merge($data, $result);
}

if (isset($_GET['getGraphData']) && $auth) {
    $limit = '';

    if (isset($_GET['from'], $_GET['until'])) {
        $limit = ' AND timestamp >= :from AND timestamp <= :until';
    } elseif (isset($_GET['from']) && !isset($_GET['until'])) {
        $limit = ' AND timestamp >= :from';
    } elseif (!isset($_GET['from']) && isset($_GET['until'])) {
        $limit = ' AND timestamp <= :until';
    }

    $interval = 600;

    if (isset($_GET['interval'])) {
        $q = intval($_GET['interval']);
        if ($q >= 10) {
            $interval = $q;
        }
    }

    // Round $from and $until to match the requested $interval
    $from = intval((intval($_GET['from']) / $interval) * $interval);
    $until = intval((intval($_GET['until']) / $interval) * $interval);

    // Count permitted queries in intervals
    $stmt = $db->prepare('SELECT (timestamp/:interval)*:interval interval, COUNT(*) FROM queries WHERE (status != 0 )'.$limit.' GROUP by interval ORDER by interval');
    $stmt->bindValue(':from', $from, SQLITE3_INTEGER);
    $stmt->bindValue(':until', $until, SQLITE3_INTEGER);
    $stmt->bindValue(':interval', $interval, SQLITE3_INTEGER);
    $results = $stmt->execute();

    // Parse the DB result into graph data, filling in missing interval sections with zero
    function parseDBData($results, $interval, $from, $until)
    {
        $data = array();
        $first_db_timestamp = -1;

        if (!is_bool($results)) {
            // Read in the data
            while ($row = $results->fetchArray()) {
                // $data[timestamp] = value_in_this_interval
                $data[$row[0]] = intval($row[1]);
                if ($first_db_timestamp === -1) {
                    $first_db_timestamp = intval($row[0]);
                }
            }
        }

        // It is unpredictable what the first timestamp returned by the database
        // will be. This depends on live data. Hence, we re-align the FROM
        // timestamp to avoid unaligned holes appearing as additional
        // (incorrect) data points
        $aligned_from = $from + (($first_db_timestamp - $from) % $interval);

        // Fill gaps in returned data
        for ($i = $aligned_from; $i < $until; $i += $interval) {
            if (!array_key_exists($i, $data)) {
                $data[$i] = 0;
            }
        }

        return $data;
    }

    $domains = parseDBData($results, $interval, $from, $until);

    $result = array('domains_over_time' => $domains);
    $data = array_merge($data, $result);

    // Count blocked queries in intervals
    $stmt = $db->prepare('SELECT (timestamp/:interval)*:interval interval, COUNT(*) FROM queries WHERE status IN (1,4,5,6,7,8,9,10,11)'.$limit.' GROUP by interval ORDER by interval');
    $stmt->bindValue(':from', $from, SQLITE3_INTEGER);
    $stmt->bindValue(':until', $until, SQLITE3_INTEGER);
    $stmt->bindValue(':interval', $interval, SQLITE3_INTEGER);
    $results = $stmt->execute();

    $addomains = parseDBData($results, $interval, $from, $until);

    $result = array('ads_over_time' => $addomains);
    $data = array_merge($data, $result);
}

if (isset($_GET['status']) && $auth) {
    $extra = ';';
    if (isset($_GET['ignore']) && $_GET['ignore'] === 'DNSMASQ_WARN') {
        $extra = "WHERE type != 'DNSMASQ_WARN';";
    }
    $results = $db->query('SELECT COUNT(*) FROM message '.$extra);

    if (!is_bool($results)) {
        $result = array('message_count' => $results->fetchArray()[0]);
    } else {
        $result = array();
    }

    $data = array_merge($data, $result);
}

if (isset($_GET['messages']) && $auth) {
    $extra = ';';
    if (isset($_GET['ignore']) && $_GET['ignore'] === 'DNSMASQ_WARN') {
        $extra = "WHERE type != 'DNSMASQ_WARN';";
    }

    $messages = array();
    $results = $db->query('SELECT * FROM message '.$extra);

    while ($results !== false && $res = $results->fetchArray(SQLITE3_ASSOC)) {
        // Convert string to to UTF-8 encoding to ensure php-json can handle it.
        // Furthermore, convert special characters to HTML entities to prevent XSS attacks.
        foreach ($res as $key => $value) {
            if (is_string($value)) {
                $res[$key] = htmlspecialchars(utf8_encode($value));
            }
        }
        array_push($messages, $res);
    }

    $data = array_merge($data, array('messages' => $messages));
}

if (isset($_GET['jsonForceObject'])) {
    echo json_encode($data, JSON_FORCE_OBJECT);
} else {
    echo json_encode($data);
}
