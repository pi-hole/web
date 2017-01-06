<?php
	error_reporting(E_ALL);
	require("scripts/pi-hole/php/FTL.php");
	$socket = connectFTL("127.0.0.1", 4711);
	header('Content-type: application/json');

	$data = [];

	if (isset($_GET['summary']) || isset($_GET['summaryRaw'])) {
		sendRequestFTL("stats");
		$return = getResponseFTL();

		$stats = [];
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);

			if(isset($_GET['summary']))
			{
				if($tmp[0] !== "ads_percentage_today")
				{
					$stats[$tmp[0]] = number_format($tmp[1]);
				}
				else
				{
					$stats[$tmp[0]] = number_format($tmp[1], 1, '.', '');
				}
			}
			else
			{
				$stats[$tmp[0]] = $tmp[1];
			}
		}
		$data = array_merge($data,$stats);
	}

	if (isset($_GET['overTimeData10mins'])) {
		sendRequestFTL("overTime");
		$return = getResponseFTL();

		$domains_over_time = [];
		$ads_over_time = [];
		foreach($return as $line)
		{
			$tmp = explode(" ",$line);
			$domains_over_time[] = $tmp[1];
			$ads_over_time[] = $tmp[2];
		}
		$result = ['domains_over_time' => $domains_over_time,
		           'ads_over_time' => $ads_over_time];
		$data = array_merge($data, $result);
	}

	echo json_encode($data);

	disconnectFTL();

?>
