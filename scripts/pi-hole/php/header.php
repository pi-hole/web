<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

    require "scripts/pi-hole/php/auth.php";
    require "scripts/pi-hole/php/password.php";
    require_once "scripts/pi-hole/php/FTL.php";
    require_once "scripts/pi-hole/php/func.php";
    require "scripts/pi-hole/php/theme.php";
    $scriptname = basename($_SERVER['SCRIPT_FILENAME']);
    $hostname = gethostname() ? gethostname() : "";

    check_cors();

    // Create cache busting version
    $cacheVer = filemtime(__FILE__);

    // Generate CSRF token
    if(empty($_SESSION['token'])) {
        $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
    }
    $token = $_SESSION['token'];

    // Try to get temperature value from different places (OS dependent)
    if(file_exists("/sys/class/thermal/thermal_zone0/temp"))
    {
        $output = rtrim(file_get_contents("/sys/class/thermal/thermal_zone0/temp"));
    }
    elseif (file_exists("/sys/class/hwmon/hwmon0/temp1_input"))
    {
        $output = rtrim(file_get_contents("/sys/class/hwmon/hwmon0/temp1_input"));
    }
    else
    {
        $output = "";
    }

    // Test if we succeeded in getting the temperature
    if(is_numeric($output))
    {
        // $output could be either 4-5 digits or 2-3, and we only divide by 1000 if it's 4-5
        // ex. 39007 vs 39
        $celsius = intval($output);

        // If celsius is greater than 1 degree and is in the 4-5 digit format
        if($celsius > 1000) {
            // Use multiplication to get around the division-by-zero error
            $celsius *= 1e-3;
        }

        // Get user-defined temperature limit if set
        if(isset($setupVars['TEMPERATURE_LIMIT']))
        {
            $temperaturelimit = intval($setupVars['TEMPERATURE_LIMIT']);
        }
        else
        {
            $temperaturelimit = 60;
        }
    }
    else
    {
        // Nothing can be colder than -273.15 degree Celsius (= 0 Kelvin)
        // This is the minimum temperature possible (AKA absolute zero)
        $celsius = -273.16;
        // Set templimit to null if no tempsensor was found
        $temperaturelimit = null;
    }

    // Get load
    $loaddata = sys_getloadavg();
    foreach ($loaddata as $key => $value) {
        $loaddata[$key] = round($value, 2);
    }
    // Get number of processing units available to PHP
    // (may be less than the number of online processors)
    $nproc = shell_exec('nproc');
    if(!is_numeric($nproc))
    {
        $cpuinfo = file_get_contents('/proc/cpuinfo');
        preg_match_all('/^processor/m', $cpuinfo, $matches);
        $nproc = count($matches[0]);
    }

    // Get memory usage
    $data = explode("\n", file_get_contents("/proc/meminfo"));
    $meminfo = array();
    if(count($data) > 0)
    {
        foreach ($data as $line) {
            $expl = explode(":", trim($line));
            if(count($expl) == 2)
            {
                // remove " kB" from the end of the string and make it an integer
                $meminfo[$expl[0]] = intval(substr($expl[1],0, -3));
            }
        }
        $memory_used = $meminfo["MemTotal"]-$meminfo["MemFree"]-$meminfo["Buffers"]-$meminfo["Cached"];
        $memory_total = $meminfo["MemTotal"];
        $memory_usage = $memory_used/$memory_total;
    }
    else
    {
        $memory_usage = -1;
    }

    if($auth) {
        // For session timer
        $maxlifetime = ini_get("session.gc_maxlifetime");

        // Generate CSRF token
        if(empty($_SESSION['token'])) {
            $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
        }
        $token = $_SESSION['token'];
    }

    if(isset($setupVars['WEBUIBOXEDLAYOUT']))
    {
        if($setupVars['WEBUIBOXEDLAYOUT'] === "boxed")
        {
            $boxedlayout = true;
        }
        else
        {
            $boxedlayout = false;
        }
    }
    else
    {
        $boxedlayout = true;
    }

    // Override layout setting if layout is changed via Settings page
    if(isset($_POST["field"]))
    {
        if($_POST["field"] === "webUI" && isset($_POST["boxedlayout"]))
        {
            $boxedlayout = true;
        }
        elseif($_POST["field"] === "webUI" && !isset($_POST["boxedlayout"]))
        {
            $boxedlayout = false;
        }
    }

    function pidofFTL()
    {
        return shell_exec("pidof pihole-FTL");
    }
    $FTLpid = intval(pidofFTL());
    $FTL = ($FTLpid !== 0 ? true : false);

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
    <title>Pi-hole<?php echo $hostname ? " - " . $hostname : "" ?></title>

    <link rel="apple-touch-icon" href="img/favicons/apple-touch-icon.png" sizes="180x180">
    <link rel="icon" href="img/favicons/favicon-32x32.png" sizes="32x32" type="image/png">
    <link rel="icon" href="img/favicons/favicon-16x16.png" sizes="16x16" type="image/png">
    <link rel="manifest" href="img/favicons/manifest.json">
    <link rel="mask-icon" href="img/favicons/safari-pinned-tab.svg" color="#367fa9">
    <link rel="shortcut icon" href="img/favicons/favicon.ico">
    <meta name="msapplication-TileColor" content="#367fa9">
    <meta name="msapplication-TileImage" content="img/favicons/mstile-150x150.png">
<?php if ($theme == "default-light") { ?>
    <meta name="theme-color" content="#367fa9">
<?php } elseif ($theme == "default-dark") { ?>
    <meta name="theme-color" content="#272c30">
<?php } elseif ($theme == "default-darker") { ?>
    <meta name="theme-color" content="#2e6786">
<?php } elseif ($theme == "lcars") { ?>
    <meta name="theme-color" content="#4488FF">
    <link rel="stylesheet" href="style/vendor/fonts/ubuntu-mono/ubuntu-mono.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/fonts/antonio/antonio.css?v=<?=$cacheVer?>">
<?php } ?>

<?php if ($darkmode) { ?>
    <style>
        html { background-color: #000; }
    </style>
<?php } ?>
    <link rel="stylesheet" href="style/vendor/SourceSansPro/SourceSansPro.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/bootstrap/css/bootstrap.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/datatables.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/datatables_extensions.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/daterangepicker.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/AdminLTE.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/select2.min.css?v=<?=$cacheVer?>">

<?php if (in_array($scriptname, array("groups.php", "groups-adlists.php", "groups-clients.php", "groups-domains.php"))){ ?>
    <link rel="stylesheet" href="style/vendor/animate.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-select.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/bootstrap-toggle.min.css?v=<?=$cacheVer?>">
<?php } ?>
    <link rel="stylesheet" href="style/pi-hole.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/themes/<?php echo $theme; ?>.css?v=<?=$cacheVer?>">
    <noscript><link rel="stylesheet" href="style/vendor/js-warn.css?v=<?=$cacheVer?>"></noscript>

    <script src="scripts/vendor/jquery.min.js?v=<?=$cacheVer?>"></script>
    <script src="style/vendor/bootstrap/js/bootstrap.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/adminlte.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/bootstrap-notify.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/select2.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/datatables.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/datatables.select.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/datatables.buttons.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/moment.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/Chart.min.js?v=<?=$cacheVer?>"></script>
    <script src="style/vendor/font-awesome/js/all.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/pi-hole/js/utils.js?v=<?=$cacheVer?>"></script>
</head>
<body class="hold-transition sidebar-mini<?php if($boxedlayout){ ?> layout-boxed<?php } ?><?php if($auth){ ?> logged-in<?php } ?>">
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
if($auth) {
    echo "<div id=\"token\" hidden>$token</div>";
}
?>

<!-- Send token to JS -->
<div id="enableTimer" hidden><?php if(file_exists("../custom_disable_timer")){ echo file_get_contents("../custom_disable_timer"); } ?></div>
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
                    <li<?php echo !$hostname ? ' class="hidden"' : "" ?>>
                        <p class="navbar-text">
                            <span class="hidden-xs hidden-sm">hostname:</span>
                            <code><?php echo $hostname; ?></code>
                        </p>
                    </li>
                    <li class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            <img src="img/logo.svg" class="user-image" alt="Pi-hole logo" style="border-radius: 0" width="25" height="25">
                            <span class="hidden-xs">Pi-hole</span>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img src="img/logo.svg" alt="Pi-hole Logo" style="border: 0" width="90" height="90">
                                <p>
                                    Open Source Ad Blocker
                                    <small>Designed For Raspberry Pi</small>
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body">
                                <div class="row">
                                    <div class="col-xs-4 text-center">
                                        <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank">GitHub</a>
                                    </div>
                                    <div class="col-xs-4 text-center">
                                        <a class="btn-link" href="https://pi-hole.net/" rel="noopener" target="_blank">Website</a>
                                    </div>
                                    <div class="col-xs-4 text-center">
                                        <a class="btn-link" href="https://github.com/pi-hole/pi-hole/releases" rel="noopener" target="_blank">Updates</a>
                                    </div>
                                    <div id="sessiontimer" class="col-xs-12 text-center">
                                        <strong>Session is valid for <span id="sessiontimercounter"><?php if($auth && strlen($pwhash) > 0){echo $maxlifetime;}else{echo "0";} ?></span></strong>
                                    </div>
                                </div>
                            </li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <!-- Donate Button -->
                                <div class="text-center">
                                    <a class="btn btn-primary btn-lg donate" href="https://pi-hole.net/donate/" rel="noopener" target="_blank">
                                        <i class="fas fa-fw menu-icon fa-donate"></i> Donate
                                    </a>
                                </div>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="main-sidebar">
        <!-- sidebar: style can be found in sidebar.less -->
        <section class="sidebar">
            <!-- Sidebar user panel -->
            <div class="user-panel">
                <div class="pull-left image">
                    <img src="img/logo.svg" alt="Pi-hole logo">
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <?php
                    $pistatus = piholeStatus();
                    if ($pistatus == 53) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-green-light"></i> Active</span>';
                    } elseif ($pistatus == 0) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> Blocking disabled</span>';
                    } elseif ($pistatus == -1) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> DNS service not running</span>';
                    } elseif ($pistatus == -2) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> Unknown</span>';
                    } else {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-orange"></i> DNS service on port '.$pistatus.'</span>';
                    }
                    ?>
                    <br/>
                    <?php
                    echo '<span title="Detected '.$nproc.' cores"><i class="fa fa-w fa-circle ';
                    if ($loaddata[0] > $nproc) {
                        echo "text-red";
                    } else {
                        echo "text-green-light";
                    }
                    echo '"></i> Load:&nbsp;&nbsp;' . $loaddata[0] . "&nbsp;&nbsp;" . $loaddata[1] . "&nbsp;&nbsp;". $loaddata[2] . "</span>";
                    ?>
                    <br/>
                    <?php
                    echo '<span><i class="fa fa-w fa-circle ';
                    if ($memory_usage > 0.75 || $memory_usage < 0.0) {
                        echo "text-red";
                    } else {
                        echo "text-green-light";
                    }
                    if($memory_usage > 0.0) {
                        echo '"></i> Memory usage:&nbsp;&nbsp;' . sprintf("%.1f",100.0*$memory_usage) . "&thinsp;%</span>";
                    } else {
                        echo '"></i> Memory usage:&nbsp;&nbsp; N/A</span>';
                    }
                    ?>
                    <br/>
                    <?php
                      if ($celsius >= -273.15) {
                        // Only show temp info if any data is available -->
                        $tempcolor = "text-vivid-blue";
                        if (isset($temperaturelimit) && $celsius > $temperaturelimit) {
                          $tempcolor = "text-red";
                        }
                        echo '<span id="temperature"><i class="fa fa-w fa-fire '.$tempcolor.'" style="width: 1em !important"></i> ';
                        echo 'Temp:&nbsp;<span id="rawtemp" hidden>' .$celsius. '</span>';
                        echo '<span id="tempdisplay"></span></span>';
                      }
                    ?>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <?php
            if($scriptname === "groups-domains.php" && isset($_GET['type']))
            {
                if($_GET["type"] === "white")
                {
                    $scriptname = "whitelist";
                }
                elseif($_GET["type"] === "black")
                {
                    $scriptname = "blacklist";
                }
            }
            if(!$auth && (!isset($indexpage) || isset($_GET['login'])))
            {
                $scriptname = "login";
            }
            ?>
            <ul class="sidebar-menu" data-widget="tree">
                <li class="header text-uppercase">Main navigation</li>
                <!-- Home Page -->
                <li<?php if($scriptname === "index.php"){ ?> class="active"<?php } ?>>
                    <a href="index.php">
                        <i class="fa fa-fw menu-icon fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>
                <?php if($auth){ ?>
                <!-- Query Log -->
                <li<?php if($scriptname === "queries.php"){ ?> class="active"<?php } ?>>
                    <a href="queries.php">
                        <i class="fa fa-fw menu-icon fa-file-alt"></i> <span>Query Log</span>
                    </a>
                </li>
                <li class="treeview<?php if($scriptname === "db_queries.php" || $scriptname === "db_lists.php" || $scriptname === "db_graph.php"){ ?> active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw menu-icon fa-history"></i> <span>Long-term data</span>
                    <span class="pull-right-container">
                      <i class="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul class="treeview-menu">
                    <li<?php if($scriptname === "db_graph.php"){ ?> class="active"<?php } ?>>
                        <a href="db_graph.php">
                            <i class="fa fa-fw menu-icon fa-chart-bar"></i> Graphics
                        </a>
                    </li>
                    <li<?php if($scriptname === "db_queries.php"){ ?> class="active"<?php } ?>>
                        <a href="db_queries.php">
                            <i class="fa fa-fw menu-icon fa-file-alt"></i> Query Log
                        </a>
                    </li>
                    <li<?php if($scriptname === "db_lists.php"){ ?> class="active"<?php } ?>>
                        <a href="db_lists.php">
                            <i class="fa fa-fw menu-icon fa-list"></i> Top Lists
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Whitelist -->
                <li<?php if($scriptname === "whitelist"){ ?> class="active"<?php } ?>>
                    <a href="groups-domains.php?type=white">
                        <i class="fa fa-fw menu-icon fa-check-circle"></i> <span>Whitelist</span>
                    </a>
                </li>
                <!-- Blacklist -->
                <li<?php if($scriptname === "blacklist"){ ?> class="active"<?php } ?>>
                    <a href="groups-domains.php?type=black">
                        <i class="fa fa-fw menu-icon fa-ban"></i> <span>Blacklist</span>
                    </a>
                </li>
                <!-- Group Management -->
                <li class="treeview<?php if (in_array($scriptname, array("groups.php", "groups-adlists.php", "groups-clients.php", "groups-domains.php"))){ ?> active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw menu-icon fa-users-cog"></i> <span>Group Management</span>
                    <span class="pull-right-container">
                      <i class="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul class="treeview-menu">
                    <li<?php if($scriptname === "groups.php"){ ?> class="active"<?php } ?>>
                        <a href="groups.php">
                            <i class="fa fa-fw menu-icon fa-user-friends"></i> Groups
                        </a>
                    </li>
                    <li<?php if($scriptname === "groups-clients.php"){ ?> class="active"<?php } ?>>
                        <a href="groups-clients.php">
                            <i class="fa fa-fw menu-icon fa-laptop"></i> Clients
                        </a>
                    </li>
                    <li<?php if($scriptname === "groups-domains.php"){ ?> class="active"<?php } ?>>
                        <a href="groups-domains.php">
                            <i class="fa fa-fw menu-icon fa-list"></i> Domains
                        </a>
                    </li>
                    <li<?php if($scriptname === "groups-adlists.php"){ ?> class="active"<?php } ?>>
                        <a href="groups-adlists.php">
                            <i class="fa fa-fw menu-icon fa-shield-alt"></i> Adlists
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Toggle -->
                <li id="pihole-disable" class="treeview"<?php if ($pistatus == "0") { ?> hidden<?php } ?>>
                  <a href="#">
                    <i class="fa fa-fw menu-icon fa-stop"></i> <span>Disable&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span></span>
                    <span class="pull-right-container">
                      <i class="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul class="treeview-menu">
                    <li>
                        <a href="#" id="pihole-disable-indefinitely">
                            <i class="fa fa-fw menu-icon fa-infinity"></i> Indefinitely
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-10s">
                            <i class="fa fa-fw menu-icon fa-clock"></i> For 10 seconds
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-30s">
                            <i class="fa fa-fw menu-icon fa-clock"></i> For 30 seconds
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-5m">
                            <i class="fa fa-fw menu-icon fas fa-clock"></i> For 5 minutes
                        </a>
                    </li>
                    <li>
                      <a href="#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal">
                            <i class="fa fa-fw menu-icon fa-user-clock"></i> Custom time
                      </a>
                    </li>
                  </ul>
                    <!-- <a href="#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="treeview"<?php if (!in_array($pistatus,["0","-1","-2"])) { ?> hidden<?php } ?>>
                    <a href="#">
                      <i class="fa fa-fw menu-icon fa-play"></i>
                      <span id="enableLabel">Enable&nbsp;&nbsp;&nbsp;
                        <span id="flip-status-enable"></span>
                      </span>
                    </a>
                </li>
                <!-- Tools -->
                <li class="treeview<?php if (in_array($scriptname, array("messages.php", "gravity.php", "queryads.php", "auditlog.php", "taillog.php", "taillog-FTL.php", "debug.php", "network.php"))){ ?> active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                    <span class="warning-count hidden"></span>
                    <span class="pull-right-container">
                      <i class="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul class="treeview-menu">
                    <!-- Pi-hole diagnosis -->
                    <li<?php if($scriptname === "messages.php"){ ?> class="active"<?php } ?>>
                        <a href="messages.php">
                            <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> Pi-hole diagnosis
                            <span class="pull-right-container warning-count hidden"></span>
                        </a>
                    </li>
                    <!-- Run gravity.sh -->
                    <li<?php if($scriptname === "gravity.php"){ ?> class="active"<?php } ?>>
                        <a href="gravity.php">
                            <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> Update Gravity
                        </a>
                    </li>
                    <!-- Query Lists -->
                    <li<?php if($scriptname === "queryads.php"){ ?> class="active"<?php } ?>>
                        <a href="queryads.php">
                            <i class="fa fa-fw menu-icon fa-search"></i> Search Adlists
                        </a>
                    </li>
                    <!-- Audit log -->
                    <li<?php if($scriptname === "auditlog.php"){ ?> class="active"<?php } ?>>
                        <a href="auditlog.php">
                            <i class="fa fa-fw menu-icon fa-balance-scale"></i> Audit log
                        </a>
                    </li>
                    <!-- Tail pihole.log -->
                    <li<?php if($scriptname === "taillog.php"){ ?> class="active"<?php } ?>>
                        <a href="taillog.php">
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="xMidYMid meet" height="14" viewBox="0 0 200 200" class="svg-inline--fa custom-menu-icon fa-w-20 fa-fw menu-icon">
                                <g>
                                    <linearGradient id="svg_1_1_" gradientUnits="userSpaceOnUse" x1="-317.0903" y1="393.5137" x2="-316.0898" y2="393.5137" gradientTransform="matrix(94.8803 0 0 -56.7359 30129.9492 22362.8691)">
                                        <stop offset="0.051" style="stop-color:currentColor;stop-opacity:0.6"/>
                                        <stop offset="0.95" style="stop-color:currentColor"/>
                                    </linearGradient>
                                    <path id="svg_1" fill="url(#svg_1_1_)" d="M89.247,64.579C66.298,62.131,43.179,44.785,41.354,8.083 c35.612,0,54.656,21.082,56.496,54.486c6.734-40.069,38.301-35.372,38.301-35.372c1.499,22.708-17.148,36.475-38.301,37.621 c-5.942-12.521-41.541-43.238-41.541-43.238c-0.042-0.036-0.104-0.03-0.14,0.011c-0.024,0.028-0.03,0.067-0.016,0.102 C56.153,21.694,90.506,51.619,89.247,64.579"/>
                                    <path id="svg_2" opacity="0.6" fill="currentColor" d="M100,191.916c-2.221-0.127-22.949-0.92-24.208-24.208 c-1.019-14.148,10.159-24.576,10.159-38.314c-2.533-34.253-48.431-30.009-48.431,0c-0.019,7.5,2.949,14.699,8.249,20.007 l34.197,34.211c5.307,5.299,12.506,8.268,20.006,8.248"/>
                                    <path id="svg_3" fill="currentColor" d="M162.48,129.408c-0.127,2.221-0.92,22.949-24.209,24.208 c-14.148,1.019-24.59-10.159-38.314-10.159c-34.254,2.533-30.009,48.417,0,48.417c7.5,0.019,14.699-2.949,20.006-8.249 l34.226-34.197c5.299-5.307,8.268-12.506,8.248-20.006"/>
                                    <path id="svg_4" opacity="0.6" fill="currentColor" d="M100,66.928c2.221,0.127,22.949,0.919,24.209,24.208 c1.018,14.149-10.159,24.576-10.159,38.314c2.532,34.254,48.417,30.009,48.417,0c0.019-7.5-2.949-14.698-8.25-20.006 l-34.211-34.226c-5.307-5.3-12.506-8.268-20.006-8.249"/>
                                    <path id="svg_5" fill="currentColor" d="M37.633,129.408c0.127-2.222,0.92-22.949,24.208-24.209 c14.148-1.019,24.59,10.159,38.314,10.159c34.254-2.575,30.009-48.417,0-48.417c-7.5-0.019-14.699,2.949-20.006,8.249 l-34.226,34.212c-5.299,5.307-8.268,12.506-8.249,20.006"/>
                                </g>
                            </svg>
                            Tail pihole.log
                        </a>
                    </li>
                    <!-- Tail FTL.log -->
                    <li<?php if($scriptname === "taillog-FTL.php"){ ?> class="active"<?php } ?>>
                        <a href="taillog-FTL.php">
                            <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="xMidYMid meet" height="14" viewBox="0 0 400 340" class="svg-inline--fa custom-menu-icon fa-w-20 fa-fw menu-icon">
                                <g fill="currentColor">
                                    <path opacity=".6" d="M42.315 11h111.078l-7.381 31.378H34.898L42.315 11z"/>
                                    <path d="M237.368 42.207q-13.098 62.242-26.23 124.486h-37.354q13.135-62.244 26.23-124.486h-39.652l7.381-31.174h132.055l-7.639 31.174h-54.791zm87.03 94.016L351.124 11h-37.18q-16.584 77.846-33.199 155.693h103.356v-30.47h-59.703zM32.428 67.509l-22.316 99.184h31.807l16.068-67.908h59.41l7.381-31.326-92.35.05z"/>
                                    <path opacity=".6" d="M10 186.2a283.868 283.868 0 0 1 42.976-2.992c26.697 0 44.014 4.806 57.58 15.023 14.604 10.853 23.782 28.17 23.782 52.991 0 26.914-9.798 45.487-23.364 56.96-14.806 12.31-37.348 18.154-64.882 18.154A276.442 276.442 0 0 1 10 324.29V186.2zm31.922 114.726a57.564 57.564 0 0 0 11.054.636c28.79.201 47.564-15.659 47.564-49.24.217-29.208-16.899-44.65-44.231-44.65a66.665 66.665 0 0 0-14.387 1.241v92.013zm113.283 24.015V184.325h37.209l29.146 51.595a408.098 408.098 0 0 1 22.945 48.06h.62a523.847 523.847 0 0 1-2.697-58.618v-41.037h29.208V324.94h-33.394l-30.046-54.262a523.459 523.459 0 0 1-24.402-49.611l-.62.201c.821 18.605 1.24 38.402 1.24 61.348v42.355l-29.209-.03zm145.004-32.759a81.099 81.099 0 0 0 35.27 8.76c14.605 0 22.326-6.047 22.326-15.225 0-8.76-6.682-13.767-23.581-19.829-23.364-8.123-38.604-21.069-38.604-41.518 0-23.984 20.03-42.355 53.208-42.355a86.246 86.246 0 0 1 35.89 7.1l-7.1 25.658a66.804 66.804 0 0 0-29.456-6.666c-13.783 0-20.45 6.201-20.45 13.55 0 8.976 7.923 12.945 26.077 19.829 24.806 9.178 36.511 22.108 36.511 41.937 0 23.58-18.155 43.611-56.743 43.611-16.077 0-31.921-4.186-39.86-8.558l6.512-26.294z"/>
                                </g>
                            </svg>
                            Tail FTL.log
                        </a>
                    </li>
                    <!-- Generate debug log -->
                    <li<?php if($scriptname === "debug.php"){ ?> class="active"<?php } ?>>
                        <a href="debug.php">
                            <i class="fa fa-fw menu-icon fa-ambulance"></i> Generate debug log
                        </a>
                    </li>
                    <!-- Network -->
                    <li<?php if($scriptname === "network.php"){ ?> class="active"<?php } ?>>
                        <a href="network.php">
                            <i class="fa fa-fw menu-icon fa-network-wired"></i> Network
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Settings -->
                <li<?php if($scriptname === "settings.php"){ ?> class="active"<?php } ?>>
                    <a href="settings.php">
                        <i class="fa fa-fw menu-icon fa-cog"></i> <span>Settings</span>
                    </a>
                </li>
                <!-- Local DNS Records -->
                <li class="treeview <?php if(in_array($scriptname, array("dns_records.php", "cname_records.php"))){ ?>active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw menu-icon fa-address-book"></i> <span>Local DNS</span>
                    <span class="pull-right-container">
                      <i class="fa fa-angle-left pull-right"></i>
                    </span>
                  </a>
                  <ul class="treeview-menu">
                    <li<?php if($scriptname === "dns_records.php"){ ?> class="active"<?php } ?>>
                        <a href="dns_records.php">
                            <i class="fa fa-fw menu-icon fa-address-book"></i> DNS Records
                        </a>
                    </li>
                    <li<?php if($scriptname === "cname_records.php"){ ?> class="active"<?php } ?>>
                        <a href="cname_records.php">
                            <i class="fa fa-fw menu-icon fa-address-book"></i> CNAME Records
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Logout -->
                <?php
                // Show Logout button if $auth is set and authorization is required
                if(strlen($pwhash) > 0) { ?>
                <li>
                    <a href="?logout">
                        <i class="fa fa-fw menu-icon fa-sign-out-alt"></i> <span>Logout</span>
                    </a>
                </li>
                <?php } ?>
                <?php } ?>
                <!-- Login -->
                <?php
                // Show Login button if $auth is *not* set and authorization is required
                if(strlen($pwhash) > 0 && !$auth) { ?>
                <li<?php if($scriptname === "login"){ ?> class="active"<?php } ?>>
                    <a href="index.php?login">
                        <i class="fa fa-fw menu-icon fa-user"></i> <span>Login</span>
                    </a>
                </li>
                <?php } ?>
                <!-- Donate -->
                <li>
                    <a href="https://pi-hole.net/donate/" rel="noopener" target="_blank">
                        <i class="fas fa-fw menu-icon fa-donate"></i> <span>Donate</span>
                    </a>
                </li>
                 <!-- Docs -->
                 <li>
                    <a href="https://docs.pi-hole.net/" rel="noopener" target="_blank">
                        <i class="fa fa-fw menu-icon fa-question-circle"></i> <span>Documentation</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
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
    if(!$auth && (!isset($indexpage) || isset($_GET['login']))){
        require "scripts/pi-hole/php/loginpage.php";
        require "footer.php";
        exit();
    }
?>
