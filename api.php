<?php
    session_start();
    include('data.php');
    header('Content-type: application/json');

    $data = array();

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

    if (isset($_GET['getAllQueries'])) {
        $data = array_merge($data, getAllQueries());
    }

    if (isset($_GET['getVersions'])) {
        $data = array_merge($data, getVersions());
    }

    if (isset($_GET['getStatus'])) {
        $status['status'] = getStatus();
        $data = array_merge($data, $status);
    }

    if (isset($_GET['getToken'])) {
        if(empty($_SESSION['token'])) {
            $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
        }
        $token['token'] = $_SESSION['token'];
        $data = array_merge($data, $token);
    }

    if(isset($_GET['getTemp'])){
        $temp['temp'] = getTemp();
        $data = array_merge($data, $temp);
    }

    if(isset($_GET['getMemoryStats'])){
        $stats['memory'] = getMemoryStats();
        $data = array_merge($data, $stats);
    }

    if(isset($_GET['getCPUStats'])){
        $stats['cpu'] = sys_getloadavg();
        $data = array_merge($data, $stats);
    }

    if(isset($_GET['getDiskStats'])){
        $stats['disk'] = getDiskStats();
        $data = array_merge($data, $stats);
    }

    if(isset($_GET['getNetworkStats'])){
        $stats['network'] = ifconfig();
        $data = array_merge($data, $stats);
    }

    if(isset($_GET['getProcesses'])){
        $stats['processes'] = getProcesses(10);
        $data = array_merge($data, $stats);
    }

    if(isset($_GET['findBlockedDomain'])){
        $stats['findBlockedDomain'] = findBlockedDomain($_GET['findBlockedDomain']);
        $data = array_merge($data, $stats);
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
