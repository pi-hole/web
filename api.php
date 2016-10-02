<?php
    include('data.php');
    header('Content-type: application/json');

    $data = array();

    if (isset($_GET['querytest'])) {

        $db = new SQLite3('/etc/pihole/pihole.db');

        $results = $db->query('SELECT name, count(name) FROM queries group by name order by count(name) desc');
        while ($row = $results->fetchArray()) {
            var_dump($row);
        }
    }

    if (isset($_GET['summaryRaw'])) {
        $data = array_merge($data,  getSummaryData());
    }

    if (isset($_GET['summary']) || !count($_GET)) {
        $sum = getSummaryData();
        $sum['ads_blocked_today'] = number_format( $sum['ads_blocked_today']);
        $sum['dns_queries_today'] = number_format( $sum['dns_queries_today']);
        $sum['ads_percentage_today'] = number_format( $sum['ads_percentage_today'], 1, '.', '');
        $sum['domains_being_blocked'] = number_format( $sum['domains_being_blocked']);
        $data = array_merge($data,  $sum);
    }

    if (isset($_GET['overTimeData'])) {
        $data = array_merge($data,  getOverTimeData());
    }

    if (isset($_GET['topItems'])) {
        $data = array_merge($data,  getTopItems());
    }

    if (isset($_GET['recentItems'])) {
        if (is_numeric($_GET['recentItems'])) {
            $data = array_merge($data,  getRecentItems($_GET['recentItems']));
        }
    }

    if (isset($_GET['getQueryTypes'])) {
        $data = array_merge($data, getIpvType());
    }

    if (isset($_GET['getForwardDestinations'])) {
        $data = array_merge($data, getForwardDestinations());
    }

    if (isset($_GET['getQuerySources'])) {
        $data = array_merge($data, getQuerySources());
    }

    function filterArray(&$a) {
	    $sanArray = array();
	    foreach ($a as $k=>$v) {
	        if (is_array($v)) {
	            $sanArray[htmlspecialchars($k)] = filterArray($v);
            } else {
	            $sanArray[htmlspecialchars($k)] = htmlspecialchars($v);
            }
	    }
	    return $sanArray;
    }
    
    $data = filterArray($data);
    echo json_encode($data);
?>
