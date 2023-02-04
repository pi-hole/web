
    <!-- Left side column. contains the logo and sidebar -->
    <aside class="main-sidebar">
        <!-- sidebar: style can be found in sidebar.less -->
        <section class="sidebar">
            <!-- Sidebar user panel -->
            <div class="user-panel">
                <div class="pull-left image">
                    <img src="img/logo.svg" alt="Pi-hole logo">
                </div>
                <div class="pull-left info">
                    <p>Status</p>
                    <span id="status"></span>
                    <span id="temperature"></span><br/>
                    <span id="cpu"></span><br/>
                    <span id="memory"></span>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <ul class="sidebar-menu" data-widget="tree">
                <li class="header text-uppercase">Main</li>
                <!-- Home Page -->
                <li class="menu-main<?php if ($scriptname === 'index.php') { ?> active<?php } ?>">
                    <a href="index.php">
                        <i class="fa fa-fw menu-icon fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>

                <li class="header text-uppercase">Analysis</li>
                <!-- Query Log -->
                <li class="menu-analysis<?php if ($scriptname === 'queries.php') { ?> active<?php } ?>">
                    <a href="queries.php">
                        <i class="fa fa-fw menu-icon fa-file-alt"></i> <span>Query Log</span>
                    </a>
                </li>
                <!-- Long-term database -->
                <li class="menu-analysis treeview<?php if ($scriptname === 'db_lists.php' || $scriptname === 'db_graph.php') { ?> active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-history"></i> <span>Long-term Data</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li class="<?php if ($scriptname === 'db_graph.php') { ?> active<?php } ?>">
                            <a href="db_graph.php">
                                <i class="fa fa-fw menu-icon fa-chart-bar"></i> Graphics
                            </a>
                        </li>
                        <li class="<?php if ($scriptname === 'db_lists.php') { ?> active<?php } ?>">
                            <a href="db_lists.php">
                                <i class="fa fa-fw menu-icon fa-list"></i> Top Lists
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li class="menu-group<?php if ($scriptname === 'groups.php') { ?> active<?php } ?>">
                    <a href="groups.php">
                        <i class="fa fa-fw menu-icon fa-user-friends"></i> <span>Groups
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_groups" title="Number of defined groups"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<?php if ($scriptname === 'groups-clients.php') { ?> active<?php } ?>">
                    <a href="groups-clients.php">
                        <i class="fa fa-fw menu-icon fa-laptop"></i> <span>Clients
                        <span class="pull-right-container">
                            <span class="label label-primary pull-right" id="num_clients" title="Number of defined clients"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<?php if ($scriptname === 'groups-domains.php') { ?> active<?php } ?>">
                    <a href="groups-domains.php">
                        <i class="fa fa-fw menu-icon fa-list"></i> <span>Domains
                        <span class="pull-right-container">
                            <span class="label bg-red pull-right" id="num_denied" title="Number of deny rules (domains and regex)"></span>
                            <span class="label bg-green pull-right" id="num_allowed" title="Number of allow rules (domains and regex)"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-group<?php if ($scriptname === 'groups-adlists.php') { ?> active<?php } ?>">
                    <a href="groups-adlists.php">
                        <i class="fa fa-fw menu-icon fa-shield-alt"></i> <span>Adlists
                        <span class="pull-right-container">
                            <span class="label bg-blue pull-right" id="num_lists" title="Number of defined adlists"></span>
                            <span class="label bg-yellow pull-right" id="num_gravity" title="Total number of domains blocked by your Pi-hole"></span>
                        </span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Local DNS Records -->
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="menu-dns treeview"<?php if ($pistatus == '0') { ?> hidden<?php } ?>>
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-stop"></i> <span>Disable Blocking&nbsp;&nbsp;&nbsp;<span id="flip-status-disable"></span></span>
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
                <li id="pihole-enable" class="menu-dns treeview"<?php if (!in_array($pistatus, array('0', '-1', '-2'))) { ?> hidden<?php } ?>>
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-play"></i>
                        <span id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <li class="menu-dns treeview <?php if (in_array($scriptname, array('dns_records.php', 'cname_records.php'))) { ?>active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-address-book"></i> <span>Local DNS</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li class="<?php if ($scriptname === 'dns_records.php') { ?> active<?php } ?>">
                            <a href="dns_records.php">
                                <i class="fa fa-fw menu-icon fa-address-book"></i> DNS Records
                            </a>
                        </li>
                        <li class="<?php if ($scriptname === 'cname_records.php') { ?> active<?php } ?>">
                            <a href="cname_records.php">
                                <i class="fa fa-fw menu-icon fa-address-book"></i> CNAME Records
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="header text-uppercase">System</li>
                <!-- Tools -->
                <li class="menu-system treeview<?php if (in_array($scriptname, array('messages.php', 'gravity.php', 'queryads.php', 'taillog.php', 'taillog-FTL.php', 'debug.php', 'network.php'))) { ?> active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                        <span class="warning-count hidden"></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li class="<?php if ($scriptname === 'messages.php') { ?> active<?php } ?>">
                            <a href="messages.php">
                                <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> Pi-hole diagnosis
                                <span class="pull-right-container warning-count hidden"></span>
                            </a>
                        </li>
                        <!-- Run gravity.sh -->
                        <li class="<?php if ($scriptname === 'gravity.php') { ?> active<?php } ?>">
                            <a href="gravity.php">
                                <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> Update Gravity
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li class="<?php if ($scriptname === 'queryads.php') { ?> active<?php } ?>">
                            <a href="queryads.php">
                                <i class="fa fa-fw menu-icon fa-search"></i> Search Adlists
                            </a>
                        </li>
                        <!-- Tail pihole.log -->
                        <li class="<?php if ($scriptname === 'taillog.php') { ?> active<?php } ?>">
                            <a href="taillog.php">
                                <svg class="svg-inline--fa fa-fw menu-icon" style="height: 1.25em"><use xlink:href="img/pihole_icon.svg#pihole-svg-logo"/></svg>
                                Tail pihole.log
                            </a>
                        </li>
                        <!-- Tail FTL.log -->
                        <li class="<?php if ($scriptname === 'taillog-FTL.php') { ?> active<?php } ?>">
                            <a href="taillog-FTL.php">
                                <svg class="svg-inline--fa fa-fw menu-icon" style="height: 1.25em"><use xlink:href="img/pihole_icon.svg#pihole-svg-logo"/></svg>
                                Tail FTL.log
                            </a>
                        </li>
                        <!-- Generate debug log -->
                        <li class="<?php if ($scriptname === 'debug.php') { ?> active<?php } ?>">
                            <a href="debug.php">
                                <i class="fa fa-fw menu-icon fa-ambulance"></i> Generate debug log
                            </a>
                        </li>
                        <!-- Network -->
                        <li class="<?php if ($scriptname === 'network.php') { ?> active<?php } ?>">
                            <a href="network.php">
                                <i class="fa fa-fw menu-icon fa-network-wired"></i> Network
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Settings -->
                <li class="menu-system<?php if ($scriptname === 'settings.php') { ?> active<?php } ?>">
                    <a href="settings.php">
                        <i class="fa fa-fw menu-icon fa-cog"></i> <span>Settings</span>
                    </a>
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
