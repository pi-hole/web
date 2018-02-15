<?php

$localversions = "/etc/pihole/localversions";
$localbranches = "/etc/pihole/localbranches";
$GitHubVersions = "/etc/pihole/GitHubVersions";

if(!is_readable($localversions) || !is_readable($localbranches) || !is_readable($GitHubVersions))
{
	$core_branch = "master";
	$core_current = "N/A";
	$core_update = false;
	$web_branch = "master";
	$web_current = "N/A";
	$web_update = false;
	$FTL_current = "N/A";
	$FTL_update = false;
}
else
{
	$versions = explode(" ", file_get_contents($localversions));
	$branches = explode(" ", file_get_contents($localbranches));
	$GitHubversions = explode(" ", file_get_contents($GitHubVersions));

	/********** Get Pi-hole core branch / version / commit **********/
	// Check if on a dev branch
	$core_branch = $branches[0];
	if($core_branch !== "master") {
	    $core_current = "vDev";
	    $core_commit = $versions[0];
	}
	else {
	    $core_current = explode("-",$versions[0])[0];
	}

	/********** Get Pi-hole web branch / version / commit **********/
	$web_branch = $branches[1];
	if($web_branch !== "master") {
	    $web_current = "vDev";
	    $web_commit = $versions[1];
	}
	else {
	    $web_current = explode("-",$versions[1])[0];
	}

	/********** Get Pi-hole FTL (not a git repository) **********/
	$FTL_branch = $branches[2];
	if(substr($versions[2], 0, 4) === "vDev") {
	    $FTL_current = "vDev";
	    $FTL_commit = $versions[2];
	}
	else {
	    $FTL_current = $versions[2];
	}

	// Get data from GitHub
	$core_latest = $GitHubversions[0];
	$web_latest = $GitHubversions[1];
	$FTL_latest = $GitHubversions[2];

	// Core version comparison
	if($core_current !== "vDev")
	{
		// This logic allows the local core version to be newer than the upstream version
		// The update indicator is only shown if the upstream version is NEWER
		$core_update = (version_compare($core_current, $core_latest) < 0);
	}
	else
	{
		$core_update = false;
	}

	// Web version comparison
	if($web_current !== "vDev")
	{
		// This logic allows the local core version to be newer than the upstream version
		// The update indicator is only shown if the upstream version is NEWER
		$web_update = (version_compare($web_current, $web_latest) < 0);
	}
	else
	{
		$web_update = false;
	}

	// FTL version comparison
	// This logic allows the local core version to be newer than the upstream version
	// The update indicator is only shown if the upstream version is NEWER
	if($FTL_current !== "vDev")
	{
		$FTL_update = (version_compare($FTL_current, $FTL_latest) < 0);
	}
	else
	{
		$FTL_update = false;
	}

}

?>
