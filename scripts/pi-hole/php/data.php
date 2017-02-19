<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

    $log = array();
    $setupVars = parse_ini_file("/etc/pihole/setupVars.conf");

    $hosts = file_exists("/etc/hosts") ? file("/etc/hosts") : array();

    // Check if pihole.log exists and is readable
    $logListName = checkfile("/var/log/pihole.log");
    $log = new \SplFileObject($logListName);

    // Check if preEventHorizon exists and is readable
    $gravityListName = checkfile("/etc/pihole/list.preEventHorizon");
    $gravity = new \SplFileObject($gravityListName);

    // whitelist.txt is optional and might not be there
    $whiteListFile = checkfile("/etc/pihole/whitelist.txt");
    $whitelist = new \SplFileObject($whiteListFile);

    // blacklist.txt is optional and might not be there
    $blackListFile = checkfile("/etc/pihole/blacklist.txt");
    $blacklist = new \SplFileObject($blackListFile);

    if(isset($setupVars["API_PRIVACY_MODE"]))
    {
        $privacyMode = $setupVars["API_PRIVACY_MODE"];
    }
    else
    {
        $privacyMode = false;
    }

    // Check if time zone is set
    // https://github.com/pi-hole/AdminLTE/pull/394
    if (!date_default_timezone_get("date.timezone")) {
        date_default_timezone_set("UTC");
    }

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

        // Get log lines
        $dns_queries = getDnsQueries($log);

        // Get list of ad domains
        $gravity_domains = getGravity();

        // Bin log entries separated into Domains and Ads in 1 hour intervals
        list($domains_over_time, $ads_over_time) = overTime($dns_queries, $gravity_domains);

        // Align arrays
        alignTimeArrays($ads_over_time, $domains_over_time);

        // Provide a minimal valid array if there have are no blocked
        // queries at all. Otherwise the output of the API is inconsistent.
        if(count($ads_over_time) == 0)
        {
            $ads_over_time = [1 => 0];
        }

        return Array(
            'domains_over_time' => $domains_over_time,
            'ads_over_time' => $ads_over_time,
        );
    }

    function getOverTimeData10mins() {
        global $log;

        // Get log lines
        $dns_queries = getDnsQueries($log);

        // Get list of ad domains
        $gravity_domains = getGravity();

        // Bin log entries separated into Domains and Ads in 10 minute intervals
        list($domains_over_time, $ads_over_time) = overTime10mins($dns_queries, $gravity_domains);

        // Align arrays (in case there have been hours without ad queries)
        alignTimeArrays($ads_over_time, $domains_over_time);

        // Provide a minimal valid array if there have are no blocked
        // queries at all. Otherwise the output of the API is inconsistent.
        if(count($ads_over_time) == 0)
        {
            $ads_over_time = [1 => 0];
        }

        return Array(
            'domains_over_time' => $domains_over_time,
            'ads_over_time' => $ads_over_time,
        );
    }

    // Test if variable exists and is positive
    function ispositive(&$arg)
    {
        if(isset($arg))
        {
            if($arg > 0)
            {
                return true;
            }
            return false;
        }
        return false;
    }

    function getTopItems($argument) {
        global $log,$setupVars,$privacyMode;

        // Process log file
        $dns_domains = getDnsQueryDomains($log);
        // Get list of ad domains
        $gravity_domains = getGravity();

        // Exclude domains the user doesn't want to see
        if(isset($setupVars["API_EXCLUDE_DOMAINS"]))
        {
            excludeFromList($dns_domains, "API_EXCLUDE_DOMAINS");
        }

        // Sort array in descending order
        arsort($dns_domains);

        // Prepare arrays and counters for Top Items
        $topDomains = []; $domaincounter = 0;
        $topAds = []; $adcounter = 0;

        // Default number of Top Items to show is 10
        $qty = 10;

        // If argument is numeric, the user may want to
        // see a different number of entries
        if(is_numeric($argument))
        {
            $qty = intval($argument);
        }

        // Process sorted domain names
        foreach ($dns_domains as $key => $value) {
            if(ispositive($gravity_domains[$key]) && $adcounter < $qty)
            {
                // New entry for Top Ads
                $topAds[$key] = $value;
                $adcounter++;
            }
            else if($domaincounter < $qty && !$privacyMode)
            {
                // New entry for Top Domains
                $topDomains[$key] = $value;
                $domaincounter++;
            }
            elseif($domaincounter >= $qty && $adcounter >= $qty)
            {
                // Already collected enough entries for both lists
                // Exit loop early
                break;
            }
        }

        return Array(
            'top_queries' => $topDomains,
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
                $hostarray["$hostname|$key"] = $value;
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
            excludeFromList($sources, "API_EXCLUDE_CLIENTS");
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
        global $log,$showBlocked,$showPermitted,$privacyMode,$setupVars;
        $allQueries = array("data" => array());
        $dns_queries = getDnsQueries($log);

        $hostnames=array();

        // Create empty array for gravity
        $gravity_domains = getGravity();
        $wildcard_domains = getWildcardListContent();

        if(isset($_GET["from"]))
        {
            $from = new DateTime($_GET["from"]);
        }
        if(isset($_GET["until"]))
        {
            $until = new DateTime($_GET["until"]);
        }

        setShowBlockedPermitted();

        // Privacy mode?
        if($privacyMode)
        {
            $showPermitted = false;
        }

        if(!$showBlocked && !$showPermitted)
        {
            // Nothing to do for us here
            return [];
        }

        foreach ($dns_queries as $query) {
            $time = new DateTime(substr($query, 0, 16));

            // Check if we want to restrict the time where we want to show queries
            if(isset($from))
            {
                if($time <= $from)
                {
                    continue;
                }
            }
            if(isset($until))
            {
                if($time >= $until)
                {
                    continue;
                }
            }

           // print_r([$time->getTimestamp(),$_GET["from"],$_GET["until"]]);

            $exploded = explode(" ", trim($query));
            $domain = $exploded[count($exploded)-3];

            $status = "";

            if(isset($gravity_domains[$domain]))
            {
                if($gravity_domains[$domain] > 0)
                {
                    // Exact matching gravity domain
                    $status = "Pi-holed (exact)";
                }
                else
                {
                    // Explicitly whitelisted
                    $status = "OK (whitelisted)";
                }
            }
            else
            {
                // Test for wildcard blocking
                foreach ($wildcard_domains as $entry) {
                    if(strpos($domain, $entry) !== false)
                    {
                        $status = "Pi-holed (wildcard)";
                    }
                }
                if(!strlen($status))
                {
                    $status = "OK";
                }
            }
            if((substr($status,0,2) === "Pi" && $showBlocked) || (substr($status,0,2) === "OK" && $showPermitted))
            {
                $type = substr($exploded[count($exploded)-4], 6, -1);

                if(istrue($setupVars["API_GET_CLIENT_HOSTNAME"])) {
                    $ip = $exploded[count($exploded) - 1];

                    if (isset($hostnames[$ip])) {
                        $client = $hostnames[$ip];
                    } else {
                        $hostnames[$ip] = gethostbyaddr($ip);
                        $client = $hostnames[$ip];
                    }
                }
                else
                {
                    $client = $exploded[count($exploded)-1];
                }

                if($orderBy == "orderByClientDomainTime"){
                  $allQueries['data'][hasHostName($client)][$domain][$time->format('Y-m-d T H:i:s')] = $status;
                }elseif ($orderBy == "orderByClientTimeDomain"){
                  $allQueries['data'][hasHostName($client)][$time->format('Y-m-d T H:i:s')][$domain] = $status;
                }elseif ($orderBy == "orderByTimeClientDomain"){
                  $allQueries['data'][$time->format('Y-m-d T H:i:s')][hasHostName($client)][$domain] = $status;
                }elseif ($orderBy == "orderByTimeDomainClient"){
                  $allQueries['data'][$time->format('Y-m-d T H:i:s')][$domain][hasHostName($client)] = $status;
                }elseif ($orderBy == "orderByDomainClientTime"){
                  $allQueries['data'][$domain][hasHostName($client)][$time->format('Y-m-d T H:i:s')] = $status;
                }elseif ($orderBy == "orderByDomainTimeClient"){
                  $allQueries['data'][$domain][$time->format('Y-m-d T H:i:s')][hasHostName($client)] = $status;
                }else{
                  array_push($allQueries['data'], array(
                    $time->format('Y-m-d T H:i:s'),
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

    function tailPiholeLog($param) {
        // Not using SplFileObject here, since direct
        // usage of f-streams will be much faster for
        // files as large as the pihole.log
        global $logListName;
        $file = fopen($logListName,"r");
        $offset = intval($param);
        if($offset > 0)
        {
            // Seeks on the file pointer where we want to continue reading is known
            fseek($file, $offset);
            $lines = [];
            while (!feof($file)) {
                array_push($lines,fgets($file));
            }
            return ["offset" => ftell($file), "lines" => $lines];
        }
        else
        {
            // Locate the current position of the file read/write pointer
            fseek($file, -1, SEEK_END);
            // Add one to skip the very last "\n" in the log file
            return ["offset" => ftell($file)+1];
        }
        fclose($file);
    }

    /******** Private Members ********/
    function gravityCount() {
        global $gravityListName,$blackListFile;
        $preEventHorizon = exec("grep -c ^ $gravityListName");
        $blacklist = exec("grep -c ^ $blackListFile");
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

    function getDnsQueryDomains(\SplFileObject $log) {
        $log->rewind();
        $domains = [];
        foreach ($log as $line) {
            if(strpos($line, ": query[A") !== false) {
                $exploded = explode(" ", $line);
                $domain = trim($exploded[count($exploded) - 3]);
                if (isset($domains[$domain])) {
                    $domains[$domain]++;
                }
                else {
                    $domains[$domain] = 1;
                }
            }
        }
        return $domains;
    }

    function countDnsQueries() {
        global $logListName;
        return intval(exec("grep -c \": query\\[A\" $logListName"));
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
                $array[$key] = 1;
            }
            elseif(!$action && isset($array[$key]))
            {
                // $action is false (we want to remove) *and* key is set
                $array[$key] = -1;
            }
        }
    }

    function getWildcardListContent() {
        $rawList = file_get_contents(checkfile("/etc/dnsmasq.d/03-pihole-wildcard.conf"));
        $wclist = explode("\n", $rawList);
        $list = [];

        foreach ($wclist as $entry) {
            $expl = explode("/", $entry);
            if(count($expl) == 3)
            {
                array_push($list,$expl[1]);
            }
        }

        return array_unique($list);

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
        foreach ($log as $line) {
            $exploded = explode(" ", str_replace("  "," ",$line));
            if(count($exploded) == 8 || count($exploded) == 10) {
                // Structure of data is currently like:
                // Array
                // (
                //     [0] => Dec
                //     [1] => 19
                //     [2] => 11:21:51
                //     [3] => dnsmasq[2584]:
                //     [4] => /etc/pihole/gravity.list
                //     [5] => doubleclick.com
                //     [6] => is
                //     [7] => ip.of.pi.hole
                // )
                // with extra logging enabled
                // Array
                // (
                //     [0] => Dec
                //     [1] => 19
                //     [2] => 11:21:51
                //     [3] => dnsmasq[2584]:
                //     [4] => 1 (identifier)
                //     [5] => 1.2.3.4/12345
                //     [6] => /etc/pihole/gravity.list
                //     [7] => doubleclick.com
                //     [8] => is
                //     [9] => ip.of.pi.hole
                // )
                $list = $exploded[count($exploded)-4];
                $is = $exploded[count($exploded)-2];
                // Consider only gravity.list as DNS source (not e.g. hostname.list)
                if(substr($list, strlen($list) - 12, 12) === "gravity.list" && $is === "is") {
                    $lines[] = $line;
                };
            }
        }
        return $lines;
    }

    function countBlockedQueries() {
        global $logListName;
        // Blocked due to gravity entries (ad lists + blacklist)
        $gravityblocked = intval(exec("grep -c -e \"gravity\.list.*is\" $logListName"));

        // Blocked due to wildcard entries
        $wildcard_domains = getWildcardListContent();
        $wildcardblocked = 0;
        foreach ($wildcard_domains as $domain) {
            $wildcardblocked += intval(exec("grep -c -e \"config.*$domain is\" $logListName"));
        }

        return  $gravityblocked +$wildcardblocked;
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

    function excludeFromList(&$array,$key)
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

    function overTime($entries, $gravity_domains) {
        $byTimeDomains = [];
        $byTimeAds = [];
        foreach ($entries as $entry) {
            $time = date_create(substr($entry, 0, 16));
            $hour = $time->format('G');

            $exploded = explode(" ", $entry);
            $domain = trim($exploded[count($exploded) - 3]);

            if(ispositive($gravity_domains[$domain]))
            {
                if (isset($byTimeAds[$time])) {
                    $byTimeAds[$time]++;
                }
                else {
                    $byTimeAds[$time] = 1;
                }
            }

            if (isset($byTimeDomains[$time])) {
                $byTimeDomains[$time]++;
            }
            else {
                $byTimeDomains[$time] = 1;
            }
        }
        return [$byTimeDomains,$byTimeAds];
    }

    function overTime10mins($entries, $gravity_domains=[]) {
        $byTimeDomains = [];
        $byTimeAds = [];
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

            $exploded = explode(" ", $entry);
            $domain = trim($exploded[count($exploded) - 3]);

            if(ispositive($gravity_domains[$domain]))
            {
                if (isset($byTimeAds[$time])) {
                    $byTimeAds[$time]++;
                }
                else {
                    $byTimeAds[$time] = 1;
                }
            }

            if (isset($byTimeDomains[$time])) {
                $byTimeDomains[$time]++;
            }
            else {
                $byTimeDomains[$time] = 1;
            }
        }
        return [$byTimeDomains,$byTimeAds];
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
