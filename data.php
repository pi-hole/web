<?php
    $log = array();
    $divide =  parse_ini_file("/etc/pihole/setupVars.conf")['IPV6_ADDRESS'] != "" && parse_ini_file("/etc/pihole/setupVars.conf")['IPV4_ADDRESS'] != "";
    $hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();
    $log = new \SplFileObject('/var/log/pihole.log');

    /*******   Public Members ********/
    function getSummaryData() {
        global $log, $divide;
        $domains_being_blocked = gravityCount() / ($divide ? 2 : 1);

        $dns_queries_today = count(getDnsQueries($log));

        $ads_blocked_today = count(getBlockedQueries($log));

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

    function getForwardDestinations() {
        global $log;
        $forwards = getForwards($log);
        $destinations = array();
        foreach ($forwards as $forward) {
            $exploded = explode(" ", trim($forward));
            $dest = hasHostName($exploded[count($exploded) - 1]);
            if (isset($destinations[$dest])) {
                $destinations[$dest]++;
            }
            else {
                $destinations[$dest] = 1;
            }
        }

        return $destinations;

    }

    function getQuerySources() {
        global $log;
        $dns_queries = getDnsQueries($log);
        $sources = array();
        foreach($dns_queries as $query) {
            $exploded = explode(" ", $query);
            $ip = hasHostName(trim($exploded[count($exploded)-1]));
            if (isset($sources[$ip])) {
                $sources[$ip]++;
            }
            else {
                $sources[$ip] = 1;
            }
        }
        arsort($sources);
        $sources = array_slice($sources, 0, 10);
        return Array(
            'top_sources' => $sources
        );
    }

    function getAllQueries() {
        global $log;
        $allQueries = array("data" => array());
        $dns_queries = getDnsQueriesAll($log);
        $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");

        foreach ($dns_queries as $query) {
            $time = date_create(substr($query, 0, 16));
            $exploded = explode(" ", trim($query));
            $tmp = $exploded[count($exploded)-4];
            $status = "";

            if (substr($tmp, 0, 5) == "query"){
              $type = substr($exploded[count($exploded)-4], 6, -1);
              $domain = $exploded[count($exploded)-3];
              $client = $exploded[count($exploded)-1];

            }
            elseif (substr($tmp, 0, 9) == "forwarded" || $exploded[count($exploded)-3] == "pi.hole" || $exploded[count($exploded)-3] == $hostname){
              $status="OK";
            }
            elseif (substr($tmp, strlen($tmp) - 12, 12)  == "gravity.list"  && $exploded[count($exploded)-5] != "read"){
              $status="Pi-holed";
            }

            if ( $status != ""){
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
        return $allQueries;
    }

    /******** Private Members ********/
    function gravityCount() {
        //returns count of domains in blocklist.
        $NGC4889 = new \SplFileObject('/etc/pihole/gravity.list');
        $NGC4889->seek($NGC4889->getSize());
        $swallowed = $NGC4889->key();

        return $swallowed;

    }
    function getDnsQueries(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        foreach ($log as $line) {
            if(strpos($line, ": query[") !== false) {
                $lines[] = $line;
            }
        }
        return $lines;
    }
    function getDnsQueriesAll(\SplFileObject $log) {
        $log->rewind();
        $lines = [];
        foreach ($log as $line) {
            if(strpos($line, ": query[") || strpos($line, "gravity.list") || strpos($line, ": forwarded") !== false) {
                $lines[] = $line;
            }
        }
        return $lines;
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
