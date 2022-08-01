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
                    <?php
                    $pistatus = piholeStatus();
                    if ($pistatus == 53) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-green-light"></i> Active</span>';
                    } elseif ($pistatus == 0) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> Blocking disabled</span>';
                    } elseif ($pistatus == -1) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> DNS service not running</span>';
                    } elseif ($pistatus == -2) {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-red"></i> Unknown</span>';
                    } else {
                        echo '<span id="status"><i class="fa fa-w fa-circle text-orange"></i> DNS service on port '.$pistatus.'</span>';
                    }
                    ?>
                    <br/>
                    <?php
                    echo '<span title="Detected '.$nproc.' cores"><i class="fa fa-w fa-circle ';
                    if ($loaddata[0] > $nproc) {
                        echo "text-red";
                    } else {
                        echo "text-green-light";
                    }
                    echo '"></i> Load:&nbsp;&nbsp;' . $loaddata[0] . "&nbsp;&nbsp;" . $loaddata[1] . "&nbsp;&nbsp;". $loaddata[2] . "</span>";
                    ?>
                    <br/>
                    <?php
                    echo '<span><i class="fa fa-w fa-circle ';
                    if ($memory_usage > 0.75 || $memory_usage < 0.0) {
                        echo "text-red";
                    } else {
                        echo "text-green-light";
                    }
                    if($memory_usage > 0.0) {
                        echo '"></i> Memory usage:&nbsp;&nbsp;' . sprintf("%.1f",100.0*$memory_usage) . "&thinsp;%</span>";
                    } else {
                        echo '"></i> Memory usage:&nbsp;&nbsp; N/A</span>';
                    }
                    ?>
                    <br/>
                    <?php
                    if ($celsius >= -273.15) {
                        // Only show temp info if any data is available -->
                        $tempcolor = "text-vivid-blue";
                        if (isset($temperaturelimit) && $celsius > $temperaturelimit) {
                            $tempcolor = "text-red";
                        }
                        echo '<span id="temperature"><i class="fa fa-w fa-fire '.$tempcolor.'" style="width: 1em !important"></i> ';
                        echo 'Temp:&nbsp;<span id="rawtemp" hidden>' .$celsius. '</span>';
                        echo '<span id="tempdisplay"></span></span>';
                    }
                    ?>
                </div>
            </div>
            <!-- sidebar menu: : style can be found in sidebar.less -->
            <?php
            if(!$auth && (!isset($indexpage) || isset($_GET['login'])))
            {
                $scriptname = "login";
            }
            ?>
            <ul class="sidebar-menu" data-widget="tree">
                <li class="header text-uppercase">Main</li>
                <!-- Home Page -->
                <li<?php if($scriptname === "index.php"){ ?> class="active"<?php } ?>>
                    <a href="index.php">
                        <i class="fa fa-fw menu-icon fa-home"></i> <span>Dashboard</span>
                    </a>
                </li>
                <!-- Logout -->
                <?php
                // Show Logout button if $auth is set and authorization is required
                if(strlen($pwhash) > 0 && $auth) {
                ?>
                <li>
                    <a href="?logout">
                        <i class="fa fa-fw menu-icon fa-sign-out-alt"></i> <span>Logout</span>
                    </a>
                </li>
                <?php } ?>
                <!-- Login -->
                <?php
                // Show Login button if $auth is *not* set and authorization is required
                if(strlen($pwhash) > 0 && !$auth) {
                ?>
                <li<?php if($scriptname === "login"){ ?> class="active"<?php } ?>>
                    <a href="index.php?login">
                        <i class="fa fa-fw menu-icon fa-user"></i> <span>Login</span>
                    </a>
                </li>
                <?php } ?>
                <?php if($auth){ ?>

                <li class="header text-uppercase">Analysis</li>
                <!-- Query Log -->
                <li<?php if($scriptname === "queries.php"){ ?> class="active"<?php } ?>>
                    <a href="queries.php">
                        <i class="fa fa-fw menu-icon fa-file-alt"></i> <span>Query Log</span>
                    </a>
                </li>
                <!-- Long-term database -->
                <li class="treeview<?php if($scriptname === "db_queries.php" || $scriptname === "db_lists.php" || $scriptname === "db_graph.php"){ ?> active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-history"></i> <span>Long-term Data</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li<?php if($scriptname === "db_graph.php"){ ?> class="active"<?php } ?>>
                            <a href="db_graph.php">
                                <i class="fa fa-fw menu-icon fa-chart-bar"></i> Graphics
                            </a>
                        </li>
                        <li<?php if($scriptname === "db_queries.php"){ ?> class="active"<?php } ?>>
                            <a href="db_queries.php">
                                <i class="fa fa-fw menu-icon fa-file-alt"></i> Query Log
                            </a>
                        </li>
                        <li<?php if($scriptname === "db_lists.php"){ ?> class="active"<?php } ?>>
                            <a href="db_lists.php">
                                <i class="fa fa-fw menu-icon fa-list"></i> Top Lists
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="header text-uppercase">Group Management</li>
                <!-- Group Management -->
                <li<?php if($scriptname === "groups.php"){ ?> class="active"<?php } ?>>
                    <a href="groups.php">
                        <i class="fa fa-fw menu-icon fa-user-friends"></i> <span>Groups</span>
                    </a>
                </li>
                <li<?php if($scriptname === "groups-clients.php"){ ?> class="active"<?php } ?>>
                    <a href="groups-clients.php">
                        <i class="fa fa-fw menu-icon fa-laptop"></i> <span>Clients</span>
                    </a>
                </li>
                <li<?php if($scriptname === "groups-domains.php"){ ?> class="active"<?php } ?>>
                    <a href="groups-domains.php">
                        <i class="fa fa-fw menu-icon fa-list"></i> <span>Domains</span>
                    </a>
                </li>
                <li<?php if($scriptname === "groups-adlists.php"){ ?> class="active"<?php } ?>>
                    <a href="groups-adlists.php">
                        <i class="fa fa-fw menu-icon fa-shield-alt"></i> <span>Adlists</span>
                    </a>
                </li>

                <li class="header text-uppercase">DNS Control</li>
                <!-- Enable/Disable Blocking -->
                <li id="pihole-disable" class="treeview"<?php if ($pistatus == "0") { ?> hidden<?php } ?>>
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
                <li id="pihole-enable" class="treeview"<?php if (!in_array($pistatus,["0","-1","-2"])) { ?> hidden<?php } ?>>
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-play"></i>
                        <span id="enableLabel">Enable Blocking&nbsp;&nbsp;&nbsp;
                            <span id="flip-status-enable"></span>
                        </span>
                    </a>
                </li>
                <!-- Local DNS Records -->
                <li class="treeview <?php if(in_array($scriptname, array("dns_records.php", "cname_records.php"))){ ?>active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-address-book"></i> <span>Local DNS</span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <li<?php if($scriptname === "dns_records.php"){ ?> class="active"<?php } ?>>
                            <a href="dns_records.php">
                                <i class="fa fa-fw menu-icon fa-address-book"></i> DNS Records
                            </a>
                        </li>
                        <li<?php if($scriptname === "cname_records.php"){ ?> class="active"<?php } ?>>
                            <a href="cname_records.php">
                                <i class="fa fa-fw menu-icon fa-address-book"></i> CNAME Records
                            </a>
                        </li>
                    </ul>
                </li>

                <li class="header text-uppercase">System</li>
                <!-- Tools -->
                <li class="treeview<?php if (in_array($scriptname, array("messages.php", "gravity.php", "queryads.php", "auditlog.php", "taillog.php", "taillog-FTL.php", "debug.php", "network.php"))){ ?> active<?php } ?>">
                    <a href="#">
                        <i class="fa fa-fw menu-icon fa-tools"></i> <span>Tools</span>
                        <span class="warning-count hidden"></span>
                        <span class="pull-right-container">
                            <i class="fa fa-angle-left pull-right"></i>
                        </span>
                    </a>
                    <ul class="treeview-menu">
                        <!-- Pi-hole diagnosis -->
                        <li<?php if($scriptname === "messages.php"){ ?> class="active"<?php } ?>>
                            <a href="messages.php">
                                <i class="fa fa-fw menu-icon fa-file-medical-alt"></i> Pi-hole diagnosis
                                <span class="pull-right-container warning-count hidden"></span>
                            </a>
                        </li>
                        <!-- Run gravity.sh -->
                        <li<?php if($scriptname === "gravity.php"){ ?> class="active"<?php } ?>>
                            <a href="gravity.php">
                                <i class="fa fa-fw menu-icon fa-arrow-circle-down"></i> Update Gravity
                            </a>
                        </li>
                        <!-- Query Lists -->
                        <li<?php if($scriptname === "queryads.php"){ ?> class="active"<?php } ?>>
                            <a href="queryads.php">
                                <i class="fa fa-fw menu-icon fa-search"></i> Search Adlists
                            </a>
                        </li>
                        <!-- Audit log -->
                        <li<?php if($scriptname === "auditlog.php"){ ?> class="active"<?php } ?>>
                            <a href="auditlog.php">
                                <i class="fa fa-fw menu-icon fa-balance-scale"></i> Audit log
                            </a>
                        </li>
                        <!-- Tail pihole.log -->
                        <li<?php if($scriptname === "taillog.php"){ ?> class="active"<?php } ?>>
                            <a href="taillog.php">
                                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="xMidYMid meet" height="14" viewBox="0 0 200 200" class="svg-inline--fa custom-menu-icon fa-w-20 fa-fw menu-icon">
                                    <g>
                                        <linearGradient id="svg_1_1_" gradientUnits="userSpaceOnUse" x1="-317.0903" y1="393.5137" x2="-316.0898" y2="393.5137" gradientTransform="matrix(94.8803 0 0 -56.7359 30129.9492 22362.8691)">
                                            <stop offset="0.051" style="stop-color:currentColor;stop-opacity:0.6"/>
                                            <stop offset="0.95" style="stop-color:currentColor"/>
                                        </linearGradient>
                                        <path id="svg_1" fill="url(#svg_1_1_)" d="M89.247,64.579C66.298,62.131,43.179,44.785,41.354,8.083 c35.612,0,54.656,21.082,56.496,54.486c6.734-40.069,38.301-35.372,38.301-35.372c1.499,22.708-17.148,36.475-38.301,37.621 c-5.942-12.521-41.541-43.238-41.541-43.238c-0.042-0.036-0.104-0.03-0.14,0.011c-0.024,0.028-0.03,0.067-0.016,0.102 C56.153,21.694,90.506,51.619,89.247,64.579"/>
                                        <path id="svg_2" opacity="0.6" fill="currentColor" d="M100,191.916c-2.221-0.127-22.949-0.92-24.208-24.208 c-1.019-14.148,10.159-24.576,10.159-38.314c-2.533-34.253-48.431-30.009-48.431,0c-0.019,7.5,2.949,14.699,8.249,20.007 l34.197,34.211c5.307,5.299,12.506,8.268,20.006,8.248"/>
                                        <path id="svg_3" fill="currentColor" d="M162.48,129.408c-0.127,2.221-0.92,22.949-24.209,24.208 c-14.148,1.019-24.59-10.159-38.314-10.159c-34.254,2.533-30.009,48.417,0,48.417c7.5,0.019,14.699-2.949,20.006-8.249 l34.226-34.197c5.299-5.307,8.268-12.506,8.248-20.006"/>
                                        <path id="svg_4" opacity="0.6" fill="currentColor" d="M100,66.928c2.221,0.127,22.949,0.919,24.209,24.208 c1.018,14.149-10.159,24.576-10.159,38.314c2.532,34.254,48.417,30.009,48.417,0c0.019-7.5-2.949-14.698-8.25-20.006 l-34.211-34.226c-5.307-5.3-12.506-8.268-20.006-8.249"/>
                                        <path id="svg_5" fill="currentColor" d="M37.633,129.408c0.127-2.222,0.92-22.949,24.208-24.209 c14.148-1.019,24.59,10.159,38.314,10.159c34.254-2.575,30.009-48.417,0-48.417c-7.5-0.019-14.699,2.949-20.006,8.249 l-34.226,34.212c-5.299,5.307-8.268,12.506-8.249,20.006"/>
                                    </g>
                                </svg>
                                Tail pihole.log
                            </a>
                        </li>
                        <!-- Tail FTL.log -->
                        <li<?php if($scriptname === "taillog-FTL.php"){ ?> class="active"<?php } ?>>
                            <a href="taillog-FTL.php">
                                <svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" preserveAspectRatio="xMidYMid meet" height="14" viewBox="0 0 400 340" class="svg-inline--fa custom-menu-icon fa-w-20 fa-fw menu-icon">
                                    <g fill="currentColor">
                                        <path opacity=".6" d="M42.315 11h111.078l-7.381 31.378H34.898L42.315 11z"/>
                                        <path d="M237.368 42.207q-13.098 62.242-26.23 124.486h-37.354q13.135-62.244 26.23-124.486h-39.652l7.381-31.174h132.055l-7.639 31.174h-54.791zm87.03 94.016L351.124 11h-37.18q-16.584 77.846-33.199 155.693h103.356v-30.47h-59.703zM32.428 67.509l-22.316 99.184h31.807l16.068-67.908h59.41l7.381-31.326-92.35.05z"/>
                                        <path opacity=".6" d="M10 186.2a283.868 283.868 0 0 1 42.976-2.992c26.697 0 44.014 4.806 57.58 15.023 14.604 10.853 23.782 28.17 23.782 52.991 0 26.914-9.798 45.487-23.364 56.96-14.806 12.31-37.348 18.154-64.882 18.154A276.442 276.442 0 0 1 10 324.29V186.2zm31.922 114.726a57.564 57.564 0 0 0 11.054.636c28.79.201 47.564-15.659 47.564-49.24.217-29.208-16.899-44.65-44.231-44.65a66.665 66.665 0 0 0-14.387 1.241v92.013zm113.283 24.015V184.325h37.209l29.146 51.595a408.098 408.098 0 0 1 22.945 48.06h.62a523.847 523.847 0 0 1-2.697-58.618v-41.037h29.208V324.94h-33.394l-30.046-54.262a523.459 523.459 0 0 1-24.402-49.611l-.62.201c.821 18.605 1.24 38.402 1.24 61.348v42.355l-29.209-.03zm145.004-32.759a81.099 81.099 0 0 0 35.27 8.76c14.605 0 22.326-6.047 22.326-15.225 0-8.76-6.682-13.767-23.581-19.829-23.364-8.123-38.604-21.069-38.604-41.518 0-23.984 20.03-42.355 53.208-42.355a86.246 86.246 0 0 1 35.89 7.1l-7.1 25.658a66.804 66.804 0 0 0-29.456-6.666c-13.783 0-20.45 6.201-20.45 13.55 0 8.976 7.923 12.945 26.077 19.829 24.806 9.178 36.511 22.108 36.511 41.937 0 23.58-18.155 43.611-56.743 43.611-16.077 0-31.921-4.186-39.86-8.558l6.512-26.294z"/>
                                    </g>
                                </svg>
                                Tail FTL.log
                            </a>
                        </li>
                        <!-- Generate debug log -->
                        <li<?php if($scriptname === "debug.php"){ ?> class="active"<?php } ?>>
                            <a href="debug.php">
                                <i class="fa fa-fw menu-icon fa-ambulance"></i> Generate debug log
                            </a>
                        </li>
                        <!-- Network -->
                        <li<?php if($scriptname === "network.php"){ ?> class="active"<?php } ?>>
                            <a href="network.php">
                                <i class="fa fa-fw menu-icon fa-network-wired"></i> Network
                            </a>
                        </li>
                    </ul>
                </li>
                <!-- Settings -->
                <li<?php if($scriptname === "settings.php"){ ?> class="active"<?php } ?>>
                    <a href="settings.php">
                        <i class="fa fa-fw menu-icon fa-cog"></i> <span>Settings</span>
                    </a>
                </li>
                <?php } ?>

                <li class="header text-uppercase">Support</li>
                <!-- Docs -->
                <li>
                    <a href="https://docs.pi-hole.net/" rel="noopener" target="_blank" class="menu-support">
                        <i class="fa fa-fw menu-icon fa-question-circle"></i> <span>Documentation</span>
                    </a>
                </li>
                <!-- Discourse -->
                <li>
                    <a href="https://discourse.pi-hole.net/" rel="noopener" target="_blank" class="menu-support">
                        <i class="fa fa-fw menu-icon fab fa-discourse"></i> <span>Pi-hole Forum</span>
                    </a>
                </li>
                <!-- Donate -->
                <li>
                    <a href="https://pi-hole.net/donate/" rel="noopener" target="_blank" class="menu-support">
                        <i class="fas fa-fw menu-icon fa-donate"></i> <span>Donate</span>
                    </a>
                </li>
            </ul>
        </section>
        <!-- /.sidebar -->
    </aside>
