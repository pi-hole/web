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
if (isset($setupVars['WEBUIBOXEDLAYOUT']) && !($setupVars['WEBUIBOXEDLAYOUT'] === 'boxed')) {
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

    // Get user-defined temperature limit if set
    if (isset($setupVars['TEMPERATUREUNIT'])) {
        switch (strtoupper($setupVars['TEMPERATUREUNIT'])) {
            case 'F':
            case 'K':
                $unit = strtoupper($setupVars['TEMPERATUREUNIT']);
                break;

            default:
                $unit = 'C';
        }
    } else {
        // no value is set in setupVars.conf
        $unit = '';
    }

    return array($celsius, $limit, $unit);
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
list($celsius, $temperaturelimit, $temperatureunit) = getTemperature();

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
<body class="<?php echo $theme; ?> hold-transition sidebar-mini<?php if ($boxedlayout) { ?> layout-boxed<?php } ?><?php if ($auth) { ?> logged-in<?php } ?>">
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
                                <img class="logo-img" src="img/logo.svg" alt="Pi-hole Logo" style="border: 0" width="90" height="90">
                                <p>
                                    Open Source Ad Blocker
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <!-- <li class="user-body"></li> -->
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <a class="btn-link" href="https://pi-hole.net/" rel="noopener" target="_blank">
                                    <svg class="svg-inline--fa fa-fw menu-icon" style="height: 1.25em"><use xlink:href="img/pihole_icon.svg#pihole-svg-logo"/></svg>
                                    Pi-hole Website
                                </a>
                                <hr>
                                <a class="btn-link" href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fa-question-circle"></i> Documentation</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fab fa-discourse"></i> Pi-hole Forum</a>
                                <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa fa-regular fa-rocket"></i> Pi-hole Releases</a>
                                <?php if (strlen($pwhash) > 0) {  // Show "Logout" link only when the user has the password protection enabled.?>
                                <hr>
                                <a class="btn-link" href="logout.php" rel="noopener"><i class="fa fa-fw menu-icon fa-sign-out-alt"></i> Log out</a>
                                <?php } ?>
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
