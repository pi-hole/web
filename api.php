<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */

$api = true;
header('Content-type: application/json');
require("scripts/pi-hole/php/FTL.php");
require("scripts/pi-hole/php/password.php");
require("scripts/pi-hole/php/auth.php");
check_cors();

$FTL_IP = "127.0.0.1";

$data = array();

// Common API functions
if (isset($_GET['status']))
{
	$pistatus = exec('sudo pihole status web');
	if ($pistatus == "1")
	{
		$data = array_merge($data, array("status" => "enabled"));
	}
	else
	{
		$data = array_merge($data, array("status" => "disabled"));
	}
}
elseif (isset($_GET['enable']) && $auth)
{
	if(isset($_GET["auth"]))
	{
	if($_GET["auth"] !== $pwhash)
		die("Not authorized!");
	}
	else
	{
		// Skip token validation if explicit auth string is given
		check_csrf($_GET['token']);
	}
	exec('sudo pihole enable');
	$data = array_merge($data, array("status" => "enabled"));
	unlink("../custom_disable_timer");
}
elseif (isset($_GET['disable']) && $auth)
{
	if(isset($_GET["auth"]))
	{
		if($_GET["auth"] !== $pwhash)
			die("Not authorized!");
	}
	else
	{
		// Skip token validation if explicit auth string is given
		check_csrf($_GET['token']);
	}
	$disable = intval($_GET['disable']);
	// intval returns the integer value on success, or 0 on failure
	if($disable > 0)
	{
		$timestamp = time();
		exec("sudo pihole disable ".$disable."s");
		file_put_contents("../custom_disable_timer",($timestamp+$disable)*1000);
	}
	else
	{
		exec('sudo pihole disable');
		unlink("../custom_disable_timer");
	}
	$data = array_merge($data, array("status" => "disabled"));
}

// Other API functions
if(!testFTL($FTL_IP) && !isset($_GET["PHP"]))
{
	$data = array_merge($data, array("FTLnotrunning" => true));
}
else
{
	if(!isset($_GET["PHP"]))
	{
		require("api_FTL.php");
	}
	else
	{
		require("api_PHP.php");
	}
}

if(isset($_GET["jsonForceObject"]))
{
	echo json_encode($data, JSON_FORCE_OBJECT);
}
else
{
	echo json_encode($data);
}
?>
