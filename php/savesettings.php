<?php
	$debug = $_POST;

	$primaryDNSservers = [
			"8.8.8.8" => "Google",
			"208.67.222.222" => "OpenDNS",
			"4.2.2.1" => "Level3",
			"199.85.126.10" => "Norton",
			"8.26.56.26" => "Comodo"
		];

	$secondaryDNSservers = [
			"8.8.4.4" => "Google",
			"208.67.220.220" => "OpenDNS",
			"4.2.2.2" => "Level3",
			"199.85.127.10" => "Norton",
			"8.20.247.20" => "Comodo"
		];

	if(isset($_POST["field"]))
	{
		// Process request
		switch ($_POST["field"]) {
			// Set DNS server
			case "DNS":
				$primaryDNS = $_POST["primaryDNS"];
				$secondaryDNS = $_POST["secondaryDNS"];

				// Get primary DNS server IP address
				if($primaryDNS === "Custom")
				{
					$primaryIP = $_POST["DNS1IP"];
				}
				else
				{
					$primaryIP = array_flip($primaryDNSservers)[$primaryDNS];
				}

				// Validate primary IP
				if (!filter_var($primaryIP, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === true)
				{
					$error = "Primary IP (".$primaryIP.") is invalid!";
				}

				// Get secondary DNS server IP address
				if($secondaryDNS === "Custom")
				{
					$secondaryIP = $_POST["DNS2IP"];
				}
				else
				{
					$secondaryIP = array_flip($secondaryDNSservers)[$secondaryDNS];
				}

				// Validate secondary IP
				if (!filter_var($secondaryIP, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === true)
				{
					$error = "Secondary IP (".$secondaryIP.") is invalid!";
				}

				// If there has been no error we can save the new DNS server IPs
				if(!isset($error))
				{
					$cmd = "sudo pihole -a setdns ".$primaryIP." ".$secondaryIP;
					exec($cmd);
				}

				break;

			default:

				break;
		}
	}
?>
