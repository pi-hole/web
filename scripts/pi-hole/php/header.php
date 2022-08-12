<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/auth.php';
require 'scripts/pi-hole/php/password.php';
require_once 'scripts/pi-hole/php/FTL.php';
require_once 'scripts/pi-hole/php/func.php';
require 'scripts/pi-hole/php/theme.php';
$scriptname = basename($_SERVER['SCRIPT_FILENAME']);
$hostname = gethostname() ? gethostname() : '';

// Return memory usage to show on status block
function getMemUsage()
{
    $data = explode("\n", file_get_contents('/proc/meminfo'));
    $meminfo = array();
    if (count($data) > 0) {
        foreach ($data as $line) {
            $expl = explode(':', $line);
            if (2 == count($expl)) {
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

// Create cache busting version
$cacheVer = filemtime(__FILE__);

// Generate CSRF token
if (empty($_SESSION['token'])) {
    $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
}
$token = $_SESSION['token'];

if ($auth) {
    // For session timer
    $maxlifetime = ini_get('session.gc_maxlifetime');

    // Generate CSRF token
    if (empty($_SESSION['token'])) {
        $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
    }
    $token = $_SESSION['token'];
}

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

// Retrieve layout setting from setupVars
if (isset($setupVars['WEBUIBOXEDLAYOUT']) && !('boxed' === $setupVars['WEBUIBOXEDLAYOUT'])) {
    $boxedlayout = false;
} else {
    $boxedlayout = true;
}

// Override layout setting if layout is changed via Settings page
if (isset($_POST['field'])) {
    if ('webUI' === $_POST['field'] && isset($_POST['boxedlayout'])) {
        $boxedlayout = true;
    } elseif ('webUI' === $_POST['field'] && !isset($_POST['boxedlayout'])) {
        $boxedlayout = false;
    }
}

$piholeFTLConf = piholeFTLConfig();
?>
<!doctype html>
<!-- Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. -->
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; base-uri 'none'; child-src 'self'; form-action 'self'; frame-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self'; manifest-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'">
    <!-- Usually browsers proactively perform domain name resolution on links that the user may choose to follow. We disable DNS prefetching here -->
    <meta http-equiv="x-dns-prefetch-control" content="off">
    <meta http-equiv="cache-control" content="max-age=60,private">
    <!-- Tell the browser to be responsive to screen width -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pi-hole<?php echo $hostname ? ' - '.$hostname : ''; ?></title>

    <link rel="apple-touch-icon" href="img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="img/favicons/manifest.json">
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="#367fa9">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#367fa9">
    <meta name="msapplication-TileImage" content="img/favicons/mstile-150x150.png">
<?php if ('default-light' == $theme) { ?>
    <meta name="theme-color" content="#367fa9">
<?php } elseif ('default-dark' == $theme) { ?>
    <meta name="theme-color" content="#272c30">
<?php } elseif ('default-darker' == $theme) { ?>
    <meta name="theme-color" content="#2e6786">
<?php } elseif ('lcars' == $theme) { ?>
    <meta name="theme-color" content="#4488FF">
    <link rel="stylesheet" href="style/vendor/fonts/ubuntu-mono/ubuntu-mono.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/fonts/antonio/antonio.css?v=<?php echo $cacheVer; ?>">
<?php } ?>

<?php if ($darkmode) { ?>
    <style>
        html { background-color: #000; }
    </style>
<?php } ?>
    <link rel="stylesheet" href="style/vendor/SourceSansPro/SourceSansPro.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/bootstrap/css/bootstrap.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/datatables.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/datatables_extensions.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/daterangepicker.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/AdminLTE.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/select2.min.css?v=<?php echo $cacheVer; ?>">

<?php if (in_array($scriptname, array('groups.php', 'groups-adlists.php', 'groups-clients.php', 'groups-domains.php'))) { ?>
    <link rel="stylesheet" href="style/vendor/animate.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-select.min.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-toggle.min.css?v=<?php echo $cacheVer; ?>">
<?php } ?>
    <link rel="stylesheet" href="style/pi-hole.css?v=<?php echo $cacheVer; ?>">
    <link rel="stylesheet" href="style/themes/<?php echo $theme; ?>.css?v=<?php echo $cacheVer; ?>">
    <noscript><link rel="stylesheet" href="style/vendor/js-warn.css?v=<?php echo $cacheVer; ?>"></noscript>

    <script src="scripts/vendor/jquery.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="style/vendor/bootstrap/js/bootstrap.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/adminlte.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/bootstrap-notify.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/select2.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.select.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/datatables.buttons.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/moment.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/vendor/Chart.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="style/vendor/font-awesome/js/all.min.js?v=<?php echo $cacheVer; ?>"></script>
    <script src="scripts/pi-hole/js/utils.js?v=<?php echo $cacheVer; ?>"></script>
</head>
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
                <i aria-hidden="true" class="fa fa-bars"></i>
                <span class="sr-only">Toggle navigation</span>
                <span class="warning-count hidden" id="top-warning-count"></span>
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <li<?php echo !$hostname ? ' class="hidden"' : ''; ?>>
                        <p class="navbar-text">
                            <span class="hidden-xs hidden-sm">hostname:</span>
                            <code><?php echo $hostname; ?></code>
                        </p>
                    </li>
                    <!-- Logout -->
                    <?php
                        // Show Logout button if $auth is set and authorization is required
                            if (strlen($pwhash) > 0 && $auth) {
                                ?>
                        <li>
                            <a href="?logout">
                                <i class="fa fa-fw menu-icon fa-sign-out-alt"></i> <span>Logout</span>
                            </a>
                        </li>
                    <?php
                            } ?>
                </ul>
            </div>
        </nav>
    </header>
<?php require 'scripts/pi-hole/php/sidebar.php'; ?>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
<?php
// If password is not equal to the password set
// in the setupVars.conf file, then we skip any
// content and just complete the page. If no
// password is set at all, we keep the current
// behavior: everything is always authorized
// and will be displayed
//
// If auth is required and not set, i.e. no successfully logged in,
// we show the reduced version of the summary (index) page
if (!$auth && (!isset($indexpage) || isset($_GET['login']))) {
    require 'scripts/pi-hole/php/loginpage.php';

    exit;
}
?>
