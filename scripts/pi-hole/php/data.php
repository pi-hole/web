<?php
    $log = array();
    $setupVars = parse_ini_file("/etc/pihole/setupVars.conf");

    $hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();
    $log = new \SplFileObject('/var/log/pihole.log');
    $gravity = new \SplFileObject('/etc/pihole/list.preEventHorizon');
    $whitelist = new \SplFileObject('/etc/pihole/whitelist.txt');
    $blacklist = new \SplFileObject('/etc/pihole/blacklist.txt');

    /*******   Public Members ********/
    function getSummaryData() {
        $domains_being_blocked = gravityCount();

        $dns_queries_today = countDnsQueries();

        $ads_blocked_today = countBlockedQueries();

        $ads_percentage_today = $dns_queries_today > 0 ? ($ads_blocked_today / $dns_queries_today * 100) : 0;

        return array(
            'domains_being_blocked' => $domains_being_blocked,
            'dns_queries_today' => $dns_queries_today,
            'ads_blocked_today' => $ads_blocked_today,
            'ads_percentage_today' => $ads_percentage_today,
        );
    }

    function getOverTimeData() {
        global $log;
        $dns_queries = getDnsQueries($log);
        $ads_blocked = getBlockedQueries($log);

        $domains_over_time = overTime($dns_queries);
        $ads_over_time = overTime($ads_blocked);
        alignTimeArrays($ads_over_time, $domains_over_time);
        return Array(
            'domains_over_time' => $domains_over_time,
            'ads_over_time' => $ads_over_time,
        );
    }

    function getOverTimeData10mins() {
        global $log;
        $dns_queries = getDnsQueries($log);
        $ads_blocked = getBlockedQueries($log);

        $domains_over_time = overTime10mins($dns_queries);
        $ads_over_time = overTime10mins($ads_blocked);
        alignTimeArrays($ads_over_time, $domains_over_time);
        return Array(
            'domains_over_time' => $domains_over_time,
            'ads_over_time' => $ads_over_time,
        );
    }

    function getTopItems() {
        global $log;
        $dns_queries = getDnsQueries($log);
        $ads_blocked = getBlockedQueries($log);

        $topAds = topItems($ads_blocked);
        $topQueries = topItems($dns_queries, $topAds);

        return Array(
            'top_queries' => $topQueries,
            'top_ads' => $topAds,
        );
    }

    function getRecentItems($qty) {
        global $log;
        $dns_queries = getDnsQueries($log);
        return Array(
            'recent_queries' => getRecent($dns_queries, $qty)
        );
    }

    function getIpvType() {
        global $log;
        $dns_queries = getDnsQueries($log);
        $queryTypes = array();

        foreach($dns_queries as $query) {
            $info = trim(explode(": ", $query)[1]);
            $queryType = explode(" ", $info)[0];
            if (isset($queryTypes[$queryType])) {
                $queryTypes[$queryType]++;
            }
            else {
                $queryTypes[$queryType] = 1;
            }
        }

        return $queryTypes;
    }

    function resolveIPs(&$array) {
        $hostarray = [];
        foreach ($array as $key => $value)
        {
            $hostname = gethostbyaddr($key);
            // If we found a hostname for the IP, replace it
            if($hostname)
            {
                // Generate HOST entry
                $hostarray[$hostname] = $value;
            }
            else
            {
                // Generate IP entry
                $hostarray[$key] = $value;
            }
        }
        $array = $hostarray;

        // Sort new array
        arsort($array);
    }

    function getForwardDestinations() {
        global $log, $setupVars;
        $forwards = getForwards($log);
        $destinations = array();
        foreach ($forwards as $forward) {
            $exploded = explode(" ", trim($forward));
            $dest = $exploded[count($exploded) - 1];
            if (isset($destinations[$dest])) {
                $destinations[$dest]++;
            }
            else {
                $destinations[$dest] = 1;
            }
        }

        if(istrue($setupVars["API_GET_UPSTREAM_DNS_HOSTNAME"]))
        {
            resolveIPs($destinations);
        }

        return $destinations;

    }

    // Check for existance of variable
    // and test it only if it exists
    function istrue(&$argument) {
        $ret = false;
        if(isset($argument))
        {
            if($argument)
            {
                $ret = true;
            }
        }
        return $ret;
    }

    function getQuerySources() {
        global $log, $setupVars;
        $dns_queries = getDnsQueries($log);
        $sources = array();
        foreach($dns_queries as $query) {
            $exploded = explode(" ", $query);
            $ip = trim($exploded[count($exploded)-1]);
            if (isset($sources[$ip])) {
                $sources[$ip]++;
            }
            else {
                $sources[$ip] = 1;
            }
        }

        global $setupVars;
        if(isset($setupVars["API_EXCLUDE_CLIENTS"]))
        {
            $sources = excludeFromList($sources, "API_EXCLUDE_CLIENTS");
        }

        arsort($sources);
        $sources = array_slice($sources, 0, 10);

        if(istrue($setupVars["API_GET_CLIENT_HOSTNAME"]))
        {
            resolveIPs($sources);
        }

        return Array(
            'top_sources' => $sources
        );
    }

    $showBlocked = false;
    $showPermitted = false;

    function setShowBlockedPermitted()
    {
        global $showBlocked, $showPermitted, $setupVars;
        if(isset($setupVars["API_QUERY_LOG_SHOW"]))
        {
            if($setupVars["API_QUERY_LOG_SHOW"] === "all")
            {
                $showBlocked = true;
                $showPermitted = true;
            }
            elseif($setupVars["API_QUERY_LOG_SHOW"] === "permittedonly")
            {
                $showBlocked = false;
                $showPermitted = true;
            }
            elseif($setupVars["API_QUERY_LOG_SHOW"] === "blockedonly")
            {
                $showBlocked = true;
                $showPermitted = false;
            }
            elseif($setupVars["API_QUERY_LOG_SHOW"] === "nothing")
            {
                $showBlocked = false;
                $showPermitted = false;
            }
            else
            {
                // Invalid settings, show everything
                $showBlocked = true;
                $showPermitted = true;
            }
        }
        else
        {
            $showBlocked = true;
            $showPermitted = true;
        }
    }

    function getAllQueries($orderBy) {
        global $log,$showBlocked,$showPermitted;
        $allQueries = array("data" => array());
        $dns_queries = getDnsQueries($log);

        // Create empty array for gravity
        $gravity_domains = getGravity();

        foreach ($dns_queries as $query) {
            $time = date_create(substr($query, 0, 16));
            $exploded = explode(" ", trim($query));
            $domain = $exploded[count($exploded)-3];
            $tmp = $exploded[count($exploded)-4];

            setShowBlockedPermitted();

            $status = isset($gravity_domains[$domain]) ? "Pi-holed" : "OK";
            if(($status === "Pi-holed" && $showBlocked) || ($status === "OK" && $showPermitted))
            {
                $type = substr($exploded[count($exploded)-4], 6, -1);
                $client = $exploded[count($exploded)-1];

                if($orderBy == "orderByClientDomainTime"){
                  $allQueries['data'][hasHostName($client)][$domain][$time->format('Y-m-d\TH:i:s')] = $status;
                }elseif ($orderBy == "orderByClientTimeDomain"){
                  $allQueries['data'][hasHostName($client)][$time->format('Y-m-d\TH:i:s')][$domain] = $status;
                }elseif ($orderBy == "orderByTimeClientDomain"){
                  $allQueries['data'][$time->format('Y-m-d\TH:i:s')][hasHostName($client)][$domain] = $status;
                }elseif ($orderBy == "orderByTimeDomainClient"){
                  $allQueries['data'][$time->format('Y-m-d\TH:i:s')][$domain][hasHostName($client)] = $status;
                }elseif ($orderBy == "orderByDomainClientTime"){
                  $allQueries['data'][$domain][hasHostName($client)][$time->format('Y-m-d\TH:i:s')] = $status;
                }elseif ($orderBy == "orderByDomainTimeClient"){
                  $allQueries['data'][$domain][$time->format('Y-m-d\TH:i:s')][hasHostName($client)] = $status;
                }else{
                  array_push($allQueries['data'], array(
                    $time->format('Y-m-d\TH:i:s'),
                    $type,
                    $domain,
                    hasHostName($client),
                    $status,
                    ""
                  ));
                }
            }
        }
        return $allQueries;
    }

    /******** Private Members ********/
    function gravityCount() {
        $preEventHorizon = exec("grep -c ^ /etc/pihole/list.preEventHorizon");
        $blacklist = exec("grep -c ^ /etc/pihole/blacklist.txt");
        return ($preEventHorizon + $blacklist);
    }

    function getDnsQueries(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        foreach ($log as $line) {
            if(strpos($line, ": query[A") !== false) {
                $lines[] = $line;
            }
        }
        return $lines;
    }

    function countDnsQueries() {
        return exec("grep -c \": query\\[A\" /var/log/pihole.log");
    }

    function getDnsQueriesAll(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        foreach ($log as $line) {
            if(strpos($line, ": query[A") || strpos($line, "gravity.list") || strpos($line, ": forwarded") !== false) {
                $lines[] = $line;
            }
        }
        return $lines;
    }

    function getDomains($file, &$array, $action){
        $file->rewind();
        foreach ($file as $line) {
            // Strip newline (and possibly carriage return) from end of key
            $key = rtrim($line);
            // if $action = true -> we want that domain to be ADDED to the list
            // doesn't harm to do this if it has already been set before
            // (e.g. once in gravity list, once in blacklist)
            if($action && strlen($key) > 0)
            {
                // $action is true (we want to add) *and* key is not empty
                $array[$key] = true;
            }
            elseif(!$action && isset($array[$key]))
            {
                // $action is false (we want to remove) *and* key is set
                unset($array[$key]);
            }
        }
    }

    function getGravity() {
        global $gravity,$whitelist,$blacklist;
        $domains = [];

        // ADD (true) preEventHorizon domains
        getDomains($gravity, $domains, true);

        // ADD (true) blacklist domains
        getDomains($blacklist, $domains, true);

        // REMOVE (false) whitelist domains
        getDomains($whitelist, $domains, false);

        return $domains;
    }

    function getBlockedQueries(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");
        foreach ($log as $line) {
            $line = preg_replace('/ {2,}/', ' ', $line);
            $exploded = explode(" ", $line);
            if(count($exploded) == 8) {
                $tmp = $exploded[count($exploded) - 4];
                $tmp2 = $exploded[count($exploded) - 5];
                $tmp3 = $exploded[count($exploded) - 3];
                //filter out bad names and host file reloads:
                if(substr($tmp, strlen($tmp) - 12, 12) == "gravity.list" && $tmp2 != "read" && $tmp3 != "pi.hole" && $tmp3 != $hostname) {
                    $lines[] = $line;
                };
            }
        }
        return $lines;
    }

    function countBlockedQueries() {
        $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");
        return exec("grep \"gravity.list\" /var/log/pihole.log | grep -v \"pi.hole\" | grep -v \" read \" | grep -v -c \"".$hostname."\"");
    }

    function getForwards(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        foreach ($log as $line) {
            if(strpos($line, ": forwarded") !== false) {
                $lines[] = $line;
            }
        }
        return $lines;
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

        global $setupVars;
        if(isset($setupVars["API_EXCLUDE_DOMAINS"]))
        {
            $splitQueries = excludeFromList($splitQueries, "API_EXCLUDE_DOMAINS");
        }

        arsort($splitQueries);
        return array_slice($splitQueries, 0, $qty);
    }

    function excludeFromList($array,$key)
    {
        global $setupVars;
        $domains = explode(",",$setupVars[$key]);
        foreach ($domains as $domain) {
            if(isset($array[$domain]))
            {
                unset($array[$domain]);
            }
        }
        return $array;
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

    function overTime10mins($entries) {
        $byTime = array();
        foreach ($entries as $entry) {
            $time = date_create(substr($entry, 0, 16));
            $hour = $time->format('G');
            $minute = $time->format('i');

            // 00:00 - 00:09 -> 0
            // 00:10 - 00:19 -> 1
            // ...
            // 12:00 - 12:10 -> 72
            // ...
            // 15:30 - 15:39 -> 93
            // etc.
            $time = ($minute-$minute%10)/10 + 6*$hour;

            if (isset($byTime[$time])) {
                $byTime[$time]++;
            }
            else {
                $byTime[$time] = 1;
            }
        }
        return $byTime;
    }

    function alignTimeArrays(&$times1, &$times2) {
        if(count($times1) == 0 || count($times2) < 2) {
            return;
        }

        $max = max(array_merge(array_keys($times1), array_keys($times2)));
        $min = min(array_merge(array_keys($times1), array_keys($times2)));

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
