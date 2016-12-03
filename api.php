<?php
    $api = true;
    require "php/password.php";
    require "php/auth.php";

    check_cors();

    include('data.php');
    header('Content-type: application/json');

    $data = array();

    // Non-Auth

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

    if (isset($_GET['overTimeData10mins'])) {
        $data = array_merge($data,  getOverTimeData10mins());
    }

    // Auth Required

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

    if (isset($_GET['enable']) && $auth) {
        exec('sudo pihole enable');
        $data = array_merge($data, Array(
            "status" => "enabled"
        ));
    }

    if (isset($_GET['disable']) && $auth) {
        exec('sudo pihole disable');
        $data = array_merge($data, Array(
            "status" => "disabled"
        ));
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

    if(isset($_GET["jsonForceObject"]))
    {
        echo json_encode($data, JSON_FORCE_OBJECT);
    }
    else
    {
        echo json_encode($data);
    }
?>
