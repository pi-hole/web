<?php
/*
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/password.php';
if (!$auth) {
    $_SESSION['prev_url'] = $_SERVER['REQUEST_URI'];
    header('Location: login.php');
    exit;
}

require 'scripts/pi-hole/php/auth.php';
require_once 'scripts/pi-hole/php/FTL.php';
require_once 'scripts/pi-hole/php/func.php';
require 'scripts/pi-hole/php/theme.php';

// Retrieve layout setting from setupVars
if (isset($setupVars['WEBUIBOXEDLAYOUT']) && !$setupVars['WEBUIBOXEDLAYOUT'] === 'boxed') {
    $boxedlayout = false;
} else {
    $boxedlayout = true;
}

// Override layout setting if layout is changed via Settings page
if (isset($_POST['field'])) {
    if ($_POST['field'] === 'webUI' && isset($_POST['boxedlayout'])) {
        $boxedlayout = true;
    } elseif ($_POST['field'] === 'webUI' && !isset($_POST['boxedlayout'])) {
        $boxedlayout = false;
    }
}

// Return memory usage to show on status block
function getMemUsage()
{
    $data = explode("\n", file_get_contents('/proc/meminfo'));
    $meminfo = array();
    if (count($data) > 0) {
        foreach ($data as $line) {
            $expl = explode(':', $line);
            if (count($expl) == 2) {
                // remove " kB" from the end of the string and make it an integer
                $meminfo[$expl[0]] = intval(trim(substr($expl[1], 0, -3)));
            }
        }
        $memused = $meminfo['MemTotal'] - $meminfo['MemFree'] - $meminfo['Buffers'] - $meminfo['Cached'];
        $memusage = $memused / $meminfo['MemTotal'];
    } else {
        $memusage = -1;
    }

    return $memusage;
}

// Try to get temperature value from different places (OS dependent)
// - return an array, containing the temperature and limit.
function getTemperature()
{
    global $setupVars;

    if (file_exists('/sys/class/thermal/thermal_zone0/temp')) {
        $output = rtrim(file_get_contents('/sys/class/thermal/thermal_zone0/temp'));
    } elseif (file_exists('/sys/class/hwmon/hwmon0/temp1_input')) {
        $output = rtrim(file_get_contents('/sys/class/hwmon/hwmon0/temp1_input'));
    } else {
        $output = '';
    }

    // Test if we succeeded in getting the temperature
    if (is_numeric($output)) {
        // $output could be either 4-5 digits or 2-3, and we only divide by 1000 if it's 4-5
        // ex. 39007 vs 39
        $celsius = intval($output);

        // If celsius is greater than 1 degree and is in the 4-5 digit format
        if ($celsius > 1000) {
            // Use multiplication to get around the division-by-zero error
            $celsius *= 1e-3;
        }

        // Get user-defined temperature limit if set
        if (isset($setupVars['TEMPERATURE_LIMIT'])) {
            $limit = intval($setupVars['TEMPERATURE_LIMIT']);
        } else {
            $limit = 60;
        }
    } else {
        // Nothing can be colder than -273.15 degree Celsius (= 0 Kelvin)
        // This is the minimum temperature possible (AKA absolute zero)
        $celsius = -273.16;
        // Set templimit to null if no tempsensor was found
        $limit = null;
    }

    return array($celsius, $limit);
}

check_cors();

// Generate CSRF token
if (empty($_SESSION['token'])) {
    $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
}
$token = $_SESSION['token'];

// For session timer
$maxlifetime = ini_get('session.gc_maxlifetime');

// Get temperature
list($celsius, $temperaturelimit) = getTemperature();

// Get CPU load
$loaddata = sys_getloadavg();
foreach ($loaddata as $key => $value) {
    $loaddata[$key] = round($value, 2);
}

// Get number of processing units available to PHP
// (may be less than the number of online processors)
$nproc = shell_exec('nproc');
if (!is_numeric($nproc)) {
    $cpuinfo = file_get_contents('/proc/cpuinfo');
    preg_match_all('/^processor/m', $cpuinfo, $matches);
    $nproc = count($matches[0]);
}

// Get memory usage
$memory_usage = getMemUsage();

$piholeFTLConf = piholeFTLConfig();

require 'header.php';
?>
<body class="hold-transition sidebar-mini<?php if ($boxedlayout) { ?> layout-boxed<?php } ?><?php if ($auth) { ?> logged-in<?php } ?>">
<noscript>
    <!-- JS Warning -->
    <div>
        <input type="checkbox" id="js-hide">
        <div class="js-warn" id="js-warn-exit"><h1>JavaScript Is Disabled</h1><p>JavaScript is required for the site to function.</p>
            <p>To learn how to enable JavaScript click <a href="https://www.enable-javascript.com/" rel="noopener" target="_blank">here</a></p><label for="js-hide">Close</label>
        </div>
    </div>
    <!-- /JS Warning -->
</noscript>
<?php
if ($auth) {
    echo "<div id=\"token\" hidden>{$token}</div>";
}
?>

<!-- Send token to JS -->
<div id="enableTimer" hidden><?php if (file_exists('../custom_disable_timer')) {
    echo file_get_contents('../custom_disable_timer');
} ?></div>
<div class="wrapper">
    <header class="main-header">
        <!-- Logo -->
        <a href="index.php" class="logo">
            <!-- mini logo for sidebar mini 50x50 pixels -->
            <span class="logo-mini">P<strong>h</strong></span>
            <!-- logo for regular state and mobile devices -->
            <span class="logo-lg">Pi-<strong>hole</strong></span>
        </a>
        <!-- Header Navbar: style can be found in header.less -->
        <nav class="navbar navbar-static-top">
            <!-- Sidebar toggle button-->
            <a href="#" class="sidebar-toggle-svg" data-toggle="push-menu" role="button">
                <i aria-hidden="true" class="fa fa-angle-double-left"></i>
                <span class="sr-only">Toggle navigation</span>
                <span class="warning-count hidden" id="top-warning-count"></span>
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <li<?php echo !$hostname ? ' class="hidden"' : ''; ?>>
                        <p class="navbar-text">
                            <span class="hidden-xs">hostname:</span>
                            <code><?php echo $hostname; ?></code>
                        </p>
                    </li>
                    <li class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            <i class="fa fa-bars"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img src="img/logo.svg" alt="Pi-hole Logo" style="border: 0" width="90" height="90">
                                <p>
                                    Open Source Ad Blocker
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <!-- <li class="user-body"></li> -->
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <a class="btn-link" href="https://pi-hole.net/" rel="noopener" target="_blank">
                                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="xMidYMid meet" height="14" viewBox="0 0 200 200" class="svg-inline--fa custom-menu-icon fa-w-20 fa-fw menu-icon">
                                            <g>
                                                <linearGradient id="svg_1_1_" gradientUnits="userSpaceOnUse" x1="-317.0903" y1="393.5137" x2="-316.0898" y2="393.5137" gradientTransform="matrix(94.8803 0 0 -56.7359 30129.9492 22362.8691)">
                                                    <stop offset="0.051" style="stop-color:currentColor;stop-opacity:0.6"></stop>
                                                    <stop offset="0.95" style="stop-color:currentColor"></stop>
                                                </linearGradient>
                                                <path id="svg_1" fill="url(#svg_1_1_)" d="M89.247,64.579C66.298,62.131,43.179,44.785,41.354,8.083 c35.612,0,54.656,21.082,56.496,54.486c6.734-40.069,38.301-35.372,38.301-35.372c1.499,22.708-17.148,36.475-38.301,37.621 c-5.942-12.521-41.541-43.238-41.541-43.238c-0.042-0.036-0.104-0.03-0.14,0.011c-0.024,0.028-0.03,0.067-0.016,0.102 C56.153,21.694,90.506,51.619,89.247,64.579"></path>
                                                <path id="svg_2" opacity="0.6" fill="currentColor" d="M100,191.916c-2.221-0.127-22.949-0.92-24.208-24.208 c-1.019-14.148,10.159-24.576,10.159-38.314c-2.533-34.253-48.431-30.009-48.431,0c-0.019,7.5,2.949,14.699,8.249,20.007 l34.197,34.211c5.307,5.299,12.506,8.268,20.006,8.248"></path>
                                                <path id="svg_3" fill="currentColor" d="M162.48,129.408c-0.127,2.221-0.92,22.949-24.209,24.208 c-14.148,1.019-24.59-10.159-38.314-10.159c-34.254,2.533-30.009,48.417,0,48.417c7.5,0.019,14.699-2.949,20.006-8.249 l34.226-34.197c5.299-5.307,8.268-12.506,8.248-20.006"></path>
                                                <path id="svg_4" opacity="0.6" fill="currentColor" d="M100,66.928c2.221,0.127,22.949,0.919,24.209,24.208 c1.018,14.149-10.159,24.576-10.159,38.314c2.532,34.254,48.417,30.009,48.417,0c0.019-7.5-2.949-14.698-8.25-20.006 l-34.211-34.226c-5.307-5.3-12.506-8.268-20.006-8.249"></path>
                                                <path id="svg_5" fill="currentColor" d="M37.633,129.408c0.127-2.222,0.92-22.949,24.208-24.209 c14.148-1.019,24.59,10.159,38.314,10.159c34.254-2.575,30.009-48.417,0-48.417c-7.5-0.019-14.699,2.949-20.006,8.249 l-34.226,34.212c-5.299,5.307-8.268,12.506-8.249,20.006"></path>
                                            </g>
                                    </svg>
                                    Pi-hole Website
                                </a>
                                <hr>
                                <a class="btn-link" href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fa-question-circle"></i> Documentation</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fab fa-discourse"></i> Pi-hole Forum</a>
                                <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa fa-regular fa-rocket"></i> Pi-hole Releases</a>
                                <hr>
                                <a class="btn-link" href="logout.php" rel="noopener"><i class="fa fa-fw menu-icon fa-sign-out-alt"></i> Log out</a>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
<?php require 'scripts/pi-hole/php/sidebar.php'; ?>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
