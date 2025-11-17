<?
--[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
]]--
mg.include('header.lp','r')
?>
    <script src="<?=pihole.fileversion('vendor/bootstrap-notify/bootstrap-notify.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/select2/select2.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables/datatables.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs/chart.umd.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs-plugin-deferred/chartjs-plugin-deferred.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/moment/moment.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs-adapter-moment/chartjs-adapter-moment.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/hammer/hammer.min.js')?>"></script> <!-- Needed for chartjs-plugin-zoom -->
    <script src="<?=pihole.fileversion('vendor/chartjs-plugin-zoom/chartjs-plugin-zoom.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/bstreeview/bstreeview.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/waitMe-js/modernized-waitme-min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/js/logout.js')?>"></script>
</head>
<body class="<?=theme.name?> hold-transition sidebar-mini <? if pihole.boxedlayout() then ?>layout-boxed<? end ?> logged-in page-<?=pihole.format_path(scriptname)?>" data-apiurl="<?=pihole.api_url()?>" data-webhome="<?=webhome?>">
<noscript>
    <!-- JS Warning -->
    <div>
        <input type="checkbox" id="js-hide">
        <div class="js-warn" id="js-warn-exit"><h1>JavaScript Is Disabled</h1><p>JavaScript is required for the site to function.</p>
            <p>To learn how to enable JavaScript click <a href="https://www.enable-javascript.com/" rel="noopener noreferrer" target="_blank">here</a></p><label for="js-hide">Close</label>
        </div>
    </div>
    <!-- /JS Warning -->
</noscript>

<!-- Send token to JS -->
<div id="enableTimer" hidden></div>
<div class="wrapper">
    <!-- Main Header / Navbar -->
    <nav class="main-header navbar navbar-expand navbar-white navbar-light">
        <!-- Left navbar links -->
        <ul class="navbar-nav">
            <li class="nav-item">
                <a class="nav-link" data-widget="pushmenu" href="#" role="button" aria-label="Toggle Navigation">
                    <i class="fa fa-bars"></i>
                    <span class="warning-count hidden" id="top-warning-count"></span>
                </a>
            </li>
        </ul>

        <!-- Right navbar links -->
        <ul class="navbar-nav ml-auto">
            <? if string.len(hostname) > 0 then ?>
                <li class="nav-item">
                    <span class="navbar-text">
                        <span class="d-none d-sm-inline">hostname:</span>
                        <code><?=hostname?></code>
                    </span>
                </li>
            <? end ?>
            <li class="nav-item dropdown user user-menu">
                <a href="#" class="nav-link dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                    <i class="fa fa-bars"></i>
                </a>
                <div class="dropdown-menu dropdown-menu-lg dropdown-menu-right">
                    <!-- User image -->
                    <div class="dropdown-header user-header text-center">
                        <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole Logo" width="50" height="50">
                        <p>
                            Open Source Ad Blocker
                        </p>
                    </div>
                    <!-- Menu Body -->
                    <div class="dropdown-divider"></div>
                    <div class="user-body px-3 py-2" id="advanced-info"></div>
                    <div class="dropdown-divider"></div>
                    <!-- Menu Footer -->
                    <a class="dropdown-item" href="https://pi-hole.net/" rel="noopener noreferrer" target="_blank">
                        <i class="fa-fw fa-solid fa-home"></i> Pi-hole Website
                    </a>
                    <a class="dropdown-item" href="https://docs.pi-hole.net/" rel="noopener noreferrer" target="_blank">
                        <i class="fa-fw fa-solid fa-circle-question"></i> Documentation
                    </a>
                    <a class="dropdown-item" href="https://discourse.pi-hole.net/" rel="noopener noreferrer" target="_blank">
                        <i class="fa-fw fab fa-discourse"></i> Pi-hole Discourse
                    </a>
                    <a class="dropdown-item" href="https://github.com/pi-hole" rel="noopener noreferrer" target="_blank">
                        <i class="fa-fw fab fa-github"></i> GitHub
                    </a>
                    <a class="dropdown-item" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener noreferrer" target="_blank">
                        <i class="fa-fw fa-solid fa-rocket"></i> Pi-hole Releases
                    </a>
                    <? if pihole.needLogin() then ?>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item" href="#" id="logout-button">
                        <i class="fa-fw fa-solid fa-arrow-right-from-bracket"></i> Log out
                    </a>
                    <? end ?>
                </div>
            </li>
        </ul>
    </nav>
<? mg.include('sidebar.lp', 'r') ?>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
