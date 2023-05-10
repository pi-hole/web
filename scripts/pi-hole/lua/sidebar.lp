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
                    <img class="logo-img" src="img/logo.svg" alt="Pi-hole logo">
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
                <li class="menu-main<? if scriptname == 'index.lp' then mg.write(" active") end ?>">
                    <a href="index.lp">
                        <i class="fa fa-fw menu-icon fa-home"></i> <span class="text-green">Dashboard</span>
                    </a>
                </li>
                <!-- Query Log -->
                <li class="menu-analysis<? if scriptname == 'queries.lp' then mg.write(" active") end ?>">
                    <a href="queries.lp">
                        <i class="fa fa-fw menu-icon fa-file-alt"></i> <span class="text-green">Query Log</span>
                    </a>
                </li>

                <li class="header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li class="menu-group<? if scriptname == 'groups.lp' then mg.write(" active") end ?>">
                    <a href="groups.lp">
                        <i class="fa fa-fw menu-icon fa-user-friends"></i> <span class="text-green">Groups
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_groups" title="Number of defined groups"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups-clients.lp' then mg.write(" active") end ?>">
                    <a href="groups-clients.lp">
                        <i class="fa fa-fw menu-icon fa-laptop"></i> <span class="text-green">Clients
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_clients" title="Number of defined clients"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups-domains.lp' then mg.write(" active") end ?>">
                    <a href="groups-domains.lp">
                        <i class="fa fa-fw menu-icon fa-list"></i> <span class="text-green">Domains
                        <span class="pull-right-container">
                            <span class="label bg-red pull-right" id="num_denied" title="Number of deny rules (domains and regex)"></span>
                            <span class="label bg-green pull-right" id="num_allowed" title="Number of allow rules (domains and regex)"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups-adlists.lp' then mg.write(" active") end ?>">
                    <a href="groups-adlists.lp">
                        <i class="fa fa-fw menu-icon fa-shield-alt"></i> <span class="text-green">Adlists
                        <span class="pull-right-container">
                            <span class="label bg-blue pull-right" id="num_lists" title="Number of defined adlists"></span>
                            <span class="label bg-yellow pull-right" id="num_gravity" title="Total number of domains blocked by your Pi-hole"></span>
                        </span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Local DNS Records -->
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="menu-dns treeview">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-stop"></i> <span class="text-green">Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li>
                            <a href="#" id="pihole-disable-indefinitely">
                                <i class="fa fa-fw menu-icon fa-infinity"></i> Indefinitely
                            </a>
                        </li>
                        <li>
                            <a href="#" id="pihole-disable-10s">
                                <i class="fa fa-fw menu-icon fa-clock"></i> For 10 seconds
                            </a>
                        </li>
                        <li>
                            <a href="#" id="pihole-disable-30s">
                                <i class="fa fa-fw menu-icon fa-clock"></i> For 30 seconds
                            </a>
                        </li>
                        <li>
                            <a href="#" id="pihole-disable-5m">
                                <i class="fa fa-fw menu-icon fas fa-clock"></i> For 5 minutes
                            </a>
                        </li>
                        <li>
                            <a href="#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal">
                                <i class="fa fa-fw menu-icon fa-user-clock"></i> Custom time
                            </a>
                        </li>
                    </ul>
                    <!-- <a href="#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="menu-dns treeview" style="display: none;">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-play"></i>
                        <span id="enableLabel" class="text-green">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <li class="header text-uppercase">System</li>
                <!-- Settings -->
                <li class="menu-system treeview <? if startsWith(scriptname, 'settings-') then mg.write(" active") end ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-cogs"></i> <span>Settings</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li class="<? if scriptname == 'settings-system.lp' then mg.write(" active") end ?>">
                            <a href="settings-system.lp">
                                <i class="fa-fw menu-icon fa-solid fa-circle-info"></i> <span class="text-green">System</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-dns.lp' then mg.write(" active") end ?>">
                            <a href="settings-dns.lp">
                                <i class="fa-fw menu-icon fa-solid fa-book-atlas"></i> <span class="text-green">DNS</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-dhcp.lp' then mg.write(" active") end ?>">
                            <a href="settings-dhcp.lp">
                                <i class="fa-fw menu-icon fa-solid fa-sitemap"></i> <span class="text-green">DHCP</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-api.lp' then mg.write(" active") end ?>">
                            <a href="settings-api.lp">
                                <i class="fa-fw menu-icon fa-solid fa-window-restore"></i> <span class="text-green">Web interface / API</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-privacy.lp' then mg.write(" active") end ?>">
                            <a href="settings-privacy.lp">
                                <i class="fa-fw menu-icon fa-solid fa-binoculars"></i> <span class="text-green">Privacy</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-advanced.lp' then mg.write(" active") end ?> settings-level-2">
                            <a href="settings-advanced.lp">
                                <i class="fa-fw menu-icon fa-solid fa-pen-to-square"></i> <span class="text-green">Advanced</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-teleporter.lp' then mg.write(" active") end ?>">
                            <a href="settings-teleporter.lp">
                                <i class="fa-fw menu-icon fa-solid fa-file-export"></i> <span class="text-green">Teleporter</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings-dns-records.lp' then mg.write(" active") end ?>">
                            <a href="settings-dns-records.lp">
                                <i class="fa-fw menu-icon fa-solid fa-address-book"></i> <span class="text-green">Local DNS Records</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Tools -->
                <li class="menu-system treeview<? if in_array(scriptname, {'messages.lp', 'gravity.lp', 'search.lp', 'taillog.lp', 'network.lp'}) then mg.write(" active") end ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                        <span class="warning-count hidden"></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li class="<? if scriptname == 'messages.lp' then mg.write(" active") end ?>">
                            <a href="messages.lp">
                                <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> <span class="text-green">Pi-hole diagnosis</span>
                                <span class="pull-right-container warning-count hidden"></span>
                            </a>
                        </li>
                        <!-- Tail log files -->
                        <li class="treeview <? if scriptname == 'taillog.lp' then mg.write(" active") end ?>">
                            <a href="#">
                                <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <span class="text-green">Tail log files</span>
                                <span class="pull-right-container">
                                    <i class="fa fa-angle-left pull-right"></i>
                                </span>
                            </a>
                            <ul class="treeview-menu">
                                <!-- Tail pihole.log -->
                                <li class="<? if scriptname == 'taillog.lp' and GET("file") == "dnsmasq" then mg.write(" active") end ?>">
                                    <a href="taillog.lp?file=dnsmasq">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <code>pihole.log</code>
                                    </a>
                                </li>
                                <!-- Tail FTL.log -->
                                <li class="<? if scriptname == 'taillog.lp' and GET("file") == "ftl" then mg.write(" active") end ?>">
                                    <a href="taillog.lp?file=ftl">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <code>FTL.log</code>
                                    </a>
                                </li>
                                <!-- Tail webserver.log -->
                                <li class="<? if scriptname == 'taillog.lp' and GET("file") == "webserver" then mg.write(" active") end ?>">
                                    <a href="taillog.lp?file=webserver">
                                        <i class="fa-fw menu-icon fa-solid fa-list-ul"></i> <code>webserver.log</code>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Run gravity.sh -->
                        <li class="<? if scriptname == 'gravity.lp' then mg.write(" active") end ?>">
                            <a href="gravity.lp">
                                <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> <span class="text-green">Update Gravity</span>
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li class="<? if scriptname == 'search.lp' then mg.write(" active") end ?>">
                            <a href="search.lp">
                                <i class="fa fa-fw menu-icon fa-search"></i> <span class="text-green">Search Adlists</span>
                            </a>
                        </li>
                        <!-- Network -->
                        <li class="<? if scriptname == 'network.lp' then mg.write(" active") end ?>">
                            <a href="network.lp">
                                <i class="fa fa-fw menu-icon fa-network-wired"></i> <span class="text-green">Network</span>
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
