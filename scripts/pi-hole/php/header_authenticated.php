<?php
/*
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/auth.php';
require_once 'scripts/pi-hole/php/func.php';
require 'scripts/pi-hole/php/theme.php';

check_cors();

require 'header.php';
?>
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/datatables.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/datatables_extensions.min.css'); ?>">
    <link rel="stylesheet" href="<?php echo fileversion('style/vendor/daterangepicker.min.css'); ?>">
    <script src="<?php echo fileversion('scripts/vendor/select2.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.select.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/datatables.buttons.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/moment.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/chart.min.js'); ?>"></script>
    <script src="<?php echo fileversion('scripts/vendor/chartjs-adapter-moment.js'); ?>"></script>
</head>
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
                                    <svg class="svg-inline--fa fa-fw menu-icon" style="height: 1.25em"><use xlink:href="img/pihole_icon.svg#pihole-svg-logo"/></svg>
                                    Pi-hole Website
                                </a>
                                <hr>
                                <a class="btn-link" href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fa-question-circle"></i> Documentation</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/" rel="noopener" target="_blank"><i class="fa fa-fw menu-icon fab fa-discourse"></i> Pi-hole Forum</a>
                                <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa fa-regular fa-rocket"></i> Pi-hole Releases</a>
                                <a class="btn-link" href="#" onclick="utils.doLogout();"><i class="fa fa-fw menu-icon fa-sign-out-alt"></i> Log out</a>
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
