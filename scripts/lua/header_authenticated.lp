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
    <script src="<?=pihole.fileversion('vendor/datatables/dataTables.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables/dataTables.bootstrap5.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-select/dataTables.select.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-select/select.bootstrap5.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-buttons/dataTables.buttons.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-buttons/buttons.bootstrap5.min.js')?>"></script>
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
<body class="<?=theme.name?> hold-transition sidebar-mini sidebar-expand-lg <? if pihole.boxedlayout() then ?>layout-boxed<? end ?> logged-in page-<?=pihole.format_path(scriptname)?>" data-apiurl="<?=pihole.api_url()?>" data-webhome="<?=webhome?>">
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
<div class="app-wrapper">
    <nav class="app-header navbar navbar-expand bg-body">
        <div class="container-fluid">
            <!-- Sidebar toggle button + logo -->
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link sidebar-toggle-svg" data-lte-toggle="sidebar" href="#" role="button" aria-label="Toggle Navigation">
                        <i aria-hidden="true" class="fa fa-angle-double-left"></i>
                        <span class="warning-count hidden" id="top-warning-count"></span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="<?=webhome?>" class="nav-link logo">
                        <!-- mini logo for sidebar mini 50x50 pixels -->
                        <span class="logo-mini">P<strong>h</strong></span>
                        <!-- logo for regular state and mobile devices -->
                        <span class="logo-lg">Pi-<strong>hole</strong></span>
                    </a>
                </li>
            </ul>
            <!-- Right navbar links -->
            <ul class="navbar-nav ms-auto">
                <? if string.len(hostname) > 0 then ?>
                    <li class="nav-item d-none d-sm-flex align-items-center">
                        <span class="navbar-text">
                            hostname:
                            <code><?=hostname?></code>
                        </span>
                    </li>
                <? end ?>
                <li class="nav-item dropdown user user-menu">
                    <a href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fa fa-bars"></i>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <!-- User image -->
                        <li class="user-header">
                            <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole Logo" width="50" height="50">
                            <p>
                                Open Source Ad Blocker
                            </p>
                        </li>
                        <!-- Menu Body -->
                        <li class="user-body" id="advanced-info"></li>
                        <!-- Menu Footer -->
                        <li class="user-footer">
                            <a class="btn-link dropdown-item" href="https://pi-hole.net/" rel="noopener noreferrer" target="_blank">
                                <? mg.include('../../img/logo-bw.svg', 'r') ?>
                                Pi-hole Website
                            </a>
                            <a class="btn-link dropdown-item" href="https://docs.pi-hole.net/" rel="noopener noreferrer" target="_blank"><i class="fa-fw menu-icon fa-solid fa-circle-question"></i> Documentation</a>
                            <a class="btn-link dropdown-item" href="https://discourse.pi-hole.net/" rel="noopener noreferrer" target="_blank"><i class="fa-fw menu-icon fab fa-discourse"></i> Pi-hole Discourse</a>
                            <a class="btn-link dropdown-item" href="https://github.com/pi-hole" rel="noopener noreferrer" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                            <a class="btn-link dropdown-item" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener noreferrer" target="_blank"><i class="fa-fw menu-icon fa-solid fa-rocket"></i> Pi-hole Releases</a>
                            <? if pihole.needLogin() then ?>
                            <a class="btn-link dropdown-item" href="#" id="logout-button"><i class="fa-fw menu-icon fa-solid fa-arrow-right-from-bracket"></i> Log out</a>
                            <? end ?>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </nav>
<? mg.include('sidebar.lp', 'r') ?>
    <!-- Main content -->
    <main class="app-main">
        <div class="app-content">
            <div class="container-fluid">
