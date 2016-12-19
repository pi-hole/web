<?php
    require "php/auth.php";
    require "php/password.php";

    check_cors();

    if(file_exists("/sys/class/thermal/thermal_zone0/temp"))
    {
        $cmd = "echo $((`cat /sys/class/thermal/thermal_zone0/temp | cut -c1-2`))";
        $output = rtrim(shell_exec($cmd));
        $celsius = intVal($output);
        $fahrenheit = round(($celsius*9./5)+32.0);

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
        $celsius = -273.16;
    }

    // Get load
    $loaddata = sys_getloadavg();
    // Get number of processing units available to PHP
    // (may be less than the number of online processors)
    $nproc = shell_exec('nproc');

    // Get memory usage
    $data = explode("\n", file_get_contents("/proc/meminfo"));
    $meminfo = array();
    if(count($data) > 0)
    {
        foreach ($data as $line) {
            list($key, $val) = explode(":", $line);
            // remove " kB" fron the end of the string and make an integer
            $meminfo[$key] = intVal(substr(trim($val),0, -3));
        }
        $memory_used = $meminfo["MemTotal"]-$meminfo["MemFree"]-$meminfo["Buffers"]-$meminfo["Cached"];
        $memory_total = $meminfo["MemTotal"];
        $memory_usage = $memory_used/$memory_total;
    }
    else
    {
        $memory_usage = -1;
    }


    // For session timer
    $maxlifetime = ini_get("session.gc_maxlifetime");

    // Generate CSRF token
    if(empty($_SESSION['token'])) {
        $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
    }
    $token = $_SESSION['token'];

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
?>

<!DOCTYPE html>
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

    <link href="bootstrap/css/bootstrap.min.css" rel="stylesheet" type="text/css" />
    <link href="css/font-awesome-4.5.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
    <link href="css/ionicons-2.0.1/css/ionicons.min.css" rel="stylesheet" type="text/css" />
    <link href="css/dataTables.bootstrap.min.css" rel="stylesheet" type="text/css" />

    <link href="css/AdminLTE.min.css" rel="stylesheet" type="text/css" />
    <link href="css/skin-blue.min.css" rel="stylesheet" type="text/css" />
    <link rel="icon" type="image/png" sizes="160x160" href="img/logo.svg" />
    <style type="text/css">
        .glow { text-shadow: 0px 0px 5px #fff; }
        h3 { transition-duration: 500ms }
    </style>

    <!--[if lt IE 9]>
    <script src="js/other/html5shiv.min.js"></script>
    <script src="js/other/respond.min.js"></script>
    <![endif]-->
</head>
<body class="skin-blue sidebar-mini <?php if($boxedlayout){ ?>layout-boxed<?php } ?>">
<!-- JS Warning -->
<div>
    <link rel="stylesheet" type="text/css" href="css/js-warn.css">
    <input type="checkbox" id="js-hide" />
    <div class="js-warn" id="js-warn-exit"><h1>Javascript Is Disabled</h1><p>Javascript seems to be disabled. This will break some site features.</p>
        <p>To enable Javascript click <a href="http://www.enable-javascript.com/" target="_blank">here</a></p><label for="js-hide">Close</label></div>
</div>
<!-- /JS Warning -->
<script src="js/pihole/header.js"></script>
<!-- Send token to JS -->
<div id="token" hidden><?php echo $token ?></div>
<div class="wrapper">
    <header class="main-header">
        <!-- Logo -->
        <a href="http://pi-hole.net" class="logo">
            <!-- mini logo for sidebar mini 50x50 pixels -->
            <span class="logo-mini"><b>P</b>H</span>
            <!-- logo for regular state and mobile devices -->
            <span class="logo-lg"><b>Pi</b>-hole</span>
        </a>
        <!-- Header Navbar: style can be found in header.less -->
        <nav class="navbar navbar-static-top" role="navigation">
            <!-- Sidebar toggle button-->
            <a href="#" class="sidebar-toggle" data-toggle="offcanvas" role="button">
                <span class="sr-only">Toggle navigation</span>
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <!-- User Account: style can be found in dropdown.less -->
                    <li id="dropdown-menu" class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle">
                            <img src="img/logo.svg" class="user-image" style="border-radius: initial" sizes="160x160" alt="Pi-hole logo" />
                            <span class="hidden-xs">Pi-hole</span>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img src="img/logo.svg" sizes="160x160" alt="User Image" />
                                <p>
                                    Open Source Ad Blocker
                                    <small>Designed For Raspberry Pi</small>
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body">
                                <div class="col-xs-4 text-center">
                                    <a href="https://github.com/pi-hole/pi-hole">GitHub</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a href="http://jacobsalmela.com/block-millions-ads-network-wide-with-a-raspberry-pi-hole-2-0/">Details</a>
                                </div>
                                <div class="col-xs-4 text-center">
                                    <a href="https://github.com/pi-hole/pi-hole/releases">Updates</a>
                                </div>
                                <div class="col-xs-12 text-center" id="sessiontimer">Session is valid for <span id="sessiontimercounter"><?php if($auth && strlen($pwhash) > 0){echo $maxlifetime;}else{echo "0";} ?></span></div>
                            </li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <!-- Update alerts -->
                                <div id="alPiholeUpdate" class="alert alert-info alert-dismissible fade in" role="alert" hidden>
                                    <a class="alert-link" href="https://github.com/pi-hole/pi-hole/releases">There's an update available for this Pi-hole!</a>
                                </div>
                                <div id="alWebUpdate" class="alert alert-info alert-dismissible fade in" role="alert" hidden>
                                    <a class="alert-link" href="https://github.com/pi-hole/AdminLTE/releases">There's an update available for this Web Interface!</a>
                                </div>

                                <!-- PayPal -->
                                <div>
                                    <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
                                        <input type="hidden" name="cmd" value="_s-xclick">
                                        <input type="hidden" name="hosted_button_id" value="3J2L3Z4DHW9UY">
                                        <input style="display: block; margin: 0 auto;" type="image" src="img/donate.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!">
                                    </form>
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
                    <img src="img/logo.svg" style="width: 45px; height: 67px;" alt="Pi-hole logo" />
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <?php
                        $pistatus = exec('sudo pihole status web');
                        if ($pistatus == "1") {
                            echo '<a href="#" id="status"><i class="fa fa-circle" style="color:#7FFF00"></i> Active</a>';
                        } elseif ($pistatus == "0") {
                            echo '<a href="#" id="status"><i class="fa fa-circle" style="color:#FF0000"></i> Offline</a>';
                        } else {
                            echo '<a href="#" id="status"><i class="fa fa-circle" style="color:#ff9900"></i> Starting</a>';
                        }

                        // CPU Temp
                        echo "<a href=\"#\" id=\"temperature\"><i class=\"fa fa-fire\" style=\"color:";
                        if ($celsius > 45 || $celsius < -273.15) {
                            echo "#FF0000";
                        }
                        else
                        {
                            echo "#3366FF";
                        }
                        echo "\"></i> Temp:&nbsp;";
                        if($celsius >= -273.15)
                        {
                            if($temperatureunit != "F")
                            {
                                echo $celsius . "&deg;C";
                            }
                            else
                            {
                                echo $fahrenheit . "&deg;F";
                            }
                        }
                        else
                        {
                            echo "N/A";
                        }
                        echo "</a>";
                    ?>
                    <br/>
                    <?php
                    echo '<a href="#"><i class="fa fa-circle" style="color:';
                        if ($loaddata[0] > $nproc) {
                            echo '#FF0000';
                        }
                        else
                        {
                            echo '#7FFF00';
                        }
                        echo '""></i> Load:&nbsp;&nbsp;' . $loaddata[0] . '&nbsp;&nbsp;' . $loaddata[1] . '&nbsp;&nbsp;'. $loaddata[2] . '</a>';
                    ?>
                    <br/>
                    <?php
                    echo '<a href="#"><i class="fa fa-circle" style="color:';
                        if ($memory_usage > 0.75 || $memory_usage < 0.0) {
                            echo '#FF0000';
                        }
                        else
                        {
                            echo '#7FFF00';
                        }
                        if($memory_usage > 0.0)
                        {
                            echo '""></i> Memory usage:&nbsp;&nbsp;' . sprintf("%.1f",100.0*$memory_usage) . '%</a>';
                        }
                        else
                        {
                            echo '""></i> Memory usage:&nbsp;&nbsp; N/A</a>';
                        }
                    ?>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <ul class="sidebar-menu">
                <li class="header">MAIN NAVIGATION</li>
                <!-- Home Page -->
                <li>
                    <a href="index.php">
                        <i class="fa fa-home"></i> <span>Main Page</span>
                    </a>
                </li>
                <?php if($auth){ ?>
                <!-- Query Log -->
                <li>
                    <a href="queries.php">
                        <i class="fa fa-file-text-o"></i> <span>Query Log</span>
                    </a>
                </li>
                <!-- Whitelist -->
                <li>
                    <a href="list.php?l=white">
                        <i class="fa fa-pencil-square-o"></i> <span>Whitelist</span>
                    </a>
                </li>
                <!-- Blacklist -->
                <li>
                    <a href="list.php?l=black">
                        <i class="fa fa-ban"></i> <span>Blacklist</span>
                    </a>
                </li>
                <!-- Run gravity.sh -->
                <li>
                    <a href="gravity.php">
                        <i class="fa fa-arrow-circle-down"></i> <span>Update Lists</span>
                    </a>
                </li>
                <!-- Query adlists -->
                <li>
                    <a href="queryads.php">
                        <i class="fa fa-search"></i> <span>Query adlists</span>
                    </a>
                </li>
                <!-- Toggle -->
                <?php
                if ($pistatus == "1") {
                  echo '                <li><a href="#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a></li>';
                } else {
                  echo '                <li><a href="#" id="flip-status"><i class="fa fa-play"></i> <span>Enable</span></a></li>';
                }
                ?>
                <!-- Settings -->
                <li>
                    <a href="settings.php">
                        <i class="fa fa-gears"></i> <span>Settings</span>
                    </a>
                </li>
                <!-- Logout -->
                <?php
                // Show Logout button if $auth is set and authorization is required
                if(strlen($pwhash) > 0) { ?>
                <li>
                    <a href="index.php?logout">
                        <i class="fa fa-user-times"></i> <span>Logout</span>
                    </a>
                </li>
                <?php } ?>
                <?php } ?>
                <!-- Login -->
                <?php
                // Show Login button if $auth is *not* set and authorization is required
                if(strlen($pwhash) > 0 && !$auth) { ?>
                <li>
                    <a href="index.php?login">
                        <i class="fa fa-user"></i> <span>Login</span>
                    </a>
                </li>
                <?php } ?>
                <!-- Donate -->
                <li>
                    <a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=3J2L3Z4DHW9UY">
                        <i class="fa fa-paypal"></i> <span>Donate</span>
                    </a>
                </li>
                <?php if($auth){ ?>
                <!-- Help -->
                <li>
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
        require "php/loginpage.php";
        require "footer.php";
        exit();
    }
?>
