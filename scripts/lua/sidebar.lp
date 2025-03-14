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
                    <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole logo" width="52" height="75">
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
                        <em class="fa fa-fw menu-icon fa-home"></em> <span>Dashboard</span>
                    </a>
                </li>
                <!-- Query Log -->
                <li class="menu-analysis<? if scriptname == 'queries' then ?> active<? end ?>">
                    <a href="<?=webhome?>queries">
                        <em class="fa fa-fw menu-icon fa-file-alt"></em> <span>Query Log</span>
                    </a>
                </li>

                <li class="header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li class="menu-group<? if scriptname == 'groups' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups">
                        <em class="fa fa-fw menu-icon fa-user-friends"></em> <span>Groups</span>
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_groups" title="Number of enabled groups"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/clients">
                        <em class="fa fa-fw menu-icon fa-laptop"></em> <span>Clients</span>
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_clients" title="Number of defined clients"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/domains">
                        <em class="fa fa-fw menu-icon fa-list"></em> <span>Domains</span>
                        <span class="pull-right-container">
                            <span class="label bg-red pull-right" id="num_denied" title="Number of enabled deny rules (domains and regex)"></span>
                            <span class="label bg-green pull-right" id="num_allowed" title="Number of enabled allow rules (domains and regex)"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/lists">
                        <em class="fa fa-fw menu-icon fa-shield-alt"></em> <span>Lists</span>
                        <span class="pull-right-container">
                            <span class="label bg-blue pull-right" id="num_lists" title="Number of subscribed and enabled lists"></span>
                            <span class="label bg-yellow pull-right" id="num_gravity" title="Total number of domains subscribed by your Pi-hole"></span>
                        </span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Local DNS Records -->
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="menu-dns treeview">
                    <a href="<?=webhome?>#">
                        <em class="fa fa-fw menu-icon fa-stop"></em> <span>Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span></span>
                        <span class="pull-right-container">
                            <em class="fa fa-angle-left pull-right"></em>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-indefinitely">
                                <em class="fa fa-fw menu-icon fa-infinity"></em> Indefinitely
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-10s">
                                <em class="fa fa-fw menu-icon fa-clock"></em> For 10 seconds
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-30s">
                                <em class="fa fa-fw menu-icon fa-clock"></em> For 30 seconds
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-5m">
                                <em class="fa fa-fw menu-icon fas fa-clock"></em> For 5 minutes
                            </a>
                        </li>
                        <li>
                            <a href="<?=webhome?>#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal">
                                <em class="fa fa-fw menu-icon fa-user-clock"></em> Custom time
                            </a>
                        </li>
                    </ul>
                    <!-- <a href="<?=webhome?>#" id="flip-status"><em class="fa fa-stop"></em> <span>Disable</span></a> -->
                </li>
                <li id="pihole-enable" class="menu-dns treeview" style="display: none;">
                    <a href="<?=webhome?>#">
                        <em class="fa fa-fw menu-icon fa-play"></em>
                        <span id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <li class="header text-uppercase">System</li>
                <!-- Settings -->
                <li class="menu-system treeview <? if startsWith(scriptname, 'settings/') then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <em class="fa fa-fw menu-icon fa-cogs"></em> <span>Settings</span>
                        <span class="pull-right-container">
                            <em class="fa fa-angle-left pull-right"></em>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li class="<? if scriptname == 'settings/system' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/system">
                                <em class="fa-fw menu-icon fa-solid fa-circle-info"></em> <span>System</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dns' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dns">
                                <em class="fa-fw menu-icon fa-solid fa-book-atlas"></em> <span>DNS</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dhcp' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dhcp">
                                <em class="fa-fw menu-icon fa-solid fa-sitemap"></em> <span>DHCP</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/api' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/api">
                                <em class="fa-fw menu-icon fa-solid fa-window-restore"></em> <span>Web interface / API</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/privacy' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/privacy">
                                <em class="fa-fw menu-icon fa-solid fa-binoculars"></em> <span>Privacy</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/teleporter' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/teleporter">
                                <em class="fa-fw menu-icon fa-solid fa-file-export"></em> <span>Teleporter</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/dnsrecords' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dnsrecords">
                                <em class="fa-fw menu-icon fa-solid fa-address-book"></em> <span>Local DNS Records</span>
                            </a>
                        </li>
                        <li class="<? if scriptname == 'settings/all' then ?> active<? end ?> settings-level-expert">
                            <a href="<?=webhome?>settings/all">
                                <em class="fa-fw menu-icon fa-solid fa-pen-to-square"></em> <span>All settings</span>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Tools -->
                <li class="menu-system treeview<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> active<? end ?>">
                    <a href="<?=webhome?>#">
                        <em class="fa fa-fw menu-icon fa-tools"></em> <span>Tools</span>
                        <span class="warning-count hidden"></span>
                        <span class="pull-right-container">
                            <em class="fa fa-angle-left pull-right"></em>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li class="<? if scriptname == 'messages' then ?> active<? end ?>">
                            <a href="<?=webhome?>messages">
                                <em class="fa fa-fw menu-icon fa-file-medical-alt"></em> <span>Pi-hole diagnosis</span>
                                <span class="pull-right-container warning-count hidden"></span>
                            </a>
                        </li>
                        <!-- Tail log files -->
                        <li class="treeview <? if scriptname == 'taillog' then ?> active<? end ?>">
                            <a href="<?=webhome?>#">
                                <em class="fa-fw menu-icon fa-solid fa-list-ul"></em> <span>Tail log files</span>
                                <span class="pull-right-container">
                                    <em class="fa fa-angle-left pull-right"></em>
                                </span>
                            </a>
                            <ul class="treeview-menu">
                                <!-- Tail pihole.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=dnsmasq">
                                        <em class="fa-fw menu-icon fa-solid fa-list-ul"></em> pihole.log
                                    </a>
                                </li>
                                <!-- Tail FTL.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=ftl">
                                        <em class="fa-fw menu-icon fa-solid fa-list-ul"></em> FTL.log
                                    </a>
                                </li>
                                <!-- Tail webserver.log -->
                                <li class="<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=webserver">
                                        <em class="fa-fw menu-icon fa-solid fa-list-ul"></em> webserver.log
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Run gravity.sh -->
                        <li class="<? if scriptname == 'gravity' then ?> active<? end ?>">
                            <a href="<?=webhome?>gravity">
                                <em class="fa fa-fw menu-icon fa-arrow-circle-down"></em> <span>Update Gravity</span>
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li class="<? if scriptname == 'search' then ?> active<? end ?>">
                            <a href="<?=webhome?>search">
                                <em class="fa fa-fw menu-icon fa-search"></em> <span>Search Lists</span>
                            </a>
                        </li>
                        <!-- Interfaces -->
                        <li class="<? if scriptname == 'interfaces' then ?> active<? end ?>">
                            <a href="<?=webhome?>interfaces">
                                <em class="fa fa-fw menu-icon fa-wifi"></em> <span>Interfaces</span>
                            </a>
                        </li>
                        <!-- Network -->
                        <li class="<? if scriptname == 'network' then ?> active<? end ?>">
                            <a href="<?=webhome?>network">
                                <em class="fa fa-fw menu-icon fa-network-wired"></em> <span>Network</span>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Donate button -->
                <li class="header text-uppercase">Donate</li>
                <li class="menu-donate">
                    <a href="https://pi-hole.net/donate/" target="_blank">
                        <em class="fas fa-fw menu-icon fa-donate"></em> <span>Donate</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
