<?php
// Allow file_get_contents to read remote sources via URL
ini_set("allow_url_fopen", 1);

// Function that grabs latest tag from GitHub
function get_github_version($url)
{
	// Have to fake the user agent to be able to query from Github's API
	$context = stream_context_create(array("http" => array("user_agent" => "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36")));

	$json = file_get_contents($url, false, $context);
	$result = json_decode($json);

	return $result->tag_name;
}

/********** Get Pi-hole core branch / version / commit **********/
// Check if on a dev branch
$core_branch = exec("cd /etc/.pihole/ && git rev-parse --abbrev-ref HEAD");
if($core_branch !== "master") {
    $core_current = "vDev";
    $core_commit = exec("cd /etc/.pihole/ && git describe --long --dirty --tags");
}
else {
    $core_current = exec("cd /etc/.pihole/ && git describe --tags --abbrev=0");
}

/********** Get Pi-hole web branch / version / commit **********/
$web_branch = exec("git rev-parse --abbrev-ref HEAD");
if($web_branch !== "master") {
    $web_current = "vDev";
    $web_commit = exec("git describe --long --dirty --tags");
}
else {
    $web_current = exec("git describe --tags --abbrev=0");
}

/********** Get Pi-hole FTL version (not a git repository) **********/
$FTL_current = exec("pihole-FTL version");

// can write only in the root web dir, i.e. /var/www/html
$versionfile = "../versions";

$check_version = false;

// Check version if version buffer file does not exist
if(is_readable($versionfile))
{
	// Obtain latest time stamp from buffer file
	$versions = explode(",",file_get_contents($versionfile));
	$date = date_create();
	$timestamp = date_timestamp_get($date);

	// Is last check for updates older than 30 minutes?
	if($timestamp >= intval($versions[0]) + 1800)
	{
		// Yes: Retrieve new/updated version data
		$check_version = true;
	}
	else
	{
		// No: We can use the buffered data
		$check_version = false;
	}
}
else
{
	// No buffer file or not readable: Request version data
	$check_version = true;
}

// Get data from GitHub if requested
if($check_version){
	$core_latest = get_github_version("https://api.github.com/repos/pi-hole/pi-hole/releases/latest");
	$web_latest = get_github_version("https://api.github.com/repos/pi-hole/AdminLTE/releases/latest");
	$FTL_latest = get_github_version("https://api.github.com/repos/pi-hole/FTL/releases/latest");

	// Save to buffer file
	file_put_contents($versionfile, array($timestamp,",",$core_latest,",",$web_latest,",",$FTL_latest));
}
else
{
	// Use data from buffer file
	$core_latest = $versions[1];
	$web_latest = $versions[2];
	$FTL_latest = $versions[3];
}

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
$FTL_update = (version_compare($FTL_current, $FTL_latest) < 0);

?>
