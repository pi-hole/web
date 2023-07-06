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
                    <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole logo">
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <span id="status"></span><br/>
                    <span id="temperature"></span><br/>
                    <span id="cpu"></span><br/>
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
                        <i class="fa fa-fw menu-icon fa-user-friends"></i> <span>Groups
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_groups" title="Number of defined groups"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/clients">
                        <i class="fa fa-fw menu-icon fa-laptop"></i> <span>Clients
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_clients" title="Number of defined clients"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/domains">
                        <i class="fa fa-fw menu-icon fa-list"></i> <span>Domains
                        <span class="pull-right-container">
                            <span class="label bg-red pull-right" id="num_denied" title="Number of deny rules (domains and regex)"></span>
                            <span class="label bg-green pull-right" id="num_allowed" title="Number of allow rules (domains and regex)"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/lists">
                        <i class="fa fa-fw menu-icon fa-shield-alt"></i> <span>Lists
                        <span class="pull-right-container">
                            <span class="label bg-blue pull-right" id="num_lists" title="Number of subscribed lists"></span>
                            <span class="label bg-yellow pull-right" id="num_gravity" title="Total number of domains subscribed by your Pi-hole"></span>
                        </span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Local DNS Records -->
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="menu-dns treeview">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-stop"></i> <span>Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span></span>
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
                <li id="pihole-enable" class="menu-dns treeview" style="display: none;">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-play"></i>
                        <span id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <li class="header text-uppercase">System</li>
                <!-- Settings -->
                <li class="menu-system treeview <? if startsWith(scriptname, 'settings/') then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-cogs"></i> <span>Settings</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li class="<? if scriptname == 'settings/system' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/system">
                                <i class="fa-fw menu-icon fa-solid fa-circle-info"></i> <span>System</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dns' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dns">
                                <i class="fa-fw menu-icon fa-solid fa-book-atlas"></i> <span>DNS</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dhcp' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dhcp">
                                <i class="fa-fw menu-icon fa-solid fa-sitemap"></i> <span>DHCP</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/api' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/api">
                                <i class="fa-fw menu-icon fa-solid fa-window-restore"></i> <span>Web interface / API</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/privacy' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/privacy">
                                <i class="fa-fw menu-icon fa-solid fa-binoculars"></i> <span>Privacy</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/teleporter' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/teleporter">
                                <i class="fa-fw menu-icon fa-solid fa-file-export"></i> <span>Teleporter</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dnsrecords' then ?> active<? end ?> settings-level-1">
                            <a href="<?=webhome?>settings/dnsrecords">
                                <i class="fa-fw menu-icon fa-solid fa-address-book"></i> <span>Local DNS Records</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/advanced' then ?> active<? end ?> settings-level-2">
                            <a href="<?=webhome?>settings/advanced">
                                <i class="fa-fw menu-icon fa-solid fa-pen-to-square"></i> <span>All settings</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Tools -->
                <li class="menu-system treeview<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'network'}) then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                        <span class="warning-count hidden"></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li class="<? if scriptname == 'messages' then ?> active<? end ?>">
                            <a href="<?=webhome?>messages">
                                <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> <span>Pi-hole diagnosis</span>
                                <span class="pull-right-container warning-count hidden"></span>
                            </a>
                        </li>
                        <!-- Tail log files -->
                        <li class="treeview <? if scriptname == 'taillog' then ?> active<? end ?>">
                            <a href="<?=webhome?>#">
                                <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <span>Tail log files</span>
                                <span class="pull-right-container">
                                    <i class="fa fa-angle-left pull-right"></i>
                                </span>
                            </a>
                            <ul class="treeview-menu">
                                <!-- Tail pihole.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=dnsmasq">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> pihole.log
                                    </a>
                                </li>
                                <!-- Tail FTL.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=ftl">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> FTL.log
                                    </a>
                                </li>
                                <!-- Tail webserver.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=webserver">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> webserver.log
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Run gravity.sh -->
                        <li class="<? if scriptname == 'gravity' then ?> active<? end ?>">
                            <a href="<?=webhome?>gravity">
                                <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> <span>Update Gravity</span>
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li class="<? if scriptname == 'search' then ?> active<? end ?>">
                            <a href="<?=webhome?>search">
                                <i class="fa fa-fw menu-icon fa-search"></i> <span>Search Adlists</span>
                            </a>
                        </li>
                        <!-- Network -->
                        <li class="<? if scriptname == 'network' then ?> active<? end ?>">
                            <a href="<?=webhome?>network">
                                <i class="fa fa-fw menu-icon fa-network-wired"></i> <span>Network</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Donate button -->
                <li class="header text-uppercase">Donate</li>
                <li class="menu-donate">
                    <a href="https://pi-hole.net/donate/" target="_blank">
                        <i class="fas fa-fw menu-icon fa-donate"></i> <span>Donate</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
