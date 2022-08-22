<?php

function checkUpdate($currentVersion, $latestVersion)
{
    // This logic allows the local core version to be newer than the upstream version
    // The update indicator is only shown if the upstream version is NEWER
    if ($currentVersion !== 'vDev') {
        return version_compare($currentVersion, $latestVersion) < 0;
    } else {
        return false;
    }
}

$versionsfile = '/etc/pihole/versions';

if (!is_readable($versionsfile)) {
    $core_branch = 'master';
    $core_current = 'N/A';
    $core_update = false;

    $web_branch = 'master';
    $web_current = 'N/A';
    $web_update = false;

    $FTL_current = 'N/A';
    $FTL_update = false;

    $docker_current = 'N/A';
    $docker_update = false;
} else {
    $versions = parse_ini_file($versionsfile);

    // Get Pi-hole core branch / version / commit
    // Check if on a dev branch
    $core_branch = $versions['CORE_BRANCH'];
    if ($core_branch !== 'master') {
        $core_current = 'vDev';
        $core_commit = $versions['CORE_VERSION'];
    } else {
        $core_current = explode('-', $versions['CORE_VERSION'])[0];
    }

    // Get Pi-hole web branch / version / commit
    $web_branch = $versions['WEB_BRANCH'];
    if ($web_branch !== 'master') {
        $web_current = 'vDev';
        $web_commit = $versions['WEB_VERSION'];
    } else {
        $web_current = explode('-', $versions['WEB_VERSION'])[0];
    }

    // Get Pi-hole FTL (not a git repository)
    $FTL_branch = $versions['FTL_BRANCH'];
    if (substr($versions['FTL_VERSION'], 0, 4) === 'vDev') {
        $FTL_current = 'vDev';
        $FTL_commit = $versions['FTL_VERSION'];
    } else {
        $FTL_current = $versions['FTL_VERSION'];
    }

    // Get Pi-hole Docker Tag, if available
    $docker_current = htmlspecialchars(getenv('PIHOLE_DOCKER_TAG'));

    // Get data from GitHub
    $core_latest = $versions['GITHUB_CORE_VERSION'];
    $web_latest = $versions['GITHUB_WEB_VERSION'];
    $FTL_latest = $versions['GITHUB_FTL_VERSION'];
    $docker_latest = $versions['GITHUB_DOCKER_VERSION'];

    // Version comparison
    if (!$docker_current) {
        // Not a docker container
        $core_update = checkUpdate($core_current, $core_latest);
        $web_update = checkUpdate($web_current, $web_latest);
        $FTL_update = checkUpdate($FTL_current, $FTL_latest);
    } elseif ($docker_current == 'nightly' || $docker_current == 'dev') {
        // Special container - no update messages
        $docker_update = false;
    } else {
        $docker_update = checkUpdate($docker_current, $docker_latest);
    }
}

// URLs for the links
$coreUrl = 'https://github.com/pi-hole/pi-hole';
$dockerUrl = 'https://github.com/pi-hole/docker-pi-hole';
$ftlUrl = 'https://github.com/pi-hole/FTL';
$webUrl = 'https://github.com/pi-hole/AdminLTE';
$coreReleasesUrl = $coreUrl.'/releases';
$webReleasesUrl = $webUrl.'/releases';
$ftlReleasesUrl = $ftlUrl.'/releases';
$dockerReleasesUrl = $dockerUrl.'/releases';

// Version strings
$coreVersionStr = $core_current.(isset($core_commit) ? ' ('.$core_branch.', '.$core_commit.')' : '');
$webVersionStr = $web_current.(isset($web_commit) ? ' ('.$web_branch.', '.$web_commit.')' : '');
$ftlVersionStr = $FTL_current.(isset($FTL_commit) ? ' ('.$FTL_branch.', '.$FTL_commit.')' : '');
