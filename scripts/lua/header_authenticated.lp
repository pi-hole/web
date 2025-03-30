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
    <script defer src="<?=pihole.fileversion('vendor/select2/select2.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/datatables/datatables.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/datatables-select/datatables.select.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/datatables-buttons/datatables.buttons.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/chartjs/chart.umd.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/chartjs-plugin-deferred/chartjs-plugin-deferred.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/moment/moment.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/chartjs-adapter-moment/chartjs-adapter-moment.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/hammer/hammer.min.js')?>"></script> <!-- Needed for chartjs-plugin-zoom -->
    <script defer src="<?=pihole.fileversion('vendor/chartjs-plugin-zoom/chartjs-plugin-zoom.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('vendor/bstreeview/bstreeview.min.js')?>"></script>
    <script defer src="<?=pihole.fileversion('scripts/js/logout.js')?>"></script>
</head>
<body class="<?=theme.name?> hold-transition sidebar-mini <? if pihole.boxedlayout() then ?>layout-boxed<? end ?> logged-in" data-apiurl="<?=pihole.api_url()?>" data-logout-url="<?=webhome .. 'login'?>">
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
<div id="enableTimer" hidden></div>
<div class="wrapper">
    <header class="main-header">
        <!-- Logo -->
        <a href="<?=webhome?>" class="logo">
            <!-- mini logo for sidebar mini 50x50 pixels -->
            <span class="logo-mini">P<strong>h</strong></span>
            <!-- logo for regular state and mobile devices -->
            <span class="logo-lg">Pi-<strong>hole</strong></span>
        </a>
        <!-- Header Navbar: style can be found in header.less -->
        <nav class="navbar navbar-static-top">
            <!-- Sidebar toggle button-->
            <button class="sidebar-toggle-svg" data-toggle="push-menu" aria-label="Toggle Navigation">
                <i aria-hidden="true" class="fa fa-angle-double-left"></i>
                <span class="warning-count hidden" id="top-warning-count"></span>
            </button>
            <div class="navbar-custom-menu">
                <ul class="nav navbar-nav">
                    <li<? if string.len(hostname) == 0 then ?> class="hidden"<? end ?>>
                        <p class="navbar-text">
                            <span class="hidden-xs">hostname:</span>
                            <code><?=hostname?></code>
                        </p>
                    </li>
                    <li class="dropdown user user-menu">
                        <a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
                            <i class="fa fa-bars"></i>
                        </a>
                        <ul class="dropdown-menu">
                            <!-- User image -->
                            <li class="user-header">
                                <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole Logo" width="50" height="50">
                                <p>
                                    Open Source Ad Blocker
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body" id="advanced-info" style="display:none;"></li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <a class="btn-link" href="https://pi-hole.net/" rel="noopener" target="_blank">
                                    <? mg.include('../../img/logo-bw.svg', 'r') ?>
                                    Pi-hole Website
                                </a>
                                <hr>
                                <a class="btn-link" href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa-regular fa-circle-question"></i> Documentation</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-discourse"></i> Pi-hole Discourse</a>
                                <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa-solid fa-rocket"></i> Pi-hole Releases</a>
                                <? if pihole.needLogin() then ?>
                                <a class="btn-link" href="#" id="logout-button"><i class="fa-fw menu-icon fa-solid fa-arrow-right-from-bracket"></i> Log out</a>
                                <? end ?>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </nav>
    </header>
<? mg.include('sidebar.lp', 'r') ?>
    <!-- Content Wrapper. Contains page content -->
    <div class="content-wrapper">
        <!-- Main content -->
        <section class="content">
