<?php
/* Pi-hole: A deny hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

    require "scripts/pi-hole/php/auth.php";
    require_once "scripts/pi-hole/php/FTL.php";
    require "scripts/pi-hole/php/theme.php";
    $scriptname = basename($_SERVER['SCRIPT_FILENAME']);
    $hostname = gethostname() ? gethostname() : "";

    check_cors();

    // Create cache busting version
    $cacheVer = filemtime(__FILE__);

    $boxedlayout = true;

    $piholeFTLConf = piholeFTLConfig();
?>
<!doctype html>
<!-- Pi-hole: A deny hole for Internet advertisements
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
    <meta name="theme-color" content="#367fa9">

<?php if ($darkmode) { ?>
    <style>
        html { background-color: #000; }
    </style>
<?php } ?>
    <link rel="stylesheet" href="style/vendor/SourceSansPro/SourceSansPro.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/bootstrap/css/bootstrap.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/datatables.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/daterangepicker.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/AdminLTE.min.css?v=<?=$cacheVer?>">
    <link rel="stylesheet" href="style/vendor/select2.min.css?v=<?=$cacheVer?>">

<?php if (in_array($scriptname, array("groups.php", "groups-lists.php", "groups-clients.php", "groups-domains.php"))){ ?>
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
    <script src="scripts/vendor/moment.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/Chart.min.js?v=<?=$cacheVer?>"></script>
    <script src="scripts/vendor/geraintluff-sha256.min.js?v=<?=$cacheVer?>"></script>
    <script src="style/vendor/font-awesome/js/all.min.js?v=<?=$cacheVer?>"></script>
</head>
<body class="hold-transition sidebar-mini <?php if($boxedlayout){ ?>layout-boxed<?php } ?>">
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
            </a>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <li id="pihole-diagnosis" class="hidden">
                        <a href="messages.php"><i class="fa fa-exclamation-triangle"></i><span class="label label-warning" id="pihole-diagnosis-count"></span>
                        </a>
                    </li>
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
                                </div>
                            </li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <!-- PayPal -->
                                <div class="text-center">
                                    <a href="https://pi-hole.net/donate/" rel="noopener" target="_blank">
                                        <img src="img/donate.gif" alt="Donate" width="147" height="47">
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
                    <img src="img/logo.svg" alt="Pi-hole logo" width="45" height="67" style="height: 67px;">
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <span id="status"></span>
                    <span id="temperature"></span><br/>
                    <span id="cpu"></span><br/>
                    <span id="memory"></span>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <?php
            if($scriptname === "groups-domains.php" && isset($_GET['type']))
            {
                if($_GET["type"] === "Allow")
                {
                    $scriptname = "allowlist";
                }
                elseif($_GET["type"] === "deny")
                {
                    $scriptname = "denylist";
                }
            }
            ?>
            <ul class="sidebar-menu" data-widget="tree">
                <li class="header text-uppercase">Main navigation</li>
                <!-- Home Page -->
                <li class="<?php if($scriptname === "index.php"){ ?> active<?php } ?>">
                    <a href="index.php"><i class="fa fa-fw fa-home"></i>Dashboard</a>
                </li>
                <!-- Login -->
                <li class="menu-login<?php if($scriptname === "login"){ ?> active<?php } ?>">
                    <a href="login.php"><i class="fa fa-fw fa-user"></i>Login</a>
                </li>
                <!-- Logout -->
                <li class="needs-auth">
                    <a href="" onclick="utils.doLogout();"><i class="fa fa-fw fa-user-times"></i>Logout</a>
                </li>
                <!-- Donate -->
                <li>
                    <a href="https://pi-hole.net/donate/" rel="noopener" target="_blank"><i class="fab fa-fw fa-paypal"></i>Donate</a>
                </li>
                 <!-- Docs -->
                 <li>
                    <a href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw fa-question-circle"></i>Documentation</a>
                </li>
                <!-- API Docs -->
                <li>
                   <a href="/api/docs/" rel="noopener" target="_blank"><i class="fa fa-fw fa-question-circle"></i>API Documentation</a>
               </li>
                <li class="header needs-auth text-uppercase">Analysis</li>
                <!-- Query Log -->
                <li class="needs-auth<?php if($scriptname === "queries.php"){ ?> active<?php } ?>">
                    <a href="queries.php"><i class="fa fa-fw fa-file-alt"></i>Query Log</a>
                </li>
                <li class="treeview needs-auth<?php if($scriptname === "db_queries.php" || $scriptname === "db_lists.php" || $scriptname === "db_graph.php"){ ?> active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw fa-clock"></i>Long-term data
                    <span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>
                  </a>
                  <ul class="treeview-menu">
                    <li class="<?php if($scriptname === "db_graph.php"){ ?> active<?php } ?>">
                        <a href="db_graph.php"><i class="fa fa-fw fa-file-alt"></i>Graphics</a>
                    </li>
                    <li class="<?php if($scriptname === "db_queries.php"){ ?> active<?php } ?>">
                        <a href="db_queries.php"><i class="fa fa-fw fa-file-alt"></i>Query Log</a>
                    </li>
                    <li class="<?php if($scriptname === "db_lists.php"){ ?> active<?php } ?>">
                        <a href="db_lists.php"><i class="fa fa-fw fa-file-alt"></i>Top Lists</a>
                    </li>
                  </ul>
                </li>
                <li class="header needs-auth text-uppercase">Management</li>
                <li class="needs-auth <?php if($scriptname === "groups.php"){ ?> active<?php } ?>">
                    <a href="groups.php">
                        <i class="fa fa-fw fa-user-friends"></i>Groups
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_groups"></span>
                        </span>
                    </a>
                </li>
                <li class="needs-auth <?php if($scriptname === "groups-clients.php"){ ?> active<?php } ?>">
                    <a href="groups-clients.php"><i class="fa fa-fw fa-laptop"></i>Clients
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_clients"></span>
                        </span>
                    </a>
                </li>
                <li class="needs-auth <?php if($scriptname === "groups-domains.php"){ ?> active<?php } ?>">
                    <a href="groups-domains.php"><i class="fa fa-fw fa-list"></i>Domains
                        <span class="pull-right-container">
                            <span class="label bg-red pull-right" id="num_denied"></span>
                            <span class="label bg-green pull-right" id="num_allowed"></span>
                        </span>
                    </a>
                </li>
                <li class="needs-auth <?php if($scriptname === "groups-lists.php"){ ?> active<?php } ?>">
                    <a href="groups-lists.php"><i class="fa fa-fw fa-shield-alt"></i>Lists
                    <span class="pull-right-container">
                            <span class="label bg-yellow pull-right" id="num_lists"></span>
                        </span>
                    </a>
                </li>
                <li class="header needs-auth text-uppercase">DNS control</li>
                <!-- Toggle -->
                <li id="pihole-disable" class="treeview needs-auth"<?php if ($pistatus == "0") { ?> hidden<?php } ?>>
                  <a href="#">
                    <span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>
                    <i class="fa fa-fw fa-stop"></i><span>Disable<span id="flip-status-disable"></span></span>
                  </a>
                  <ul class="treeview-menu">
                    <li><a href="#" id="pihole-disable-indefinitely"><i class="fa fa-fw fa-stop"></i>Indefinitely</a></li>
                    <li><a href="#" id="pihole-disable-10s"><i class="fa fa-fw fa-clock"></i>For 10 seconds</a></li>
                    <li><a href="#" id="pihole-disable-30s"><i class="fa fa-fw fa-clock"></i>For 30 seconds</a></li>
                    <li><a href="#" id="pihole-disable-5m"><i class="fa fa-fw fas fa-clock"></i>For 5 minutes</a></li>
                    <li><a href="#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal"><i class="fa fa-fw fa-clock"></i><span>Custom time</span></a></li>
                  </ul>
                    <!-- <a href="#" id="flip-status"><i class="fa fa-stop"></i>&nbsp;&nbsp;<span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="treeview needs-auth"<?php if ($pistatus == "1") { ?> hidden<?php } ?>>
                    <a href="#"><i class="fa fa-fw fa-play"></i><span id="enableLabel">Enable<span id="flip-status-enable"></span></span></a>
                </li>
                <li class="header needs-auth text-uppercase">System</li>
                <!-- Settings -->
                <li class="needs-auth <?php if($scriptname === "settings.php"){ ?> active<?php } ?>">
                    <a href="settings.php"><i class="fa fa-fw fa-cogs"></i>Settings</a>
                </li>
                <!-- Tools -->
                <li class="treeview needs-auth<?php if (in_array($scriptname, array("messages.php", "gravity.php", "queryads.php", "auditlog.php", "taillog.php", "taillog-FTL.php", "debug.php", "network.php"))){ ?> active<?php } ?>">
                  <a href="#"><i class="fa fa-fw fa-folder"></i><span>Tools</span><span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span></a>
                  <ul class="treeview-menu">
                    <!-- Pi-hole diagnosis -->
                    <li class="<?php if($scriptname === "messages.php"){ ?> active<?php } ?>">
                        <a href="messages.php"><i class="fa fa-fw fa-stethoscope"></i>Pi-hole diagnosis</a>
                    </li>
                    <!-- Run gravity.sh -->
                    <li class="<?php if($scriptname === "gravity.php"){ ?> active<?php } ?>">
                        <a href="gravity.php"><i class="fa fa-fw fa-arrow-circle-down"></i>Update Gravity</a>
                    </li>
                    <!-- Query Lists -->
                    <li class="<?php if($scriptname === "queryads.php"){ ?> active<?php } ?>">
                        <a href="queryads.php"><i class="fa fa-fw fa-search"></i>Query Lists</a>
                    </li>
                    <!-- Audit log -->
                    <li class="<?php if($scriptname === "auditlog.php"){ ?> active<?php } ?>">
                        <a href="auditlog.php"><i class="fa fa-fw fa-balance-scale"></i>Audit log</a>
                    </li>
                    <!-- Tail pihole.log -->
                    <li class="<?php if($scriptname === "taillog.php"){ ?> active<?php } ?>">
                        <a href="taillog.php"><i class="fa fa-fw fa-list-ul"></i>Tail pihole.log</a>
                    </li>
                    <!-- Tail pihole-FTL.log -->
                    <li class="<?php if($scriptname === "taillog-FTL.php"){ ?> active<?php } ?>">
                        <a href="taillog-FTL.php"><i class="fa fa-fw fa-list-ul"></i>Tail pihole-FTL.log</a>
                    </li>
                    <!-- Generate debug log -->
                    <li class="<?php if($scriptname === "debug.php"){ ?> active<?php } ?>">
                        <a href="debug.php"><i class="fa fa-fw fa-ambulance"></i>Generate debug log</a>
                    </li>
                    <!-- Network -->
                    <li class="<?php if($scriptname === "network.php"){ ?> active<?php } ?>">
                        <a href="network.php"><i class="fa fa-fw fa-network-wired"></i>Network</a>
                    </li>
                  </ul>
                </li>
                <!-- Local DNS Records -->
                <li class="treeview needs-auth <?php if(in_array($scriptname, array("dns_records.php", "cname_records.php"))){ ?>active<?php } ?>">
                  <a href="#">
                    <i class="fa fa-fw fa-address-book"></i>Local DNS<span class="pull-right-container"><i class="fa fa-angle-left pull-right"></i></span>
                  </a>
                  <ul class="treeview-menu">
                    <li class="<?php if($scriptname === "dns_records.php"){ ?> active<?php } ?>">
                        <a href="dns_records.php"><i class="fa fa-fw fa-address-book"></i> DNS Records</a>
                    </li>
                    <li class="<?php if($scriptname === "cname_records.php"){ ?> active<?php } ?>">
                        <a href="cname_records.php"><i class="fa fa-fw fa-address-book"></i> CNAME Records</a>
                    </li>
                  </ul>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
