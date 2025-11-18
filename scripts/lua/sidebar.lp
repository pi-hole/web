<? --[[
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/ ]]-- ?>
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="main-sidebar sidebar-dark-primary elevation-4">
        <!-- Brand Logo -->
        <a href="<?=webhome?>" class="brand-link">
            <span class="brand-text"><span style="font-weight: 300;">Pi-</span><strong>hole</strong></span>
        </a>

        <!-- Sidebar -->
        <div class="sidebar">
            <!-- Sidebar user panel -->
            <div class="user-panel mt-3 pb-3 mb-3 d-flex">
                <div class="image">
                    <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole logo" width="58" height="84">
                </div>
                <div class="info">
                    <p class="mb-1"><strong>Status</strong></p>
                    <span id="status" class="d-block"></span>
                    <span id="query_frequency" class="d-block"></span>
                    <span id="cpu" class="d-block"></span>
                    <span id="memory" class="d-block"></span>
                </div>
            </div>
            <nav class="mt-2">
            <ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
                <li class="nav-header text-uppercase">Main</li>
                <!-- Home Page -->
                <li class="nav-item menu-main<? if scriptname == 'index' or scriptname == 'index.lp' then ?> active<? end ?>">
                    <a href="<?=webhome?>" class="nav-link<? if scriptname == 'index' or scriptname == 'index.lp' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-home"></i>
                        <p>Dashboard</p>
                    </a>
                </li>
                <!-- Query Log -->
                <li class="nav-item menu-analysis<? if scriptname == 'queries' then ?> active<? end ?>">
                    <a href="<?=webhome?>queries" class="nav-link<? if scriptname == 'queries' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-file-alt"></i>
                        <p>Query Log</p>
                    </a>
                </li>

                <li class="nav-header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li class="nav-item menu-group<? if scriptname == 'groups' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups" class="nav-link<? if scriptname == 'groups' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-user-friends"></i>
                        <p>Groups
                            <span class="badge badge-primary right" id="num_groups" title="Number of enabled groups"></span>
                        </p>
                    </a>
                </li>
                <li class="nav-item menu-group<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/clients" class="nav-link<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-laptop"></i>
                        <p>Clients
                            <span class="badge badge-primary right" id="num_clients" title="Number of defined clients"></span>
                        </p>
                    </a>
                </li>
                <li class="nav-item menu-group<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/domains" class="nav-link<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-list"></i>
                        <p>Domains
                            <span class="badge badge-danger right" id="num_denied" title="Number of enabled deny rules (domains and regex)"></span>
                            <span class="badge badge-success right" id="num_allowed" title="Number of enabled allow rules (domains and regex)"></span>
                        </p>
                    </a>
                </li>
                <li class="nav-item menu-group<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                    <a href="<?=webhome?>groups/lists" class="nav-link<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                        <i class="nav-icon fa fa-shield-alt"></i>
                        <p>Lists
                            <span class="badge badge-primary right" id="num_lists" title="Number of subscribed and enabled lists"></span>
                            <span class="badge badge-warning right" id="num_gravity" title="Total number of domains subscribed by your Pi-hole"></span>
                        </p>
                    </a>
                </li>

                <li class="nav-header text-uppercase">DNS Control</li>
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="nav-item menu-dns has-treeview">
                    <a href="<?=webhome?>#" class="nav-link">
                        <i class="nav-icon fa fa-stop"></i>
                        <p>Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span>
                            <i class="right fas fa-angle-left"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item">
                            <a href="<?=webhome?>#" id="pihole-disable-indefinitely" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Indefinitely</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="<?=webhome?>#" id="pihole-disable-10s" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>For 10 seconds</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="<?=webhome?>#" id="pihole-disable-30s" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>For 30 seconds</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="<?=webhome?>#" id="pihole-disable-5m" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>For 5 minutes</p>
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="<?=webhome?>#" id="pihole-disable-cst" data-toggle="modal" data-target="#customDisableModal" class="nav-link">
                                <i class="far fa-circle nav-icon"></i>
                                <p>Custom time</p>
                            </a>
                        </li>
                    </ul>
                </li>
                <li id="pihole-enable" class="nav-item menu-dns" style="display: none;">
                    <a href="<?=webhome?>#" class="nav-link">
                        <i class="nav-icon fa fa-play"></i>
                        <p id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </p>
                    </a>
                </li>
                <li class="nav-header text-uppercase">System</li>
                <!-- Settings -->
                <li class="nav-item menu-system has-treeview<? if startsWith(scriptname, 'settings/') then ?> menu-open<? end ?>">
                    <a href="<?=webhome?>#" class="nav-link<? if startsWith(scriptname, 'settings/') then ?> active<? end ?>">
                        <i class="nav-icon fa fa-cogs"></i>
                        <p>Settings
                            <i class="right fas fa-angle-left"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <li class="nav-item<? if scriptname == 'settings/system' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/system" class="nav-link<? if scriptname == 'settings/system' then ?> active<? end ?>">
                                <i class="fa fa-circle-info nav-icon"></i>
                                <p>System</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/dns' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dns" class="nav-link<? if scriptname == 'settings/dns' then ?> active<? end ?>">
                                <i class="fa fa-book-atlas nav-icon"></i>
                                <p>DNS</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/dhcp' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dhcp" class="nav-link<? if scriptname == 'settings/dhcp' then ?> active<? end ?>">
                                <i class="fa fa-sitemap nav-icon"></i>
                                <p>DHCP</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/api' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/api" class="nav-link<? if scriptname == 'settings/api' then ?> active<? end ?>">
                                <i class="fa fa-window-restore nav-icon"></i>
                                <p>Web interface / API</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/privacy' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/privacy" class="nav-link<? if scriptname == 'settings/privacy' then ?> active<? end ?>">
                                <i class="fa fa-binoculars nav-icon"></i>
                                <p>Privacy</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/teleporter' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/teleporter" class="nav-link<? if scriptname == 'settings/teleporter' then ?> active<? end ?>">
                                <i class="fa fa-file-export nav-icon"></i>
                                <p>Teleporter</p>
                            </a>
                        </li>
                        <li class="nav-item<? if scriptname == 'settings/dnsrecords' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/dnsrecords" class="nav-link<? if scriptname == 'settings/dnsrecords' then ?> active<? end ?>">
                                <i class="fa fa-address-book nav-icon"></i>
                                <p>Local DNS Records</p>
                            </a>
                        </li>
                        <li class="nav-item settings-level-expert d-none<? if scriptname == 'settings/all' then ?> active<? end ?>">
                            <a href="<?=webhome?>settings/all" class="nav-link<? if scriptname == 'settings/all' then ?> active<? end ?>">
                                <i class="fa fa-pen-to-square nav-icon"></i>
                                <p>All settings</p>
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Tools -->
                <li class="nav-item menu-system has-treeview<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> menu-open<? end ?>">
                    <a href="<?=webhome?>#" class="nav-link<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> active<? end ?>">
                        <i class="nav-icon fa fa-tools"></i>
                        <p>Tools
                            <span class="warning-count hidden"></span>
                            <i class="right fas fa-angle-left"></i>
                        </p>
                    </a>
                    <ul class="nav nav-treeview">
                        <!-- Pi-hole diagnosis -->
                        <li class="nav-item<? if scriptname == 'messages' then ?> active<? end ?>">
                            <a href="<?=webhome?>messages" class="nav-link<? if scriptname == 'messages' then ?> active<? end ?>">
                                <i class="fa fa-file-medical-alt nav-icon"></i>
                                <p>Pi-hole diagnosis
                                    <span class="warning-count hidden"></span>
                                </p>
                            </a>
                        </li>
                        <!-- Tail log files -->
                        <li class="nav-item has-treeview<? if scriptname == 'taillog' then ?> menu-open<? end ?>">
                            <a href="<?=webhome?>#" class="nav-link<? if scriptname == 'taillog' then ?> active<? end ?>">
                                <i class="fa fa-list-ul nav-icon"></i>
                                <p>Tail log files
                                    <i class="right fas fa-angle-left"></i>
                                </p>
                            </a>
                            <ul class="nav nav-treeview">
                                <!-- Tail pihole.log -->
                                <li class="nav-item<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=dnsmasq" class="nav-link<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> active<? end ?>">
                                        <i class="fa fa-list-ul nav-icon"></i>
                                        <p>pihole.log</p>
                                    </a>
                                </li>
                                <!-- Tail FTL.log -->
                                <li class="nav-item<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=ftl" class="nav-link<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> active<? end ?>">
                                        <i class="fa fa-list-ul nav-icon"></i>
                                        <p>FTL.log</p>
                                    </a>
                                </li>
                                <!-- Tail webserver.log -->
                                <li class="nav-item<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> active<? end ?>">
                                    <a href="<?=webhome?>taillog?file=webserver" class="nav-link<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> active<? end ?>">
                                        <i class="fa fa-list-ul nav-icon"></i>
                                        <p>webserver.log</p>
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <!-- Update Gravity -->
                        <li class="nav-item<? if scriptname == 'gravity' then ?> active<? end ?>">
                            <a href="<?=webhome?>gravity" class="nav-link<? if scriptname == 'gravity' then ?> active<? end ?>">
                                <i class="fa fa-arrow-circle-down nav-icon"></i>
                                <p>Update Gravity</p>
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li class="nav-item<? if scriptname == 'search' then ?> active<? end ?>">
                            <a href="<?=webhome?>search" class="nav-link<? if scriptname == 'search' then ?> active<? end ?>">
                                <i class="fa fa-search nav-icon"></i>
                                <p>Search Lists</p>
                            </a>
                        </li>
                        <!-- Interfaces -->
                        <li class="nav-item<? if scriptname == 'interfaces' then ?> active<? end ?>">
                            <a href="<?=webhome?>interfaces" class="nav-link<? if scriptname == 'interfaces' then ?> active<? end ?>">
                                <i class="fa fa-wifi nav-icon"></i>
                                <p>Interfaces</p>
                            </a>
                        </li>
                        <!-- Network -->
                        <li class="nav-item<? if scriptname == 'network' then ?> active<? end ?>">
                            <a href="<?=webhome?>network" class="nav-link<? if scriptname == 'network' then ?> active<? end ?>">
                                <i class="fa fa-network-wired nav-icon"></i>
                                <p>Network</p>
                            </a>
                        </li>
                    </ul>
                </li>

                <!-- Donate button -->
                <li class="nav-header text-uppercase">Donate</li>
                <li class="nav-item menu-donate">
                    <a href="https://pi-hole.net/donate/" rel="noopener noreferrer" target="_blank" class="nav-link">
                        <i class="nav-icon fas fa-donate"></i>
                        <p>Donate</p>
                    </a>
                </li>
            </ul>
            </nav>
        </div>
        <!-- /.sidebar -->
    </aside>
