<?php
$log = array();
$ipv6 =  parse_ini_file("/etc/pihole/setupVars.conf")['piholeIPv6'] != "";
$hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();
$db = new SQLite3('/etc/pihole/pihole.db');

/*******   Public Members ********/
function getSummaryData() {
    global $db;
    $domains_being_blocked = $db->querySingle('SELECT count(id) FROM gravity');
    $dns_queries_today = $db->querySingle('SELECT count(id) FROM queries');
    $ads_blocked_today = $db->querySingle('SELECT count(a.id) FROM queries as a join gravity as b on a.name = b.domain');
    $ads_percentage_today = $dns_queries_today > 0 ? ($ads_blocked_today / $dns_queries_today * 100) : 0;

    return array(
      'domains_being_blocked' => $domains_being_blocked,
      'dns_queries_today' => $dns_queries_today,
      'ads_blocked_today' => $ads_blocked_today,
      'ads_percentage_today' => $ads_percentage_today,
    );
}

function getOverTimeData() {
    global $db;
    $dns_queries = $db->query('SELECT * FROM queries');
    $ads_blocked = $db->query('SELECT * FROM queries as a join gravity as b on a.name = b.domain');

    $domains_over_time = overTime($dns_queries);
    $ads_over_time = overTime($ads_blocked);
    alignTimeArrays($ads_over_time, $domains_over_time);
    return Array(
      'domains_over_time' => $domains_over_time,
      'ads_over_time' => $ads_over_time,
    );
}

function getTopItems() {
    $log = readInLog();
    $dns_queries = array();
    $ads_blocked = array();

    global $db;
    $results = $db->query('SELECT name, count(name) FROM queries group by name');
    while ($row = $results->fetchArray()) {

    }

    $topAds = topItems($ads_blocked);
    $topQueries = topItems($dns_queries, $topAds);

    return Array(
      'top_queries' => $topQueries,
      'top_ads' => $topAds,
    );
}

function getRecentItems($qty) {
    $log = readInLog();
    $dns_queries = getDnsQueries($log);
    return Array(
      'recent_queries' => getRecent($dns_queries, $qty)
    );
}

function getIpvType() {
    global $db;
    $results = $db->query('SELECT * FROM queries');
    $queryTypes = array();
    while ($row = $results->fetchArray()) {
        #$info = trim(explode(": ", $query)[1]);
        $queryType = $row['query_type'];
        if (isset($queryTypes[$queryType])) {
            $queryTypes[$queryType]++;
        }
        else {
            $queryTypes[$queryType] = 1;
        }
    }


    return $queryTypes;
}

function getForwardDestinations() {
    global $db;
    $results = $db->query('SELECT * FROM forwards');
    $destinations = array();
    while ($row = $results->fetchArray()) {
        $dest = $row['resolver'];
        if (isset($destinations[$dest])) {
            $destinations[$dest]++;
        }
        else {
            $destinations[$dest] = 0;
        }
    }

    return $destinations;

}

function getQuerySources() {
    global $db;
    $results = $db->query('SELECT source, COUNT(source) FROM queries GROUP BY source ORDER BY COUNT(source) DESC');
    $sources = array("top_sources" => array());
    #$sources = array();
    while ($row = $results->fetchArray()) {
        $ip = hasHostName($row['source']);
        array_push($sources['top_sources'], array(
          $ip,
          $row['COUNT(source)']
        ));
    }
    return $sources;

    #{"top_sources":{"localhost(127.0.0.1)":"2066","adam-pc(192.168.1.2)":"642","adam-mobile(192.168.1.3)":"256","192.168.1.100":"178","192.168.1.104":"107","192.168.1.102":"30","192.168.1.105":"1"}}


}

function getAllQueries() {
    global $db;
    $allQueries = array("data" => array());
    $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");

    $results = $db->query('SELECT * FROM queries as a left join gravity as b on a.name = b.domain');
    while ($row = $results->fetchArray()) {
        $time =$row['ts'];
        $status = "";
        $type = $row['query_type'];
        $domain = $row['name'];
        $client = $row['source'];

        if ($domain == "pi.hole" || $domain == $hostname || $row['domain'] == null){
            $status="OK";
        }
        elseif ($row['domain'] != null){
            $status="Pi-holed";
        }
        array_push($allQueries['data'], array(
          $time,#->format('Y-m-d\TH:i:s'),
          $type,
          $domain,
          hasHostName($client),
          $status,
        ));
    }

    return $allQueries;
}

/******** Private Members ********/
function gravityCount() {
    //returns count of domains in blocklist.
    $gravity="/etc/pihole/gravity.list";
    $swallowed = 0;
    $NGC4889 = fopen($gravity, "r");
    while ($stars = fread($NGC4889, 1024000)) {
        $swallowed += substr_count($stars, "\n");
    }
    fclose($NGC4889);

    return $swallowed;

}
function readInLog() {
    global $log;
    return count($log) > 1 ? $log :
      file("/var/log/pihole.log");
}
function getDnsQueries($log) {
    return array_filter($log, "findQueries");
}
function getDnsQueriesAll($log) {
    return array_filter($log, "findQueriesAll");
}
function getBlockedQueries($log) {
    return array_filter($log, "findAds");
}
function getForwards($log) {
    return array_filter($log, "findForwards");
}


function topItems($queries, $exclude = array(), $qty=10) {
    $splitQueries = array();
    foreach ($queries as $query) {
        $exploded = explode(" ", $query);
        $domain = trim($exploded[count($exploded) - 3]);
        if (!isset($exclude[$domain])) {
            if (isset($splitQueries[$domain])) {
                $splitQueries[$domain]++;
            }
            else {
                $splitQueries[$domain] = 1;
            }
        }
    }
    arsort($splitQueries);
    return array_slice($splitQueries, 0, $qty);
}

function overTime($entries) {
    $byTime = array();
    foreach ($entries as $entry) {
        $time = date_create(substr($entry, 0, 16));
        $hour = $time->format('G');

        if (isset($byTime[$hour])) {
            $byTime[$hour]++;
        }
        else {
            $byTime[$hour] = 1;
        }
    }
    return $byTime;
}

function alignTimeArrays(&$times1, &$times2) {
    $max = max(array(max(array_keys($times1)), max(array_keys($times2))));
    $min = min(array(min(array_keys($times1)), min(array_keys($times2))));

    for ($i = $min; $i <= $max; $i++) {
        if (!isset($times2[$i])) {
            $times2[$i] = 0;
        }
        if (!isset($times1[$i])) {
            $times1[$i] = 0;
        }
    }

    ksort($times1);
    ksort($times2);
}

function getRecent($queries, $qty){
    $recent = array();
    foreach (array_slice($queries, -$qty) as $query) {
        $queryArray = array();
        $exploded = explode(" ", $query);
        $time = date_create(substr($query, 0, 16));
        $queryArray['time'] = $time->format('h:i:s a');
        $queryArray['domain'] = trim($exploded[count($exploded) - 3]);
        $queryArray['ip'] = trim($exploded[count($exploded)-1]);
        array_push($recent, $queryArray);

    }
    return array_reverse($recent);
}

function findQueriesAll($var) {
    return strpos($var, ": query[") || strpos($var, "gravity.list") || strpos($var, ": forwarded") !== false;
}

function findQueries($var) {
    return strpos($var, ": query[") !== false;
}

function findAds($var) {
    $exploded = explode(" ", $var);
    if(count($exploded) == 8) {
        $tmp = $exploded[count($exploded) - 4];
        $tmp2 = $exploded[count($exploded) - 5];
        $tmp3 = $exploded[count($exploded) - 3];
        $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");
        //filter out bad names and host file reloads:
        return (substr($tmp, strlen($tmp) - 12, 12) == "gravity.list" && $tmp2 != "read" && $tmp3 != "pi.hole" && $tmp3 != $hostname);
    }
    else{
        return false;
    }

}

function findForwards($var) {
    return strpos($var, ": forwarded") !== false;
}

function hasHostName($var){
    global $hosts;
    foreach ($hosts as $host){
        $x = preg_split('/\s+/', $host);
        if ( $var == $x[0] ){
            $var = $x[1] . "($var)";
        }
    }
    return $var;
}
?>
