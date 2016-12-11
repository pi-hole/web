<?php

function validIP($address){
	return filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false;
}

// Credit: http://stackoverflow.com/a/4694816/2087442
function validDomain($domain_name)
{
	$validChars = preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $domain_name);
	$lengthCheck = preg_match("/^.{1,253}$/", $domain_name);
	$labelLengthCheck = preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name);
	return ( $validChars && $lengthCheck && $labelLengthCheck ); //length of each label
}

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
				if (!validIP($primaryIP))
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
				if (!validIP($secondaryIP))
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

			// Set query logging
			case "Logging":

				if($_POST["action"] === "Disable")
				{
					exec("sudo pihole -l off");
				}
				else
				{
					exec("sudo pihole -l on");
				}

				break;

			// Set domains to be excludef from being shown in Top Domains (or Ads) and Top Clients
			case "API":

				// Explode the contests of the textareas into PHP arrays
				// \n (Unix) and \r\n (Win) will be considered as newline
				// array_filter( ... ) will remove any empty lines
				$domains = array_filter(preg_split('/\r\n|[\r\n]/', $_POST["domains"]));
				$clients = array_filter(preg_split('/\r\n|[\r\n]/', $_POST["clients"]));

				$domainlist = "";
				$first = true;
				foreach($domains as $domain)
				{
					if(!validDomain($domain))
					{
						$error = "Entry ".$domain." is invalid!";
						break;
					}
					if(!$first)
					{
						$domainlist .= ",";
					}
					else
					{
						$first = false;
					}
					$domainlist .= $domain;
				}

				$clientlist = "";
				$first = true;
				foreach($clients as $client)
				{
					if(!validDomain($client))
					{
						$error = "Entry ".$client." is invalid!";
						break;
					}
					if(!$first)
					{
						$clientlist .= ",";
					}
					else
					{
						$first = false;
					}
					$clientlist .= $client;
				}

				if(!isset($error))
				{
					// All entries are okay
					$cmd = "sudo pihole -a setexcludedomains ".$domainlist;
					exec($cmd);
					$cmd = "sudo pihole -a setexcludeclients ".$clientlist;
					exec($cmd);
				}

				break;

			case "webUI":
				if($_POST["tempunit"] == "F")
				{
					exec('sudo pihole -a -f');
				}
				else
				{
					exec('sudo pihole -a -c');
				}

			case "reboot":
				exec("sudo pihole -a reboot");
				break;

			default:

				break;
		}
	}
?>
