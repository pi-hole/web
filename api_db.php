<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */

$api = true;
header('Content-type: application/json');
require("scripts/pi-hole/php/password.php");
require("scripts/pi-hole/php/auth.php");
check_cors();

// Set maximum execution time to 10 minutes
ini_set("max_execution_time","600");

$data = array();

// Get posible non-standard location of FTL's database
$FTLsettings = parse_ini_file("/etc/pihole/pihole-FTL.conf");
if(isset($FTLsettings["DBFILE"]))
{
	$DBFILE = $FTLsettings["DBFILE"];
}
else
{
	$DBFILE = "/etc/pihole/pihole-FTL.db";
}

// Needs package php5-sqlite, e.g.
//    sudo apt-get install php5-sqlite

function SQLite3_connect($trytoreconnect)
{
	global $DBFILE;
	try
	{
		// connect to database
		return new SQLite3($DBFILE, SQLITE3_OPEN_READONLY);
	}
	catch (Exception $exception)
	{
		// sqlite3 throws an exception when it is unable to connect, try to reconnect after 3 seconds
		if($trytoreconnect)
		{
			sleep(3);
			$db = SQLite3_connect(false);
		}
	}
}

if(strlen($DBFILE) > 0)
{
	$db = SQLite3_connect(true);
}
else
{
	die("No database available");
}
if(!$db)
{
	die("Error connecting to database");
}

if (isset($_GET['getAllQueries']) && $auth)
{
	$allQueries = array();
	if($_GET['getAllQueries'] !== "empty")
	{
		$from = intval($_GET["from"]);
		$until = intval($_GET["until"]);
		$stmt = $db->prepare("SELECT timestamp, type, domain, client, status FROM queries WHERE timestamp >= :from AND timestamp <= :until ORDER BY timestamp ASC");
		$stmt->bindValue(":from", intval($from), SQLITE3_INTEGER);
		$stmt->bindValue(":until", intval($until), SQLITE3_INTEGER);
		$results = $stmt->execute();
		$clients = array();
		if(!is_bool($results))
			while ($row = $results->fetchArray())
			{
				$c = $row[3];
				if(array_key_exists($row[3], $clients))
				{
					// Entry already exists
					$c = $clients[$row[3]];
				}
				else
				{
					if(filter_var($row[3], FILTER_VALIDATE_IP))
					{
						// Get host name of client and convert to lower case
						$c = strtolower(gethostbyaddr($row[3]));
					}
					else
					{
						// This is already a host name
						$c = strtolower($row[3]);
					}
					// Buffer result
					$clients[$row[3]] = $c;
				}
				$allQueries[] = [$row[0],$row[1] == 1 ? "IPv4" : "IPv6",$row[2],$c,$row[4]];
			}
	}
	$result = array('data' => $allQueries);
	$data = array_merge($data, $result);
}

if (isset($_GET['topClients']) && $auth)
{
	// $from = intval($_GET["from"]);
	$limit = "";
	if(isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = "WHERE timestamp >= :from AND timestamp <= :until";
	}
	elseif(isset($_GET["from"]) && !isset($_GET["until"]))
	{
		$limit = "WHERE timestamp >= :from";
	}
	elseif(!isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = "WHERE timestamp <= :until";
	}
	$stmt = $db->prepare('SELECT client,count(client) FROM queries '.$limit.' GROUP by client order by count(client) desc limit 20');
	$stmt->bindValue(":from", intval($_GET['from']), SQLITE3_INTEGER);
	$stmt->bindValue(":until", intval($_GET['until']), SQLITE3_INTEGER);
	$results = $stmt->execute();

	$clients = array();

	if(!is_bool($results))
		while ($row = $results->fetchArray())
		{
			if(filter_var($row[0], FILTER_VALIDATE_IP))
			{
				// Get host name of client and convert to lower case
				$c = strtolower(gethostbyaddr($row[0]));
			}
			else
			{
				// This is already a host name
				$c = strtolower($row[0]);
			}
			if(array_key_exists($c, $clients))
			{
				// Entry already exists, add to it (might appear multiple times due to mixed capitalization in the database)
				$clients[$c] += intval($row[1]);
			}
			else
			{
				// Entry does not yet exist
				$clients[$c] = intval($row[1]);
			}
		}

	// Sort by number of hits
	arsort($clients);

	// Extract only the first ten entries
	$clients = array_slice($clients, 0, 10);

	$result = array('top_sources' => $clients);
	$data = array_merge($data, $result);
}

if (isset($_GET['topDomains']) && $auth)
{
	$limit = "";

	if(isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from AND timestamp <= :until";
	}
	elseif(isset($_GET["from"]) && !isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from";
	}
	elseif(!isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp <= :until";
	}
	$stmt = $db->prepare('SELECT domain,count(domain) FROM queries WHERE (STATUS == 2 OR STATUS == 3)'.$limit.' GROUP by domain order by count(domain) desc limit 20');
	$stmt->bindValue(":from", intval($_GET['from']), SQLITE3_INTEGER);
	$stmt->bindValue(":until", intval($_GET['until']), SQLITE3_INTEGER);
	$results = $stmt->execute();

	$domains = array();

	if(!is_bool($results))
		while ($row = $results->fetchArray())
		{
			// Convert client to lower case
			$c = strtolower($row[0]);
			if(array_key_exists($c, $domains))
			{
				// Entry already exists, add to it (might appear multiple times due to mixed capitalization in the database)
				$domains[$c] += intval($row[1]);
			}
			else
			{
				// Entry does not yet exist
				$domains[$c] = intval($row[1]);
			}
		}

	// Sort by number of hits
	arsort($domains);

	// Extract only the first ten entries
	$domains = array_slice($domains, 0, 10);

	$result = array('top_domains' => $domains);
	$data = array_merge($data, $result);
}

if (isset($_GET['topAds']) && $auth)
{
	$limit = "";

	if(isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from AND timestamp <= :until";
	}
	elseif(isset($_GET["from"]) && !isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from";
	}
	elseif(!isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp <= :until";
	}
	$stmt = $db->prepare('SELECT domain,count(domain) FROM queries WHERE (STATUS == 1 OR STATUS == 4)'.$limit.' GROUP by domain order by count(domain) desc limit 10');
	$stmt->bindValue(":from", intval($_GET['from']), SQLITE3_INTEGER);
	$stmt->bindValue(":until", intval($_GET['until']), SQLITE3_INTEGER);
	$results = $stmt->execute();

	$addomains = array();

	if(!is_bool($results))
		while ($row = $results->fetchArray())
		{
			$addomains[$row[0]] = intval($row[1]);
		}
	$result = array('top_ads' => $addomains);
	$data = array_merge($data, $result);
}

if (isset($_GET['getMinTimestamp']) && $auth)
{
	$results = $db->query('SELECT MIN(timestamp) FROM queries');

	if(!is_bool($results))
		$result = array('mintimestamp' => $results->fetchArray()[0]);
	else
		$result = array();

	$data = array_merge($data, $result);
}

if (isset($_GET['getMaxTimestamp']) && $auth)
{
	$results = $db->query('SELECT MAX(timestamp) FROM queries');

	if(!is_bool($results))
		$result = array('maxtimestamp' => $results->fetchArray()[0]);
	else
		$result = array();

	$data = array_merge($data, $result);
}

if (isset($_GET['getQueriesCount']) && $auth)
{
	$results = $db->query('SELECT COUNT(timestamp) FROM queries');

	if(!is_bool($results))
		$result = array('count' => $results->fetchArray()[0]);
	else
		$result = array();

	$data = array_merge($data, $result);
}

if (isset($_GET['getDBfilesize']) && $auth)
{
	$filesize = filesize("/etc/pihole/pihole-FTL.db");
	$result = array('filesize' => $filesize);
	$data = array_merge($data, $result);
}

if (isset($_GET['getGraphData']) && $auth)
{
	$limit = "";

	if(isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from AND timestamp <= :until";
	}
	elseif(isset($_GET["from"]) && !isset($_GET["until"]))
	{
		$limit = " AND timestamp >= :from";
	}
	elseif(!isset($_GET["from"]) && isset($_GET["until"]))
	{
		$limit = " AND timestamp <= :until";
	}

	$interval = 600;

	if(isset($_GET["interval"]))
	{
		$q = intval($_GET["interval"]);
		if($q > 10)
			$interval = $q;
	}

	// Count permitted queries in intervals
	$stmt = $db->prepare('SELECT (timestamp/:interval)*:interval interval, COUNT(*) FROM queries WHERE (status != 0 )'.$limit.' GROUP by interval ORDER by interval');
	$stmt->bindValue(":from", intval($_GET['from']), SQLITE3_INTEGER);
	$stmt->bindValue(":until", intval($_GET['until']), SQLITE3_INTEGER);
	$stmt->bindValue(":interval", $interval, SQLITE3_INTEGER);
	$results = $stmt->execute();

	$domains = array();

	if(!is_bool($results))
		while ($row = $results->fetchArray())
		{
			$domains[$row[0]] = intval($row[1]);
		}
	$result = array('domains_over_time' => $domains);
	$data = array_merge($data, $result);

	// Count blocked queries in intervals
	$stmt = $db->prepare('SELECT (timestamp/:interval)*:interval interval, COUNT(*) FROM queries WHERE (status == 1 OR status == 4 OR status == 5)'.$limit.' GROUP by interval ORDER by interval');
	$stmt->bindValue(":from", intval($_GET['from']), SQLITE3_INTEGER);
	$stmt->bindValue(":until", intval($_GET['until']), SQLITE3_INTEGER);
	$stmt->bindValue(":interval", $interval, SQLITE3_INTEGER);
	$results = $stmt->execute();

	$addomains = array();

	if(!is_bool($results))
		while ($row = $results->fetchArray())
		{
			$addomains[$row[0]] = intval($row[1]);
		}
	$result = array('ads_over_time' => $addomains);
	$data = array_merge($data, $result);
}

if(isset($_GET["jsonForceObject"]))
{
	echo json_encode($data, JSON_FORCE_OBJECT);
}
else
{
	echo json_encode($data);
}
