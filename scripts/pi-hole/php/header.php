<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

    require "scripts/pi-hole/php/auth.php";
    require "scripts/pi-hole/php/password.php";

    check_cors();

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
        $celsius = intVal($output);

        // If celsius is greater than 1 degree and is in the 4-5 digit format
        if($celsius > 1000) {
            // Use multiplication to get around the division-by-zero error
            $celsius *= 1e-3;
        }

        $kelvin = $celsius + 273.15;
        $fahrenheit = ($celsius*9./5)+32.0;

        if(isset($setupVars['TEMPERATUREUNIT']))
        {
            $temperatureunit = $setupVars['TEMPERATUREUNIT'];
        }
        else
        {
            $temperatureunit = "C";
        }
        // Override temperature unit setting if it is changed via Settings page
        if(isset($_POST["tempunit"]))
        {
            $temperatureunit = $_POST["tempunit"];
        }
    }
    else
    {
        // Nothing can be colder than -273.15 degree Celsius (= 0 Kelvin)
        // This is the minimum temperature possible (AKA absolute zero)
        $celsius = -273.16;
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
                $meminfo[$expl[0]] = intVal(substr($expl[1],0, -3));
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

?>
<!DOCTYPE html>
<!-- Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. -->
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https://api.github.com; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'">
    <title>Pi-hole Admin Console</title>
    <!-- Usually browsers proactively perform domain name resolution on links that the user may choose to follow. We disable DNS prefetching here -->
    <meta http-equiv="x-dns-prefetch-control" content="off">
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
    <link rel="shortcut icon" href="img/favicon.png" type="image/x-icon" />
    <meta name="theme-color" content="#367fa9">
    <link rel="apple-touch-icon" sizes="180x180" href="img/favicon.png">
    <link rel="icon" type="image/png" sizes="192x192"  href="img/logo.svg">
    <link rel="icon" type="image/png" sizes="96x96" href="img/logo.svg">
    <meta name="msapplication-TileColor" content="#367fa9">
    <meta name="msapplication-TileImage" content="img/logo.svg">
    <meta name="apple-mobile-web-app-capable" content="yes">

    <link href="style/vendor/bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="style/vendor/font-awesome-4.5.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
    <link href="style/vendor/ionicons-2.0.1/css/ionicons.min.css" rel="stylesheet" type="text/css" />
    <link href="style/vendor/dataTables.bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="style/vendor/daterangepicker.css" rel="stylesheet" type="text/css" />

    <link href="style/vendor/AdminLTE.min.css" rel="stylesheet" type="text/css" />
    <link href="style/vendor/skin-blue.min.css" rel="stylesheet" type="text/css" />
    <link href="style/pi-hole.css" rel="stylesheet" type="text/css" />
    <link rel="icon" type="image/png" sizes="160x160" href="img/logo.svg" />
    <style type="text/css">
        .glow { text-shadow: 0px 0px 5px #fff; }
        .small-box span { transition-duration: 500ms }
    </style>

    <!--[if lt IE 9]>
    <script src="scripts/vendor/html5shiv.min.js"></script>
    <script src="scripts/vendor/respond.min.js"></script>
    <![endif]-->
</head>
<body class="skin-blue sidebar-mini <?php if($boxedlayout){ ?>layout-boxed<?php } ?>">
<!-- JS Warning -->
<div>
    <link rel="stylesheet" type="text/css" href="style/vendor/js-warn.css">
    <input type="checkbox" id="js-hide" />
    <div class="js-warn" id="js-warn-exit"><h1>Javascript Is Disabled</h1><p>Javascript seems to be disabled. This will break some site features.</p>
        <p>To enable Javascript click <a href="http://www.enable-javascript.com/" target="_blank">here</a></p><label for="js-hide">Close</label></div>
</div>
<!-- /JS Warning -->
<?php
if($auth) {
    echo "<div id='token' hidden>$token</div>";
}
?>
<script src="scripts/pi-hole/js/header.js"></script>
<!-- Send token to JS -->
<div id="token" hidden><?php if($auth) echo $token; ?></div>
<div id="enableTimer" hidden><?php if(file_exists("../custom_disable_timer")){ echo file_get_contents("../custom_disable_timer"); } ?></div>
<div class="wrapper">
    <header class="main-header">
        <!-- Logo -->
        <a href="http://pi-hole.net" class="logo" target="_blank">
            <!-- mini logo for sidebar mini 50x50 pixels -->
            <span class="logo-mini">P<b>h</b></span>
            <!-- logo for regular state and mobile devices -->
            <span class="logo-lg">Pi-<b>hole</b></span>
        </a>
        <!-- Header Navbar: style can be found in header.less -->
        <nav class="navbar navbar-static-top" role="navigation">
            <!-- Sidebar toggle button-->
            <a href="#" class="sidebar-toggle" data-toggle="offcanvas" role="button">
                <span class="sr-only">Toggle navigation</span>
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <li><a style="pointer-events:none;"><samp><?php echo gethostname(); ?></samp></a></li>
                    <li class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="true">
                            <img src="img/logo.svg" class="user-image" style="border-radius: initial" sizes="160x160" alt="Pi-hole logo" />
                            <span class="hidden-xs">Pi-hole</span>
                        </a>
                        <ul class="dropdown-menu" style="right:0">
                            <!-- User image -->
                            <li class="user-header">
                                <img src="img/logo.svg" sizes="160x160" alt="User Image" style="border-color:transparent" />
                                <p>
                                    Open Source Ad Blocker
                                    <small>Designed For Raspberry Pi</small>
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body">
                                <div class="col-xs-4 text-center">
                                    <a class="btn-link" href="https://github.com/pi-hole" target="_blank">GitHub</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a class="btn-link" href="https://pi-hole.net" target="_blank">Website</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a class="btn-link" href="https://github.com/pi-hole/pi-hole/releases" target="_blank">Updates</a>
                                </div>
                                <div class="col-xs-12 text-center" id="sessiontimer">
                                    <b>Session is valid for <span id="sessiontimercounter"><?php if($auth && strlen($pwhash) > 0){echo $maxlifetime;}else{echo "0";} ?></span></b>
                                </div>
                            </li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <!-- Version Infos -->
                                <?php /*
                                <div class="<?php if(!isset($core_commit) && !isset($web_commit)) { ?>hidden-md <?php } ?>hidden-lg">
                                    <b>Pi-hole Version </b> <?php
                                    echo $core_current;
                                    if(isset($core_commit)) { echo "<br>(".$core_branch.", ".$core_commit.")"; }
                                    if($core_update){ ?> <a class="alert-link lookatme btn-link" href="https://github.com/pi-hole/pi-hole/releases" target="_blank" style="background:none">(Update available!)</a><?php } ?><br>
                                    <b>Web Interface Version </b><?php
                                    echo $web_current;
                                    if(isset($web_commit)) { echo "<br>(".$web_branch.", ".$web_commit.")"; }
                                    if($web_update){ ?> <a class="alert-link lookatme btn-link" href="https://github.com/pi-hole/AdminLTE/releases" target="_blank" style="background:none">(Update available!)</a><?php } ?><br>
                                    <b>FTL Version </b> <?php
                                    echo $FTL_current;
                                    if($FTL_update){ ?> <a class="alert-link lookatme btn-link" href="https://github.com/pi-hole/FTL/releases" target="_blank" style="background:none">(Update available!)</a><?php } ?><br><br>
                                </div>
                                */ ?>
                                <!-- PayPal -->
                                <div class="text-center">
                                    <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3J2L3Z4DHW9UY" target="_blank" style="background:none">
                                        <img src="img/donate.gif" alt="Donate">
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
                    <img src="img/logo.svg" class="img-responsive" alt="Pi-hole logo" style="display: table; table-layout: fixed; height: 67px;" />
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                        <?php
                        $pistatus = exec('sudo pihole status web');
                        if ($pistatus == "1") {
                            echo '<a id="status"><i class="fa fa-circle" style="color:#7FFF00"></i> Active</a>';
                        } elseif ($pistatus == "0") {
                            echo '<a id="status"><i class="fa fa-circle" style="color:#FF0000"></i> Offline</a>';
                        } elseif ($pistatus == "-1") {
                            echo '<a id="status"><i class="fa fa-circle" style="color:#FF0000"></i> DNS service not running</a>';
                        } else {
                            echo '<a id="status"><i class="fa fa-circle" style="color:#ff9900"></i> Unknown</a>';
                        }

                        // CPU Temp
                        if($FTL)
                        {
                            if ($celsius >= -273.15) {
                                echo "<a id=\"temperature\"><i class=\"fa fa-fire\" style=\"color:";
                                if ($celsius > 60) {
                                    echo "#FF0000";
                                }
                                else
                                {
                                    echo "#3366FF";
                                }
                                echo "\"></i> Temp:&nbsp;";
                                if($temperatureunit === "F")
                                {
                                    echo round($fahrenheit,1) . "&nbsp;&deg;F";
                                }
                                elseif($temperatureunit === "K")
                                {
                                    echo round($kelvin,1) . "&nbsp;K";
                                }
                                else
                                {
                                    echo round($celsius,1) . "&nbsp;&deg;C";
                                }
                                echo "</a>";
                            }
                        }
                        else
                        {
                            echo '<a id=\"temperature\"><i class="fa fa-circle" style="color:#FF0000"></i> FTL offline</a>';
                        }
                    ?>
                    <br/>
                    <?php
                    echo "<a title=\"Detected $nproc cores\"><i class=\"fa fa-circle\" style=\"color:";
                        if ($loaddata[0] > $nproc) {
                            echo "#FF0000";
                        }
                        else
                        {
                            echo "#7FFF00";
                        }
                        echo "\"></i> Load:&nbsp;&nbsp;" . $loaddata[0] . "&nbsp;&nbsp;" . $loaddata[1] . "&nbsp;&nbsp;". $loaddata[2] . "</a>";
                    ?>
                    <br/>
                    <?php
                    echo "<a><i class=\"fa fa-circle\" style=\"color:";
                        if ($memory_usage > 0.75 || $memory_usage < 0.0) {
                            echo "#FF0000";
                        }
                        else
                        {
                            echo "#7FFF00";
                        }
                        if($memory_usage > 0.0)
                        {
                            echo "\"></i> Memory Usage:&nbsp;&nbsp;" . sprintf("%.1f",100.0*$memory_usage) . "&thinsp;%</a>";
                        }
                        else
                        {
                            echo "\"></i> Memory usage:&nbsp;&nbsp; N/A</a>";
                        }
                    ?>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <?php
            $scriptname = basename($_SERVER['SCRIPT_FILENAME']);
            if($scriptname === "list.php")
            {
                if($_GET["l"] === "white")
                {
                    $scriptname = "whitelist";
                }
                elseif($_GET["l"] === "black")
                {
                    $scriptname = "blacklist";
                }
            }
            if(!$auth && (!isset($indexpage) || isset($_GET['login'])))
            {
                $scriptname = "login";
            }
            ?>
            <ul class="sidebar-menu">
                <li class="header">MAIN NAVIGATION</li>
                <!-- Home Page -->
                <li<?php if($scriptname === "index.php"){ ?> class="active"<?php } ?>>
                    <a href="index.php">
                        <i class="fa fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>
                <?php if($auth){ ?>
                <!-- Query Log -->
                <li<?php if($scriptname === "queries.php"){ ?> class="active"<?php } ?>>
                    <a href="queries.php">
                        <i class="fa fa-file-text-o"></i> <span>Query Log</span>
                    </a>
                </li>
                <li class="treeview<?php if($scriptname === "db_queries.php" || $scriptname === "db_lists.php" || $scriptname === "db_graph.php"){ ?> active<?php } ?>">
                  <a href="#">
                    <span class="pull-right-container">
                      <i class="fa fa-angle-down pull-right" style="padding-right: 5px;"></i>
                    </span>
                    <i class="fa fa-clock-o"></i> <span>Long Term Data</span>
                  </a>
                  <ul class="treeview-menu">
                    <li<?php if($scriptname === "db_graph.php"){ ?> class="active"<?php } ?>>
                        <a href="db_graph.php">
                            <i class="fa fa-file-text-o"></i> <span>Graphics</span>
                        </a>
                    </li>
                    <li<?php if($scriptname === "db_queries.php"){ ?> class="active"<?php } ?>>
                        <a href="db_queries.php">
                            <i class="fa fa-file-text-o"></i> <span>Query Log</span>
                        </a>
                    </li>
                    <li<?php if($scriptname === "db_lists.php"){ ?> class="active"<?php } ?>>
                        <a href="db_lists.php">
                            <i class="fa fa-file-text-o"></i> <span>Top Lists</span>
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Whitelist -->
                <li<?php if($scriptname === "whitelist"){ ?> class="active"<?php } ?>>
                    <a href="list.php?l=white">
                        <i class="fa fa-pencil-square-o"></i> <span>Whitelist</span>
                    </a>
                </li>
                <!-- Blacklist -->
                <li<?php if($scriptname === "blacklist"){ ?> class="active"<?php } ?>>
                    <a href="list.php?l=black">
                        <i class="fa fa-ban"></i> <span>Blacklist</span>
                    </a>
                </li>
                <!-- Toggle -->

                <li id="pihole-disable" class="treeview"<?php if ($pistatus == "0") { ?> hidden="true"<?php } ?>>
                  <a href="#">
                    <span class="pull-right-container">
                      <i class="fa fa-angle-down pull-right" style="padding-right: 5px;"></i>
                    </span>
                    <i class="fa fa-stop"></i> <span>Disable</span>&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span>
                  </a>
                  <ul class="treeview-menu">
                    <li>
                        <a href="#" id="pihole-disable-permanently">
                            <i class="fa fa-stop"></i> <span>Permanently</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-10s">
                            <i class="fa fa-clock-o"></i> <span>10 Seconds</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-30s">
                            <i class="fa fa-clock-o"></i> <span>30 Seconds</span>
                        </a>
                    </li>
                    <li>
                        <a href="#" id="pihole-disable-5m">
                            <i class="fa fa-clock-o"></i> <span>5 Minutes</span>
                        </a>
                    </li>
                    <li>
                      <a href="#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal">
                            <i class="fa fa-clock-o"></i> <span>Custom Time</span>
                      </a>
                    </li>
                  </ul>
                    <!-- <a href="#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="treeview"<?php if ($pistatus == "1") { ?> hidden="true"<?php } ?>>
                    <a href="#"><i class="fa fa-play"></i> <span id="enableLabel">Enable</span>&nbsp;&nbsp;&nbsp;<span id="flip-status-enable"></span></a>
                </li>
                <!-- Tools -->
                <li class="treeview <?php if(in_array($scriptname, array("gravity.php", "queryads.php", "auditlog.php", "taillog.php", "taillog-FTL.php", "debug.php"))){ ?>active<?php } ?>">
                  <a href="#">
                    <span class="pull-right-container">
                      <i class="fa fa-angle-down pull-right" style="padding-right: 5px;"></i>
                    </span>
                    <i class="fa fa-folder"></i> <span>Tools</span>
                  </a>
                  <ul class="treeview-menu">
                    <!-- Run gravity.sh -->
                    <li<?php if($scriptname === "gravity.php"){ ?> class="active"<?php } ?>>
                        <a href="gravity.php">
                            <i class="fa fa-arrow-circle-down"></i> <span>Update Lists</span>
                        </a>
                    </li>
                    <!-- Query adlists -->
                    <li<?php if($scriptname === "queryads.php"){ ?> class="active"<?php } ?>>
                        <a href="queryads.php">
                            <i class="fa fa-search"></i> <span>Query Ad Lists</span>
                        </a>
                    </li>
                    <!-- Audit log -->
                    <li<?php if($scriptname === "auditlog.php"){ ?> class="active"<?php } ?>>
                        <a href="auditlog.php">
                            <i class="fa fa-balance-scale"></i> <span>Audit Log</span>
                        </a>
                    </li>
                    <!-- Tail pihole.log -->
                    <li<?php if($scriptname === "taillog.php"){ ?> class="active"<?php } ?>>
                        <a href="taillog.php">
                            <i class="fa fa-list-ul"></i> <span>Tail pihole.log</span>
                        </a>
                    </li>
                    <!-- Tail pihole-FTL.log -->
                    <li<?php if($scriptname === "taillog-FTL.php"){ ?> class="active"<?php } ?>>
                        <a href="taillog-FTL.php">
                            <i class="fa fa-list-ul"></i> <span>Tail pihole-FTL.log</span>
                        </a>
                    </li>
                    <!-- Generate debug log -->
                    <li<?php if($scriptname === "debug.php"){ ?> class="active"<?php } ?>>
                        <a href="debug.php">
                            <i class="fa fa-ambulance"></i> <span>Generate debug log</span>
                        </a>
                    </li>
                  </ul>
                </li>
                <!-- Settings -->
                <li<?php if($scriptname === "settings.php"){ ?> class="active"<?php } ?>>
                    <a href="settings.php">
                        <i class="fa fa-gears"></i> <span>Settings</span>
                    </a>
                </li>
                <!-- Logout -->
                <?php
                // Show Logout button if $auth is set and authorization is required
                if(strlen($pwhash) > 0) { ?>
                <li>
                    <a href="?logout">
                        <i class="fa fa-user-times"></i> <span>Logout</span>
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
                        <i class="fa fa-user"></i> <span>Login</span>
                    </a>
                </li>
                <?php } ?>
                <!-- Donate -->
                <li>
                    <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3J2L3Z4DHW9UY" target="_blank">
                        <i class="fa fa-paypal"></i> <span>Donate</span>
                    </a>
                </li>
                <?php if($auth){ ?>
                <!-- Help -->
                <li<?php if($scriptname === "help.php"){ ?> class="active"<?php } ?>>
                    <a href="help.php">
                        <i class="fa fa-question-circle"></i> <span>Help</span>
                    </a>
                </li>
                <?php } ?>
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
