<?php

if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
{
	die("Direct access to this script is forbidden!");
}

function validIP($address){
	return !filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false;
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

// Credit: http://stackoverflow.com/a/4694816/2087442
function validDomain($domain_name)
{
	$validChars = preg_match("/^([_a-z\d](-*[_a-z\d])*)(\.([_a-z\d](-*[a-z\d])*))*(\.([a-z\d])*)*$/i", $domain_name);
	$lengthCheck = preg_match("/^.{1,253}$/", $domain_name);
	$labelLengthCheck = preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name);
	return ( $validChars && $lengthCheck && $labelLengthCheck ); //length of each label
}

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

	$error = "";
	$success = "";

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
					$error .= "Primary IP (".$primaryIP.") is invalid!<br>";
				}

				// Get secondary DNS server IP address
				if($secondaryDNS === "Custom")
				{
					if(strlen($_POST["DNS2IP"]) > 0)
					{
						$secondaryIP = $_POST["DNS2IP"];
					}
					else
					{
						$secondaryIP = "none";
					}
				}
				else
				{
					$secondaryIP = array_flip($secondaryDNSservers)[$secondaryDNS];
				}

				// Validate secondary IP
				if (!validIP($secondaryIP) && $secondaryIP != "none" && strlen($secondaryIP) > 0)
				{
					$error .= "Secondary IP (".$secondaryIP.") is invalid!<br>";
				}

				// Check if domain-needed is requested
				if(isset($_POST["DNSrequiresFQDN"]))
				{
					$extra = "domain-needed ";
				}
				else
				{
					$extra = "domain-not-needed ";
				}

				// Check if domain-needed is requested
				if(isset($_POST["DNSbogusPriv"]))
				{
					$extra .= "bogus-priv";
				}
				else
				{
					$extra .= "no-bogus-priv";
				}

				// If there has been no error we can save the new DNS server IPs
				if(!strlen($error))
				{
					exec("sudo pihole -a setdns ".$primaryIP." ".$secondaryIP." ".$extra);
					$success .= "The DNS settings have been updated";
				}
				else
				{
					$error .= "The settings have been reset to their previous values";
				}

				break;

			// Set query logging
			case "Logging":

				if($_POST["action"] === "Disable")
				{
					exec("sudo pihole -l off");
					$success .= "Logging has been disabled";
				}
				else
				{
					exec("sudo pihole -l on");
					$success .= "Logging has been enabled";
				}

				break;

			// Set domains to be excluded from being shown in Top Domains (or Ads) and Top Clients
			case "API":

				// Explode the contents of the textareas into PHP arrays
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
						$error .= "Top Domains/Ads entry ".$domain." is invalid!<br>";
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
					if(!validIP($client))
					{
						$error .= "Top Clients entry ".$client." is invalid (use only IP addresses)!<br>";
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

				// Set Top Lists options
				if(!strlen($error))
				{
					// All entries are okay
					exec("sudo pihole -a setexcludedomains ".$domainlist);
					exec("sudo pihole -a setexcludeclients ".$clientlist);
					$success .= "The API settings have been updated<br>";
				}
				else
				{
					$error .= "The settings have been reset to their previous values";
				}

				// Set query log options
				if(isset($_POST["querylog-permitted"]) && isset($_POST["querylog-blocked"]))
				{
					exec("sudo pihole -a setquerylog all");
					if(!isset($_POST["privacyMode"]))
					{
						$success .= "All entries will be shown in Query Log";
					}
					else
					{
						$success .= "Only blocked entries will be shown in Query Log";
					}
				}
				elseif(isset($_POST["querylog-permitted"]))
				{
					exec("sudo pihole -a setquerylog permittedonly");
					if(!isset($_POST["privacyMode"]))
					{
						$success .= "Only permitted will be shown in Query Log";
					}
					else
					{
						$success .= "No entries will be shown in Query Log";
					}
				}
				elseif(isset($_POST["querylog-blocked"]))
				{
					exec("sudo pihole -a setquerylog blockedonly");
					$success .= "Only blocked entries will be shown in Query Log";
				}
				else
				{
					exec("sudo pihole -a setquerylog nothing");
					$success .= "No entries will be shown in Query Log";
				}


				if(isset($_POST["privacyMode"]))
				{
					exec("sudo pihole -a privacymode true");
					$success .= " (privacy mode enabled)";
				}
				else
				{
					exec("sudo pihole -a privacymode false");
				}

				if(isset($_POST["resolve-forward"]))
				{
					exec("sudo pihole -a resolve forward true");
				}
				else
				{
					exec("sudo pihole -a resolve forward false");
				}

				if(isset($_POST["resolve-clients"]))
				{
					exec("sudo pihole -a resolve clients true");
				}
				else
				{
					exec("sudo pihole -a resolve clients false");
				}

				break;

			case "webUI":
				if($_POST["tempunit"] == "F")
				{
					exec('sudo pihole -a -f');
				}
				elseif($_POST["tempunit"] == "K")
				{
					exec('sudo pihole -a -k');
				}
				else
				{
					exec('sudo pihole -a -c');
				}
				if(isset($_POST["boxedlayout"]))
				{
					exec('sudo pihole -a layout boxed');
				}
				else
				{
					exec('sudo pihole -a layout traditional');
				}
				$success .= "The webUI settings have been updated";
				break;

			case "reboot":
				exec("sudo pihole -a reboot");
				$success = "The system will reboot in 5 seconds...";
				break;

			case "restartdns":
				exec("sudo pihole -a restartdns");
				$success = "The DNS server has been restarted";
				break;

			case "flushlogs":
				exec("sudo pihole -f");
				$success = "The Pi-Hole log file has been flushed";
				break;

			case "DHCP":

				if(isset($_POST["active"]))
				{
					// Validate from IP
					$from = $_POST["from"];
					if (!validIP($from))
					{
						$error .= "From IP (".$from.") is invalid!<br>";
					}

					// Validate to IP
					$to = $_POST["to"];
					if (!validIP($to))
					{
						$error .= "To IP (".$to.") is invalid!<br>";
					}

					// Validate router IP
					$router = $_POST["router"];
					if (!validIP($router))
					{
						$error .= "Router IP (".$router.") is invalid!<br>";
					}

					$domain = $_POST["domain"];

					// Validate Domain name
					if(!validDomain($domain))
					{
						$error .= "Domain name ".$domain." is invalid!<br>";
					}

					$leasetime = $_POST["leasetime"];

					// Validate Lease time length
					if(!is_numeric($leasetime) || intval($leasetime) < 0)
					{
						$error .= "Lease time ".$leasetime." is invalid!<br>";
					}

					if(isset($_POST["useIPv6"]))
					{
						$ipv6 = "true";
						$type = "(IPv4 + IPv6)";
					}
					else
					{
						$ipv6 = "false";
						$type = "(IPv4)";
					}

					if(!strlen($error))
					{
						exec("sudo pihole -a enabledhcp ".$from." ".$to." ".$router." ".$leasetime." ".$domain." ".$ipv6);
						$success .= "The DHCP server has been activated ".$type;
					}
				}
				else
				{
					exec("sudo pihole -a disabledhcp");
					$success = "The DHCP server has been deactivated";
				}

				break;

			default:
				// Option not found
				$debug = true;
				break;
		}
	}

	// Credit: http://stackoverflow.com/a/5501447/2087442
	function formatSizeUnits($bytes)
	{
		if ($bytes >= 1073741824)
		{
			$bytes = number_format($bytes / 1073741824, 2) . ' GB';
		}
		elseif ($bytes >= 1048576)
		{
			$bytes = number_format($bytes / 1048576, 2) . ' MB';
		}
		elseif ($bytes >= 1024)
		{
			$bytes = number_format($bytes / 1024, 2) . ' kB';
		}
		elseif ($bytes > 1)
		{
			$bytes = $bytes . ' bytes';
		}
		elseif ($bytes == 1)
		{
			$bytes = $bytes . ' byte';
		}
		else
		{
			$bytes = '0 bytes';
		}

		return $bytes;
	}
?>
