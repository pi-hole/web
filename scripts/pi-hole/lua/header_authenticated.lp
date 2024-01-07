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
    <script src="<?=pihole.fileversion('scripts/vendor/select2.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/datatables.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/datatables.select.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/datatables.buttons.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/chart.umd.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/chartjs-plugin-deferred.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/moment.min.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/chartjs-adapter-moment.js')?>"></script>
    <script src="<?=pihole.fileversion('scripts/vendor/hammer.min.js')?>"></script> <!-- Needed for chartjs-plugin-zoom --->
    <script src="<?=pihole.fileversion('scripts/vendor/chartjs-plugin-zoom.min.js')?>"></script>
</head>
<body class="<?=theme.name?> hold-transition sidebar-mini <? if pihole.boxedlayout() then ?>layout-boxed<? end ?> logged-in">
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
        <a href="<?=pihole.webhome()?>" class="logo">
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
                                <img class="logo-img" src="<?=pihole.webhome()?>img/logo.svg" alt="Pi-hole Logo" style="border: 0" width="90" height="90">
                                <p>
                                    Open Source Ad Blocker
                                </p>
                            </li>
                            <!-- Menu Body -->
                            <li class="user-body" id="advanced-info" style="display:none;"></li>
                            <!-- Menu Footer -->
                            <li class="user-footer">
                                <a class="btn-link" href="https://pi-hole.net/" rel="noopener" target="_blank">
                                    <svg class="svg-inline--fa fa-fw menu-icon" style="height: 1.25em"><use xlink:href="<?=pihole.webhome()?>img/pihole_icon.svg#pihole-svg-logo"/></svg>
                                    Pi-hole Website
                                </a>
                                <hr>
                                <a class="btn-link" href="https://docs.pi-hole.net/" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa-regular fa-circle-question"></i> Documentation</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-discourse"></i> Pi-hole Forum</a>
                                <a class="btn-link" href="https://github.com/pi-hole" rel="noopener" target="_blank"><i class="fa-fw menu-icon fab fa-github"></i> GitHub</a>
                                <a class="btn-link" href="https://discourse.pi-hole.net/c/announcements/5" rel="noopener" target="_blank"><i class="fa-fw menu-icon fa-solid fa-rocket"></i> Pi-hole Releases</a>
                                <? if pihole.needLogin(mg.request_info.remote_addr) then ?>
                                <a class="btn-link" href="#" onclick="utils.doLogout();"><i class="fa-fw menu-icon fa-solid fa-arrow-right-from-bracket"></i> Log out</a>
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
