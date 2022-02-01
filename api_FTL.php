<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */


if(!isset($api))
{
	die("Direct call to api_FTL.php is not allowed!");
}

// $FTL_IP is defined in api.php
$socket = connectFTL($FTL_IP);

if(!is_resource($socket))
{
	$data = array_merge($data, array("FTLnotrunning" => true));
}
else
{
	if (isset($_GET['type'])) {
		$data["type"] = "FTL";
	}

	if (isset($_GET['version'])) {
		$data["version"] = 3;
	}

	if (isset($_GET['summary']) || isset($_GET['summaryRaw']) || !count($_GET)) {
		require_once("scripts/pi-hole/php/gravity.php");
		sendRequestFTL("stats");
		$return = getResponseFTL();

		$stats = [];
		foreach($return as $line) {
			$tmp = explode(" ",$line);

			if($tmp[0] === "domains_being_blocked" && !is_numeric($tmp[1])) {
				// Expect string response
				$stats[$tmp[0]] = $tmp[1];
			} elseif ($tmp[0] === "status") {
				// Expect string response
				$stats[$tmp[0]] = piholeStatusAPI();
			} elseif (isset($_GET['summary'])) {
				// "summary" expects a formmated string response
				if($tmp[0] !== "ads_percentage_today") {
					$stats[$tmp[0]] = number_format($tmp[1]);
				} else {
					$stats[$tmp[0]] = number_format($tmp[1], 1, '.', '');
				}
			} else {
				// Expect float response
				$stats[$tmp[0]] = floatval($tmp[1]);
			}

		}
		$stats['gravity_last_updated'] = gravity_last_update(true);
		$data = array_merge($data,$stats);
	}

	if (isset($_GET["getMaxlogage"]) && $auth) {
		sendRequestFTL("maxlogage");
		// Convert seconds to hours and rounds to one decimal place.
		$ret = round(intval(getResponseFTL()[0]) / 3600, 1);
		// Return 24h if value is 0, empty, null or non numeric.
		$ret = $ret ?: 24;

		$data = array_merge($data, array("maxlogage" => $ret));
	}

	if (isset($_GET['overTimeData10mins']))
	{
		sendRequestFTL("overTime");
		$return = getResponseFTL();

		$domains_over_time = array();
		$ads_over_time = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$domains_over_time[intval($tmp[0])] = intval($tmp[1]);
			$ads_over_time[intval($tmp[0])] = intval($tmp[2]);
		}
		$result = array('domains_over_time' => $domains_over_time,
		                'ads_over_time' => $ads_over_time);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['topItems']) && $auth)
	{
		if($_GET['topItems'] === "audit")
		{
			sendRequestFTL("top-domains for audit");
		}
		else if(is_numeric($_GET['topItems']))
		{
			sendRequestFTL("top-domains (".$_GET['topItems'].")");
		}
		else
		{
			sendRequestFTL("top-domains");
		}

		$return = getResponseFTL();
		$top_queries = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			if(count($tmp) == 2) $tmp[2]="";
			$domain = utf8_encode($tmp[2]);
			$top_queries[$domain] = intval($tmp[1]);
		}

		if($_GET['topItems'] === "audit")
		{
			sendRequestFTL("top-ads for audit");
		}
		else if(is_numeric($_GET['topItems']))
		{
			sendRequestFTL("top-ads (".$_GET['topItems'].")");
		}
		else
		{
			sendRequestFTL("top-ads");
		}

		$return = getResponseFTL();
		$top_ads = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$domain = utf8_encode($tmp[2]);
			if(count($tmp) > 3)
				$top_ads[$domain." (".$tmp[3].")"] = intval($tmp[1]);
			else
				$top_ads[$domain] = intval($tmp[1]);
		}

		$result = array('top_queries' => $top_queries,
		                'top_ads' => $top_ads);

		$data = array_merge($data, $result);
	}

	if ((isset($_GET['topClients']) || isset($_GET['getQuerySources'])) && $auth)
	{

		if(isset($_GET['topClients']))
		{
			$number = $_GET['topClients'];
		}
		elseif(isset($_GET['getQuerySources']))
		{
			$number = $_GET['getQuerySources'];
		}

		if(is_numeric($number))
		{
			sendRequestFTL("top-clients (".$number.")");
		}
		else
		{
			sendRequestFTL("top-clients");
		}

		$return = getResponseFTL();
		$top_clients = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$clientip = utf8_encode($tmp[2]);
			if(count($tmp) > 3 && strlen($tmp[3]) > 0)
			{
				$clientname = utf8_encode($tmp[3]);
				$top_clients[$clientname."|".$clientip] = intval($tmp[1]);
			}
			else
				$top_clients[$clientip] = intval($tmp[1]);
		}

		$result = array('top_sources' => $top_clients);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['topClientsBlocked']) && $auth)
	{

		if(isset($_GET['topClientsBlocked']))
		{
			$number = $_GET['topClientsBlocked'];
		}

		if(is_numeric($number))
		{
			sendRequestFTL("top-clients blocked (".$number.")");
		}
		else
		{
			sendRequestFTL("top-clients blocked");
		}

		$return = getResponseFTL();
		$top_clients = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$clientip = utf8_encode($tmp[2]);
			if(count($tmp) > 3 && strlen($tmp[3]) > 0)
			{
				$clientname = utf8_encode($tmp[3]);
				$top_clients[$clientname."|".$clientip] = intval($tmp[1]);
			}
			else
				$top_clients[$clientip] = intval($tmp[1]);
		}

		$result = array('top_sources_blocked' => $top_clients);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['getForwardDestinations']) && $auth)
	{
		if($_GET['getForwardDestinations'] === "unsorted")
		{
			sendRequestFTL("forward-dest unsorted");
		}
		else
		{
			sendRequestFTL("forward-dest");
		}
		$return = getResponseFTL();
		$forward_dest = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$forwardip = utf8_encode($tmp[2]);
			if(count($tmp) > 3 && strlen($tmp[3]) > 0)
			{
				$forwardname = utf8_encode($tmp[3]);
				$forward_dest[$forwardname."|".$forwardip] = floatval($tmp[1]);
			}
			else
				$forward_dest[$forwardip] = floatval($tmp[1]);
		}

		$result = array('forward_destinations' => $forward_dest);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['getQueryTypes']) && $auth)
	{
		sendRequestFTL("querytypes");
		$return = getResponseFTL();
		$querytypes = array();
		foreach($return as $ret)
		{
			$tmp = explode(": ",$ret);
			// Reply cannot contain non-ASCII characters
			$querytypes[$tmp[0]] = floatval($tmp[1]);
		}

		$result = array('querytypes' => $querytypes);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['getCacheInfo']) && $auth)
	{
		sendRequestFTL("cacheinfo");
		$return = getResponseFTL();
		$cacheinfo = array();
		foreach($return as $ret)
		{
			$tmp = explode(": ",$ret);
			// Reply cannot contain non-ASCII characters
			$cacheinfo[$tmp[0]] = floatval($tmp[1]);
		}

		$result = array('cacheinfo' => $cacheinfo);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['getAllQueries']) && $auth)
	{
		if(isset($_GET['from']) && isset($_GET['until']))
		{
			// Get limited time interval
			sendRequestFTL("getallqueries-time ".$_GET['from']." ".$_GET['until']);
		}
		else if(isset($_GET['domain']))
		{
			// Get specific domain only
			sendRequestFTL("getallqueries-domain ".$_GET['domain']);
		}
		else if(isset($_GET['client']) && (isset($_GET['type']) && $_GET['type'] === "blocked"))
		{
			// Get specific client only
			sendRequestFTL("getallqueries-client-blocked ".$_GET['client']);
		}
		else if(isset($_GET['client']))
		{
			// Get specific client only
			sendRequestFTL("getallqueries-client ".$_GET['client']);
		}
		else if(isset($_GET['querytype']))
		{
			// Get specific query type only
			sendRequestFTL("getallqueries-qtype ".$_GET['querytype']);
		}
		else if(isset($_GET['forwarddest']))
		{
			// Get specific forward destination only
			sendRequestFTL("getallqueries-forward ".$_GET['forwarddest']);
		}
		else if(is_numeric($_GET['getAllQueries']))
		{
			sendRequestFTL("getallqueries (".$_GET['getAllQueries'].")");
		}
		else
		{
			// Get all queries
			sendRequestFTL("getallqueries");
		}
		$return = getResponseFTL();
		$allQueries = array();
		foreach($return as $line)
		{
			$tmp = str_getcsv($line," ");
			// UTF-8 encode domain
			$tmp[2] = utf8_encode(str_replace("~"," ",$tmp[2]));
			// UTF-8 encode client host name
			$tmp[3] = utf8_encode($tmp[3]);
			array_push($allQueries,$tmp);
		}

		$result = array('data' => $allQueries);
		$data = array_merge($data, $result);
	}

	if(isset($_GET["recentBlocked"]) && $auth)
	{
		sendRequestFTL("recentBlocked");
		die(utf8_encode(getResponseFTL()[0]));
		unset($data);
	}

	if (isset($_GET['getForwardDestinationNames']) && $auth)
	{
		sendRequestFTL("forward-names");
		$return = getResponseFTL();
		$forward_dest = array();
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$forwardip = utf8_encode($tmp[2]);
			if(count($tmp) > 3)
			{
				$forwardname = utf8_encode($tmp[3]);
				$forward_dest[$forwardname."|".$forwardip] = floatval($tmp[1]);
			}
			else
			{
				$forward_dest[$forwardip] = floatval($tmp[1]);
			}
		}

		$result = array('forward_destinations' => $forward_dest);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['overTimeDataQueryTypes']) && $auth)
	{
		sendRequestFTL("QueryTypesoverTime");
		$return = getResponseFTL();
		$over_time = array();

		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			for ($i=0; $i < count($tmp)-1; $i++) {
				$over_time[intval($tmp[0])][$i] = floatval($tmp[$i+1]);
			}
		}
		$result = array('over_time' => $over_time);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['getClientNames']) && $auth)
	{
		sendRequestFTL("client-names");
		$return = getResponseFTL();
		$client_names = array();
		foreach($return as $line)
		{
			$tmp = explode(" ", $line);
			$client_names[] = array(
				"name" => utf8_encode($tmp[0]),
				"ip" => utf8_encode($tmp[1])
			);
		}

		$result = array('clients' => $client_names);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['overTimeDataClients']) && $auth)
	{
		sendRequestFTL("ClientsoverTime");
		$return = getResponseFTL();
		$over_time = array();

		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			for ($i=0; $i < count($tmp)-1; $i++) {
				$over_time[intval($tmp[0])][$i] = floatval($tmp[$i+1]);
			}
		}
		$result = array('over_time' => $over_time);
		$data = array_merge($data, $result);
	}

	if (isset($_GET['delete_lease']) && $auth)
	{
		sendRequestFTL("delete-lease ".$_GET['delete_lease']);
		$return = getResponseFTL();
		$data["delete_lease"] = $return[0];
	}

	disconnectFTL();
}
?>
