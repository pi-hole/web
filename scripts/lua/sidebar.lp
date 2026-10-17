<? --[[
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/ ]]-- ?>
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="app-sidebar bg-body-tertiary shadow" data-bs-theme="dark">
        <div class="sidebar-brand">
            <a href="<?=webhome?>" class="brand-link">
                <span class="brand-text fw-light">Pi-<strong>hole</strong></span>
            </a>
        </div>
        <div class="sidebar-wrapper">
            <!-- Sidebar user panel -->
            <div class="user-panel">
                <div class="image">
                    <img class="logo-img" src="<?=webhome?>img/logo.svg" alt="Pi-hole logo" width="60" height="87">
                </div>
                <div class="info">
                    <p>Status</p>
                    <span id="status"></span><br>
                    <span id="query_frequency"></span><br>
                    <span id="cpu"></span><br>
                    <span id="memory"></span>
                </div>
            </div>
            <!-- sidebar menu -->
            <nav class="mt-2" aria-label="Main navigation">
                <ul class="nav sidebar-menu flex-column" data-lte-toggle="treeview" data-accordion="false" id="sidebar-navigation">
                    <li class="nav-header text-uppercase">Main</li>
                    <!-- Home Page -->
                    <li class="nav-item">
                        <a href="<?=webhome?>" class="nav-link<? if scriptname == 'index' or scriptname == 'index.lp' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-home"></i> <p>Dashboard</p>
                        </a>
                    </li>
                    <!-- Query Log -->
                    <li class="nav-item">
                        <a href="<?=webhome?>queries" class="nav-link<? if scriptname == 'queries' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-file-alt"></i> <p>Query Log</p>
                        </a>
                    </li>

                    <li class="nav-header text-uppercase">Group Management</li>
                    <!-- Group Management -->
                    <li class="nav-item">
                        <a href="<?=webhome?>groups" class="nav-link<? if scriptname == 'groups' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-user-friends"></i>
                            <p>Groups
                                <span class="nav-badge badge text-bg-primary float-end" id="num_groups" title="Number of enabled groups"></span>
                            </p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?=webhome?>groups/clients" class="nav-link<? if scriptname == 'groups/clients' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-laptop"></i>
                            <p>Clients
                                <span class="nav-badge badge text-bg-primary float-end" id="num_clients" title="Number of defined clients"></span>
                            </p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?=webhome?>groups/domains" class="nav-link<? if scriptname == 'groups/domains' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-list"></i>
                            <p>Domains
                                <span class="nav-badge">
                                    <span class="badge text-bg-danger float-end" id="num_denied" title="Number of enabled deny rules (domains and regex)"></span>
                                    <span class="badge text-bg-success float-end me-1" id="num_allowed" title="Number of enabled allow rules (domains and regex)"></span>
                                </span>
                            </p>
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="<?=webhome?>groups/lists" class="nav-link<? if scriptname == 'groups/lists' then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-shield-alt"></i>
                            <p>Lists
                                <span class="nav-badge">
                                    <span class="badge text-bg-primary float-end" id="num_lists" title="Number of subscribed and enabled lists"></span>
                                    <span class="badge text-bg-warning float-end me-1" id="num_gravity" title="Total number of domains subscribed by your Pi-hole"></span>
                                </span>
                            </p>
                        </a>
                    </li>

                    <li class="nav-header text-uppercase">DNS Control</li>
                    <!-- Enable/Disable Blocking -->
                    <li id="pihole-disable" class="nav-item">
                        <a href="#" class="nav-link">
                            <i class="nav-icon fa fa-fw fa-stop"></i> <p>Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span>
                            <i class="nav-arrow fa fa-angle-left"></i></p>
                        </a>
                        <ul class="nav nav-treeview">
                            <li class="nav-item">
                                <a href="#" id="pihole-disable-indefinitely" class="nav-link">
                                    <i class="nav-icon fa fa-fw fa-infinity"></i> <p>Indefinitely</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" id="pihole-disable-10s" class="nav-link">
                                    <i class="nav-icon fa fa-fw fa-clock"></i> <p>For 10 seconds</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" id="pihole-disable-30s" class="nav-link">
                                    <i class="nav-icon fa fa-fw fa-clock"></i> <p>For 30 seconds</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" id="pihole-disable-5m" class="nav-link">
                                    <i class="nav-icon fa fa-fw fas fa-clock"></i> <p>For 5 minutes</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" id="pihole-disable-cst" class="nav-link" data-bs-toggle="modal" data-bs-target="#customDisableModal">
                                    <i class="nav-icon fa fa-fw fa-user-clock"></i> <p>Custom time</p>
                                </a>
                            </li>
                        </ul>
                        <!-- <a href="#" id="flip-status"><i class="fa fa-stop"></i> <span>Disable</span></a> -->
                    </li>
                    <li id="pihole-enable" class="nav-item" style="display: none;">
                        <a href="#" class="nav-link">
                            <i class="nav-icon fa fa-fw fa-play"></i>
                            <p id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                                <span id="flip-status-enable"></span>
                            </p>
                        </a>
                    </li>
                    <li class="nav-header text-uppercase">System</li>
                    <!-- Settings -->
                    <li class="nav-item<? if startsWith(scriptname, 'settings/') then ?> menu-open<? end ?>">
                        <a href="#" class="nav-link<? if startsWith(scriptname, 'settings/') then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-cogs"></i> <p>Settings
                            <i class="nav-arrow fa fa-angle-left"></i></p>
                        </a>
                        <ul class="nav nav-treeview">
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/system" class="nav-link<? if scriptname == 'settings/system' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-circle-info"></i> <p>System</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/dns" class="nav-link<? if scriptname == 'settings/dns' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-book-atlas"></i> <p>DNS</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/dhcp" class="nav-link<? if scriptname == 'settings/dhcp' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-sitemap"></i> <p>DHCP</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/api" class="nav-link<? if scriptname == 'settings/api' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-window-restore"></i> <p>Web interface / API</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/privacy" class="nav-link<? if scriptname == 'settings/privacy' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-binoculars"></i> <p>Privacy</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/teleporter" class="nav-link<? if scriptname == 'settings/teleporter' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-file-export"></i> <p>Teleporter</p>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="<?=webhome?>settings/dnsrecords" class="nav-link<? if scriptname == 'settings/dnsrecords' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-address-book"></i> <p>Local DNS Records</p>
                                </a>
                            </li>
                            <li class="nav-item settings-level-expert d-none">
                                <a href="<?=webhome?>settings/all" class="nav-link<? if scriptname == 'settings/all' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-pen-to-square"></i> <p>All settings</p>
                                </a>
                            </li>
                        </ul>
                    </li>
                    <!-- Tools -->
                    <li class="nav-item<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> menu-open<? end ?>">
                        <a href="#" class="nav-link<? if in_array(scriptname, {'messages', 'gravity', 'search', 'taillog', 'interfaces', 'network'}) then ?> active<? end ?>">
                            <i class="nav-icon fa fa-fw fa-tools"></i> <p>Tools
                            <span class="warning-count hidden"></span>
                            <i class="nav-arrow fa fa-angle-left"></i></p>
                        </a>
                        <ul class="nav nav-treeview">
                            <!-- Pi-hole diagnosis -->
                            <li class="nav-item">
                                <a href="<?=webhome?>messages" class="nav-link<? if scriptname == 'messages' then ?> active<? end ?>">
                                    <i class="nav-icon fa fa-fw fa-file-medical-alt"></i> <p>Pi-hole diagnosis
                                    <span class="warning-count hidden"></span></p>
                                </a>
                            </li>
                            <!-- Tail log files -->
                            <li class="nav-item<? if scriptname == 'taillog' then ?> menu-open<? end ?>">
                                <a href="#" class="nav-link<? if scriptname == 'taillog' then ?> active<? end ?>">
                                    <i class="nav-icon fa-fw fa-solid fa-list-ul"></i> <p>Tail log files
                                    <i class="nav-arrow fa fa-angle-left"></i></p>
                                </a>
                                <ul class="nav nav-treeview">
                                    <!-- Tail pihole.log -->
                                    <li class="nav-item">
                                        <a href="<?=webhome?>taillog?file=dnsmasq" class="nav-link<? if scriptname == 'taillog' and GET("file") == "dnsmasq" then ?> active<? end ?>">
                                            <i class="nav-icon fa-fw fa-solid fa-list-ul"></i> <p>pihole.log</p>
                                        </a>
                                    </li>
                                    <!-- Tail FTL.log -->
                                    <li class="nav-item">
                                        <a href="<?=webhome?>taillog?file=ftl" class="nav-link<? if scriptname == 'taillog' and GET("file") == "ftl" then ?> active<? end ?>">
                                            <i class="nav-icon fa-fw fa-solid fa-list-ul"></i> <p>FTL.log</p>
                                        </a>
                                    </li>
                                    <!-- Tail webserver.log -->
                                    <li class="nav-item">
                                        <a href="<?=webhome?>taillog?file=webserver" class="nav-link<? if scriptname == 'taillog' and GET("file") == "webserver" then ?> active<? end ?>">
                                            <i class="nav-icon fa-fw fa-solid fa-list-ul"></i> <p>webserver.log</p>
                                        </a>
                                    </li>
                                </ul>
                            </li>
                            <!-- Update Gravity -->
                            <li class="nav-item">
                                <a href="<?=webhome?>gravity" class="nav-link<? if scriptname == 'gravity' then ?> active<? end ?>">
                                    <i class="nav-icon fa fa-fw fa-arrow-circle-down"></i> <p>Update Gravity</p>
                                </a>
                            </li>
                            <!-- Query Lists -->
                            <li class="nav-item">
                                <a href="<?=webhome?>search" class="nav-link<? if scriptname == 'search' then ?> active<? end ?>">
                                    <i class="nav-icon fa fa-fw fa-search"></i> <p>Search Lists</p>
                                </a>
                            </li>
                            <!-- Interfaces -->
                            <li class="nav-item">
                                <a href="<?=webhome?>interfaces" class="nav-link<? if scriptname == 'interfaces' then ?> active<? end ?>">
                                    <i class="nav-icon fa fa-fw fa-wifi"></i> <p>Interfaces</p>
                                </a>
                            </li>
                            <!-- Network -->
                            <li class="nav-item">
                                <a href="<?=webhome?>network" class="nav-link<? if scriptname == 'network' then ?> active<? end ?>">
                                    <i class="nav-icon fa fa-fw fa-network-wired"></i> <p>Network</p>
                                </a>
                            </li>
                        </ul>
                    </li>

                    <!-- Donate button -->
                    <li class="nav-header text-uppercase">Donate</li>
                    <li class="nav-item">
                        <a href="https://pi-hole.net/donate/" rel="noopener noreferrer" target="_blank" class="nav-link">
                            <i class="nav-icon fas fa-fw fa-donate"></i> <p>Donate</p>
                        </a>
                    </li>
                </ul>
            </nav>
        </div>
    </aside>
