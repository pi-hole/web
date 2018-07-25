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
elseif (isset($_GET['versions']))
{
	// Determine if updates are available for Pi-hole
	// using the same script that we use for the footer
	// on the dashboard (update notifications are
	// suppressed if on development branches)
	require "scripts/pi-hole/php/update_checker.php";
	$updates = array("core_update" => $core_update,
	                 "web_update" => $web_update,
	                 "FTL_update" => $FTL_update);
	$current = array("core_current" => $core_current,
	                 "web_current" => $web_current,
	                 "FTL_current" => $FTL_current);
	$latest = array("core_latest" => $core_latest,
	                "web_latest" => $web_latest,
	                "FTL_latest" => $FTL_latest);
	$branches = array("core_branch" => $core_branch,
	                  "web_branch" => $web_branch,
	                  "FTL_branch" => $FTL_branch);
	$data = array_merge($data, $updates);
	$data = array_merge($data, $current);
	$data = array_merge($data, $latest);
	$data = array_merge($data, $branches);
}

// Other API functions
require("api_FTL.php");

if(isset($_GET["jsonForceObject"]))
{
	echo json_encode($data, JSON_FORCE_OBJECT);
}
else
{
	echo json_encode($data);
}
?>
