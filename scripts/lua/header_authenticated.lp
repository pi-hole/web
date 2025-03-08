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
    <script src="<?=pihole.fileversion('scripts/js/logout.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/select2/select2.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables/datatables.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-select/datatables.select.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/datatables-buttons/datatables.buttons.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs/chart.umd.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs-plugin-deferred/chartjs-plugin-deferred.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/moment/moment.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/chartjs-adapter-moment/chartjs-adapter-moment.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/hammer/hammer.min.js')?>"></script> <!-- Needed for chartjs-plugin-zoom --->
    <script src="<?=pihole.fileversion('vendor/chartjs-plugin-zoom/chartjs-plugin-zoom.min.js')?>"></script>
    <script src="<?=pihole.fileversion('vendor/bstreeview/bstreeview.min.js')?>"></script>
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
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentcolor" class="svg-inline--fa fa-fw menu-icon" viewBox="0 0 88.32 129.93"><path d="M36.56 39.93C20.34 38.2 4 25.94 2.71 0c25.17 0 38.63 14.9 39.93 38.51 4.76-28.32 27.07-25 27.07-25 1.06 16.05-12.12 25.78-27.07 26.59-4.2-8.85-29.36-30.56-29.36-30.56a.07.07 0 0 0-.11.08s24.28 21.15 23.39 30.31m7.6 90c-1.57-.09-16.22-.65-17.11-17.11-.72-10 7.18-17.37 7.18-27.08C32.44 61.53 0 64.53 0 85.74a19.94 19.94 0 0 0 5.83 14.14L30 124.06a19.94 19.94 0 0 0 14.14 5.83"/><path d="M88.32 85.75c-.09 1.57-.65 16.22-17.11 17.11-10 .72-17.38-7.18-27.08-7.18-24.21 1.79-21.21 34.22 0 34.22a19.94 19.94 0 0 0 14.14-5.83L82.46 99.9a19.94 19.94 0 0 0 5.83-14.14"/><path d="M44.16 41.59c1.57.09 16.22.65 17.11 17.11.72 10-7.18 17.37-7.18 27.08 1.79 24.21 34.22 21.21 34.22 0a19.94 19.94 0 0 0-5.83-14.14L58.3 47.45a19.94 19.94 0 0 0-14.14-5.83"/><path d="M.08 85.75c.09-1.57.65-16.22 17.11-17.11 10-.72 17.38 7.18 27.08 7.18 24.21-1.82 21.21-34.22 0-34.22a19.94 19.94 0 0 0-14.14 5.83L5.94 71.61A19.94 19.94 0 0 0 .11 85.75"/></svg>
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
