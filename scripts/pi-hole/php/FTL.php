<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once("func.php");

$piholeFTLConfFile = "/etc/pihole/pihole-FTL.conf";
$piholeFTLPidFile = "/run/pihole-FTL.pid";

function piholeFTLVersion()
{
	static $piholeFTLVersion;

	if( !isset( $piholeFTLVersion ))
	{
		$piholeFTLVersion = readPiholeFTLVersion();
	}

	return $piholeFTLVersion;
}

function readPiholeFTLVersion()
{
	$version = pihole_execute( 'version' );

	if( isset( $version[0] ))
	{
		return $version[0];
	}
}

function piholeFTLStatus()
{
	static $piholeFTLStatus;

	if( !isset( $piholeFTLStatus ))
	{
		$piholeFTLStatus = readPiholeFTLStatus();
	}

	return $piholeFTLStatus;
}

function readPiholeFTLStatus()
{
	$status = pihole_execute( 'status web' );

	if( isset( $status[0] ))
	{
		return (int)$status[0];
	}
}

function piholeFTLPid()
{
	static $piholeFTLPid;

	if( !isset( $piholeFTLPid ))
	{
		$piholeFTLPid = readPiholeFTLPid();
	}

	return $piholeFTLPid;
}

function readPiholeFTLPid()
{
	global $piholeFTLPidFile;

	if( is_readable( $piholeFTLPidFile ))
	{
		$pid = (int)file_get_contents( $piholeFTLPidFile );

		if( $pid > 0 )
		{
			return $pid;
		}
	}

	// Not running
	return -1;
}

function piholeFTLActive()
{
	return ( piholeFTLPid() > 0 );
}

function piholeFTLProcessInfo( $key = null )
{
	static $piholeFTLProcessInfo;

	if( !isset( $piholeFTLProcessInfo ))
	{
		$piholeFTLProcessInfo = readPiholeFTLProcessInfo();
	}

	if( isset( $key ))
	{
		if( isset( $piholeFTLProcessInfo[ $key ] ))
		{
			return $piholeFTLProcessInfo[ $key ];
		}
		else
		{
			return null;
		}
	}

	return $piholeFTLProcessInfo;
}

function readPiholeFTLProcessInfo()
{
	$pid = piholeFTLPid();

	if( $pid < 0 )
	{
		return array();
	}

	// Output of ps is split by spaces!
	// `ps` man page: "The following ... specifiers may contain spaces:
	// args, cmd, comm, command, fname, ucmd, ucomm, lstart, bsdstart, start"
	// `ltime` contains spaces and must therefore be at the end of the list.
	$keys = array(
		'user' => "euser",
		'group' => "egroup",
		'cpu' => "%cpu",
		'mem' => "%mem",
		'rss' => "rss",
		'start' => "lstart",
	);

	$ps = preg_split(
		'/\s+/',
		exec( "ps -p " . $pid . " --no-headers -o " . implode( ",", $keys )),
		count( $keys )
	);

	if( $ps === false )
	{
		return array();
	}

	$info = [];
	foreach( array_keys( $keys ) as $idx => $key )
	{
		if( isset( $ps[ $idx ] ))
		{
			$info[ $key ] = $ps[ $idx ];
		}
	}

	return $info;
}

function piholeFTLuser()
{
	return piholeFTLProcessInfo( 'user' );
}

function piholeFTLgroup()
{
	return piholeFTLProcessInfo( 'group' );
}

function piholeFTLCpu()
{
	return (float)piholeFTLProcessInfo( 'cpu' );
}

function piholeFTLMem()
{
	return (float)piholeFTLProcessInfo( 'mem' );
}

function piholeFTLRss()
{
	return (float)piholeFTLProcessInfo( 'rss' ) * 1000;
}

function piholeFTLStart()
{
	return strtotime( piholeFTLProcessInfo( 'start' ));
}

function piholeFTLTemperature()
{
	static $piholeFTLTemperature;

	if( !isset( $piholeFTLTemperature ))
	{
		$piholeFTLTemperature = readPiholeFTLTemperature();
	}

	return $piholeFTLTemperature;
}

function readPiholeFTLTemperature()
{
	$sensors = array_merge( glob( '/sys/class/thermal/thermal_zone?/temp' ), glob( '/sys/class/hwmon/hwmon?/temp1_input' ));
	$temperature = null;

	foreach( $sensors as $sensor )
	{
		if( is_readable( $sensor ))
		{
			$temperature = (int)trim( file_get_contents( $sensor )) / 1000;
			break;
		}
	}

	return $temperature;
}

function piholeFTLLoad()
{
	$load = sys_getloadavg();

	if( $load === false )
	{
		return array( null, null, null );
	}

	return $load;
}

function piholeFTLLoadLimit()
{
	static $piholeFTLLoadLimit;

	if( !isset( $piholeFTLLoadLimit ))
	{
		$piholeFTLLoadLimit = readPiholeFTLLoadLimit();
	}

	return $piholeFTLLoadLimit;
}

function readPiholeFTLLoadLimit()
{
	$limit = (int)exec( 'nproc' );

	if( $limit < 1 )
	{
			$cpuinfo = file_get_contents( "/proc/cpuinfo" );
			$limit = preg_match_all( '/^processor/m', $cpuinfo );
	}

	if( $limit > 0 )
	{
		return $limit;
	}
}

function piholeFTLMemoryUsage()
{
	static $piholeFTLMemoryUsage;

	if( !isset( $piholeFTLMemoryUsage ))
	{
		$piholeFTLMemoryUsage = readPiholeFTLMemoryUsage();
	}

	return $piholeFTLMemoryUsage;
}

function readPiholeFTLMemoryUsage()
{
	$meminfo = file( "/proc/meminfo", FILE_IGNORE_NEW_LINES );

	if( $meminfo === false )
	{
		return null;
	}

	$memTotal = null;
	$memAvaliable = null;
	$memFree = null;
	$memBuffers = 0;
	$memCached = 0;

	foreach( $meminfo as $line )
	{
		if( preg_match( '/^MemTotal:\s+(\d+) kB/', $line, $matches ))
		{
			$memTotal = (int)$matches[1];

			if( !( $memTotal > 0 ))
			{
				return null;
			}

			continue;
		}

		if( preg_match( '/^MemAvailable:\s+(\d+) kB/', $line, $matches ))
		{
			$memAvaliable = (int)$matches[1];

			if( isset( $memTotal ))
			{
			}

			continue;
		}

		if( preg_match( '/^MemFree:\s+(\d+) kB/', $line, $matches ))
		{
			$memFree = (int)$matches[1];
			continue;
		}

		if( preg_match( '/^Buffers:\s+(\d+) kB/', $line, $matches ))
		{
			$memBuffers = (int)$matches[1];
			continue;
		}

		if( preg_match( '/^Cached:\s+(\d+) kB/', $line, $matches ))
		{
			$memCached = (int)$matches[1];
			continue;
		}
	}

	if( isset( $memTotal ))
	{
		if( isset( $memAvaliable ))
		{
			return ( $memTotal - $memAvaliable ) / $memTotal;
		}

		if( isset( $memFree ))
		{
			return ( $memTotal - $memFree - $memBuffers - $memCached ) / $memTotal;
		}
	}
}

function piholeFTLMemoryUsageLimit()
{
	return 0.75;
}

function piholeFTLConfig()
{
	static $piholeFTLConfig;
	global $piholeFTLConfFile;

	if(isset($piholeFTLConfig))
	{
		return $piholeFTLConfig;
	}

	if(is_readable($piholeFTLConfFile))
	{
		$piholeFTLConfig = parse_ini_file($piholeFTLConfFile);
	}
	else
	{
		$piholeFTLConfig = array();
	}

	return $piholeFTLConfig;
}

function connectFTL($address, $port=4711)
{
	if($address == "127.0.0.1")
	{
		$config = piholeFTLConfig();
		// Read port
		$portfileName = isset($config['PORTFILE']) ? $config['PORTFILE'] : '';
		if ($portfileName != '')
		{
			$portfileContents = file_get_contents($portfileName);
			if(is_numeric($portfileContents))
				$port = intval($portfileContents);
		}
	}

	// Open Internet socket connection
	$socket = @fsockopen($address, $port, $errno, $errstr, 1.0);

	return $socket;
}

function sendRequestFTL($requestin)
{
	global $socket;

	$request = ">".$requestin;
	fwrite($socket, $request) or die('{"error":"Could not send data to server"}');
}

function getResponseFTL()
{
	global $socket;

	$response = [];

	$errCount = 0;
	while(true)
	{
		$out = fgets($socket);
		if ($out == "") $errCount++;
		if ($errCount > 100) {
			// Tried 100 times, but never got proper reply, fail to prevent busy loop
			die('{"error":"Tried 100 times to connect to FTL server, but never got proper reply. Please check Port and logs!"}');
		}
		if(strrpos($out,"---EOM---") !== false)
			break;

		$out = rtrim($out);
		if(strlen($out) > 0)
			$response[] = $out;
	}

	return $response;
}

function disconnectFTL()
{
	global $socket;
	fclose($socket);
}
?>
