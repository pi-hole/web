<? --[[
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/ ]]-- ?>
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="main-sidebar">
        <!-- sidebar: style can be found in sidebar.less -->
        <section class="sidebar">
            <!-- Sidebar user panel -->
            <div class="user-panel">
                <div class="pull-left image">
                    <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole logo" width="60" height="87">
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <span id="status"></span><br>
                    <span id="query_frequency"></span><br>
                    <span id="cpu"></span><br>
                    <span id="memory"></span>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <ul class="sidebar-menu" data-widget="tree">
                <li class="header text-uppercase">Main</li>
                <!-- Home Page -->
                <li class="menu-main<? if scriptname == 'index' or scriptname == 'index.lp' then ?> active<? end ?>">
                    <a href="<?=webhome?>">
                        <i class="fa fa-fw menu-icon fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>
                <!-- Query Log -->
                <li class="menu-analysis<? if scriptname == 'queries' then ?> active<? end ?>">
                    <a href="<?=webhome?>queries">
                        <i class="fa fa-fw menu-icon fa-file-alt"></i> <span>Query Log</span>
                    </a>
                </li>

                <li class="header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li class="menu-group<? if scriptname == 'groups' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups">
                        <i class="fa fa-fw menu-icon fa-user-friends"></i>
                        <span>Groups
                            <span class="pull-right-container">
                                <span class="label label-primary pull-right" id="num_groups" title="Number of enabled groups"></span>
                            </span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/clients">
                        <i class="fa fa-fw menu-icon fa-laptop"></i>
                        <span>Clients
                            <span class="pull-right-container">
                                <span class="label label-primary pull-right" id="num_clients" title="Number of defined clients"></span>
                            </span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/domains">
                        <i class="fa fa-fw menu-icon fa-list"></i>
                        <span>Domains
                            <span class="pull-right-container">
                                <span class="label bg-red pull-right" id="num_denied" title="Number of enabled deny rules (domains and regex)"></span>
                                <span class="label bg-green pull-right" id="num_allowed" title="Number of enabled allow rules (domains and regex)"></span>
                            </span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/lists">
                        <i class="fa fa-fw menu-icon fa-shield-alt"></i>
                        <span>Lists
                            <span class="pull-right-container">
                                <span class="label bg-blue pull-right" id="num_lists" title="Number of subscribed and enabled lists"></span>
                                <span class="label bg-yellow pull-right" id="num_gravity" title="Total number of domains subscribed by your Pi-hole"></span>
                            </span>
                        </span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="menu-dns treeview">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-stop"></i>
                        <span>Disable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-disable"></span>
                        </span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-indefinitely">
                                <i class="fa fa-fw menu-icon fa-infinity"></i> Indefinitely
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-10s">
                                <i class="fa fa-fw menu-icon fa-clock"></i> For 10 seconds
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-30s">
                                <i class="fa fa-fw menu-icon fa-clock"></i> For 30 seconds
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-5m">
                                <i class="fa fa-fw menu-icon fas fa-clock"></i> For 5 minutes
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal">
                                <i class="fa fa-fw menu-icon fa-user-clock"></i> Custom time
                            </a>
                        </li>
                    </ul>
                    <!-- <a href="<?=webhome?>#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="menu-dns treeview d-none">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-play"></i>
                        <span id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <li class="header text-uppercase">System</li>
                <!-- Settings -->
                <li class="menu-system treeview<? if startsWith(scriptname, 'settings/') then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-cogs"></i> <span>Settings</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li<? if scriptname == 'settings/system' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/system">
                                <i class="fa-fw menu-icon fa-solid fa-circle-info"></i> <span>System</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/dns' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/dns">
                                <i class="fa-fw menu-icon fa-solid fa-book-atlas"></i> <span>DNS</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/dhcp' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/dhcp">
                                <i class="fa-fw menu-icon fa-solid fa-sitemap"></i> <span>DHCP</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/api' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/api">
                                <i class="fa-fw menu-icon fa-solid fa-window-restore"></i> <span>Web interface / API</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/privacy' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/privacy">
                                <i class="fa-fw menu-icon fa-solid fa-binoculars"></i> <span>Privacy</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/teleporter' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/teleporter">
                                <i class="fa-fw menu-icon fa-solid fa-file-export"></i> <span>Teleporter</span>
                            </a>
                        </li>
                        <li<? if scriptname == 'settings/dnsrecords' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>settings/dnsrecords">
                                <i class="fa-fw menu-icon fa-solid fa-address-book"></i> <span>Local DNS Records</span>
                            </a>
                        </li>
                        <li class="settings-level-expert d-none<? if scriptname == 'settings/all' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/all">
                                <i class="fa-fw menu-icon fa-solid fa-pen-to-square"></i> <span>All settings</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Tools -->
                <li class="menu-system treeview<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                        <span class="warning-count d-none"></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li<? if scriptname == 'messages' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>messages">
                                <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> <span>Pi-hole diagnosis</span>
                                <span class="pull-right-container warning-count d-none"></span>
                            </a>
                        </li>
                        <!-- Tail log files -->
                        <li class="treeview<? if scriptname == 'taillog' then ?> active<? end ?>">
                            <a href="<?=webhome?>#">
                                <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <span>Tail log files</span>
                                <span class="pull-right-container">
                                    <i class="fa fa-angle-left pull-right"></i>
                                </span>
                            </a>
                            <ul class="treeview-menu">
                                <!-- Tail pihole.log -->
                                <li<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> class="active"<? end ?>>
                                    <a href="<?=webhome?>taillog?file=dnsmasq">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> pihole.log
                                    </a>
                                </li>
                                <!-- Tail FTL.log -->
                                <li<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> class="active"<? end ?>>
                                    <a href="<?=webhome?>taillog?file=ftl">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> FTL.log
                                    </a>
                                </li>
                                <!-- Tail webserver.log -->
                                <li<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> class="active"<? end ?>>
                                    <a href="<?=webhome?>taillog?file=webserver">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> webserver.log
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Update Gravity -->
                        <li<? if scriptname == 'gravity' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>gravity">
                                <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> <span>Update Gravity</span>
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li<? if scriptname == 'search' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>search">
                                <i class="fa fa-fw menu-icon fa-search"></i> <span>Search Lists</span>
                            </a>
                        </li>
                        <!-- Interfaces -->
                        <li<? if scriptname == 'interfaces' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>interfaces">
                                <i class="fa fa-fw menu-icon fa-wifi"></i> <span>Interfaces</span>
                            </a>
                        </li>
                        <!-- Network -->
                        <li<? if scriptname == 'network' then ?> class="active"<? end ?>>
                            <a href="<?=webhome?>network">
                                <i class="fa fa-fw menu-icon fa-network-wired"></i> <span>Network</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Donate button -->
                <li class="header text-uppercase">Donate</li>
                <li class="menu-donate">
                    <a href="https://pi-hole.net/donate/" rel="noopener noreferrer" target="_blank">
                        <i class="fas fa-fw menu-icon fa-donate"></i> <span>Donate</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
