<?php
	error_reporting(E_ALL);
	require("scripts/pi-hole/php/FTL.php");
	$socket = connectFTL("127.0.0.1", 4712);
	header('Content-type: application/json');



	if (isset($_GET['summary']) || isset($_GET['summaryRaw'])) {
		sendRequestFTL("stats");
		$return = getResponseFTL();

		$stats = [];
		foreach($return as $line)
		{
			$tmp = explode(": ",$line);

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
		echo json_encode($stats);
	}



	disconnectFTL();

?>
