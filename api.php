<?php
    require "php/password.php";

    include('data.php');
    header('Content-type: application/json');

    $data = array();

    if (isset($_GET['summaryRaw']) && $auth) {
        $data = array_merge($data,  getSummaryData());
    }

    // Works without authorization
    if (isset($_GET['summary']) || !count($_GET)) {
        $sum = getSummaryData();
        $sum['ads_blocked_today'] = number_format( $sum['ads_blocked_today']);
        $sum['dns_queries_today'] = number_format( $sum['dns_queries_today']);
        $sum['ads_percentage_today'] = number_format( $sum['ads_percentage_today'], 1, '.', '');
        $sum['domains_being_blocked'] = number_format( $sum['domains_being_blocked']);
        $data = array_merge($data,  $sum);
    }

    // Works without authorization
    if (isset($_GET['overTimeData'])) {
        $data = array_merge($data,  getOverTimeData());
    }

    if (isset($_GET['topItems']) && $auth) {
        $data = array_merge($data,  getTopItems());
    }

    if (isset($_GET['recentItems']) && $auth) {
        if (is_numeric($_GET['recentItems'])) {
            $data = array_merge($data,  getRecentItems($_GET['recentItems']));
        }
    }

    if (isset($_GET['getQueryTypes']) && $auth) {
        $data = array_merge($data, getIpvType());
    }

    if (isset($_GET['getForwardDestinations']) && $auth) {
        $data = array_merge($data, getForwardDestinations());
    }

    if (isset($_GET['getQuerySources']) && $auth) {
        $data = array_merge($data, getQuerySources());
    }

    if (isset($_GET['getAllQueries']) && $auth) {
        $data = array_merge($data, getAllQueries());
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
