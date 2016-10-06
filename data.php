<?php
$hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();
$db = new SQLite3('/etc/pihole/pihole.db');
$hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");

/*******   Public Members ********/
function getSummaryData() {
    global $db;
    global $hostname;

    $ipv6 =  parse_ini_file("/etc/pihole/setupVars.conf")['piholeIPv6'] != "";
    $domains_being_blocked = gravityCount() / ($ipv6 ? 2 : 1);

    $dns_queries_today = $db->querySingle('SELECT count(*) 
                                           FROM queries
                                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')');

    $ads_blocked_today = $db->querySingle('SELECT count(*) 
                                           FROM queries
                                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                                           AND piholed = 1');

    $ads_percentage_today = $dns_queries_today > 0 ? ($ads_blocked_today / $dns_queries_today * 100) : 0;

    return array(
      'domains_being_blocked' => $domains_being_blocked,
      'dns_queries_today' => $dns_queries_today,
      'ads_blocked_today' => $ads_blocked_today,
      'ads_percentage_today' => $ads_percentage_today,
    );
}

function getOverTimeData() {
    $domains_over_time = array();
    $ads_over_time = array();
    global $db;
    global $hostname;
    $results = $db->query('SELECT strftime(\'%H\',ts) AS Hour, count(strftime(\'%H\',ts)) AS cnt 
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           GROUP BY strftime(\'%H\',ts) 
                           ORDER BY strftime(\'%H\',ts)');
    while ($row = $results->fetchArray()) {
        if (substr($row['Hour'],0,1) == '0')
            $hour=substr($row['Hour'],1,1);
        else
            $hour=$row['Hour'];
        $domains_over_time[$hour] = $row['cnt'];
    }

    $results = $db->query('SELECT strftime(\'%H\',ts) AS Hour, count(strftime(\'%H\',ts)) AS cnt
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           AND piholed = 1
                           GROUP BY strftime(\'%H\',ts)
                           ORDER BY strftime(\'%H\',ts)');
    while ($row = $results->fetchArray()) {
        if (substr($row['Hour'],0,1) == '0')
            $hour=substr($row['Hour'],1,1);
        else
            $hour=$row['Hour'];
        $ads_over_time[$hour] = $row['cnt'];
    }

    alignTimeArrays($domains_over_time,$ads_over_time);

    return Array(
      'domains_over_time' => $domains_over_time,
      'ads_over_time' => $ads_over_time,
    );
}

function getTopItems() {
    $topQueries =array();
    $topAds=array();
    global $db;
    global $hostname;
    $results = $db->query('SELECT name, COUNT(name) AS cnt 
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           AND piholed = 0
                           GROUP BY name 
                           ORDER BY COUNT(name) DESC                           
                           LIMIT 10');
    while ($row = $results->fetchArray()) {
        $topQueries[$row['name']] = $row['cnt'];
    }

    $results = $db->query('SELECT name, COUNT(name) AS cnt
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           AND piholed = 1
                           GROUP BY name 
                           ORDER BY COUNT(name) DESC
                           LIMIT 10');
    while ($row = $results->fetchArray()) {
        $topAds[$row['name']] = $row['cnt'];
    }
    return Array(
      'top_queries' => $topQueries,
      'top_ads' => $topAds,
    );
}

function getIpvType() {
    global $db;
    global $hostname;
    $results = $db->query('SELECT query_type, COUNT(query_type) AS cnt 
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           GROUP BY query_type
                           ORDER BY COUNT(query_type) DESC');
    $queryTypes = array();
    while ($row = $results->fetchArray()) {
        $queryTypes[$row['query_type']] = $row['cnt'];
    }
    return $queryTypes;
}

function getForwardDestinations() {
    global $db;
    global $hostname;
    $results = $db->query('SELECT resolver, COUNT(resolver) AS cnt
                           FROM forwards                           
                           GROUP BY resolver
                           ORDER BY COUNT(resolver) DESC');
    $destinations = array();
    while ($row = $results->fetchArray()) {
        $resolver = hasHostName($row['resolver']);
        $destinations[$resolver] = $row['cnt'];
    }
    return $destinations;
}

function getQuerySources() {
    global $db;
    global $hostname;
    $results = $db->query('SELECT source, COUNT(source) AS cnt
                           FROM queries
                           WHERE (source || name !=\'127.0.0.1' . $hostname . '\')
                           GROUP BY source
                           ORDER BY COUNT(source) DESC');
    $sources = array("top_sources" => array());
    #$sources = array();
    while ($row = $results->fetchArray()) {
        $ip = hasHostName($row['source']);
        $sources['top_sources'][$ip] = $row['cnt'];
    }
    return $sources;

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
