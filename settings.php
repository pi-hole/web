<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
require "scripts/pi-hole/php/header.php";
require "scripts/pi-hole/php/savesettings.php";
require_once "scripts/pi-hole/php/FTL.php";
// Reread ini file as things might have been changed
$setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
$piholeFTLConf = piholeFTLConfig();

// Handling of PHP internal errors
$last_error = error_get_last();
if(isset($last_error) && ($last_error["type"] === E_WARNING || $last_error["type"] === E_ERROR))
{
	$error .= "There was a problem applying your settings.<br>Debugging information:<br>PHP error (".htmlspecialchars($last_error["type"])."): ".htmlspecialchars($last_error["message"])." in ".htmlspecialchars($last_error["file"]).":".htmlspecialchars($last_error["line"]);
}

?>
<style>
	.tooltip-inner {
		max-width: none;
		white-space: nowrap;
	}
</style>

<?php // Check if ad lists should be updated after saving ...
if (isset($_POST["submit"])) {
    if ($_POST["submit"] == "saveupdate") {
        // If that is the case -> refresh to the gravity page and start updating immediately
        ?>
        <meta http-equiv="refresh" content="1;url=gravity.php?go">
    <?php }
} ?>

<?php if (isset($debug)) { ?>
    <div id="alDebug" class="alert alert-warning alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
        </button>
        <h4><i class="icon fa fa-exclamation-triangle"></i> Debug</h4>
        <pre><?php print_r($_POST); ?></pre>
    </div>
<?php } ?>

<?php if (strlen($success) > 0) { ?>
    <div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
        </button>
        <h4><i class="icon fa fa-info"></i> Info</h4>
        <?php echo $success; ?>
    </div>
<?php } ?>

<?php if (strlen($error) > 0) { ?>
    <div id="alError" class="alert alert-danger alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span>
        </button>
        <h4><i class="icon fa fa-ban"></i> Error</h4>
        <?php echo $error; ?>
    </div>
<?php } ?>

<?php
if (isset($setupVars["PIHOLE_INTERFACE"])) {
    $piHoleInterface = $setupVars["PIHOLE_INTERFACE"];
} else {
    $piHoleInterface = "unknown";
}
if (isset($setupVars["IPV4_ADDRESS"])) {
    $piHoleIPv4 = $setupVars["IPV4_ADDRESS"];
} else {
    $piHoleIPv4 = "unknown";
}

// DNS settings
$DNSservers = [];
$DNSactive = [];

$i = 1;
while (isset($setupVars["PIHOLE_DNS_" . $i])) {
    if (isinserverlist($setupVars["PIHOLE_DNS_" . $i])) {
        array_push($DNSactive, $setupVars["PIHOLE_DNS_" . $i]);
    } elseif (strpos($setupVars["PIHOLE_DNS_" . $i], ".") !== false) {
        if (!isset($custom1)) {
            $custom1 = $setupVars["PIHOLE_DNS_" . $i];
        } else {
            $custom2 = $setupVars["PIHOLE_DNS_" . $i];
        }
    } elseif (strpos($setupVars["PIHOLE_DNS_" . $i], ":") !== false) {
        if (!isset($custom3)) {
            $custom3 = $setupVars["PIHOLE_DNS_" . $i];
        } else {
            $custom4 = $setupVars["PIHOLE_DNS_" . $i];
        }
    }
    $i++;
}

if (isset($setupVars["DNS_FQDN_REQUIRED"])) {
    if ($setupVars["DNS_FQDN_REQUIRED"]) {
        $DNSrequiresFQDN = true;
    } else {
        $DNSrequiresFQDN = false;
    }
} else {
    $DNSrequiresFQDN = true;
}

if (isset($setupVars["DNS_BOGUS_PRIV"])) {
    if ($setupVars["DNS_BOGUS_PRIV"]) {
        $DNSbogusPriv = true;
    } else {
        $DNSbogusPriv = false;
    }
} else {
    $DNSbogusPriv = true;
}

if (isset($setupVars["DNSSEC"])) {
    if ($setupVars["DNSSEC"]) {
        $DNSSEC = true;
    } else {
        $DNSSEC = false;
    }
} else {
    $DNSSEC = false;
}

if (isset($setupVars["DNSMASQ_LISTENING"])) {
    if ($setupVars["DNSMASQ_LISTENING"] === "single") {
        $DNSinterface = "single";
    } elseif ($setupVars["DNSMASQ_LISTENING"] === "all") {
        $DNSinterface = "all";
    } else {
        $DNSinterface = "local";
    }
} else {
    $DNSinterface = "single";
}
if (isset($setupVars["REV_SERVER"]) && ($setupVars["REV_SERVER"] == 1)) {
    $rev_server = true;
    $rev_server_cidr   = $setupVars["REV_SERVER_CIDR"];
    $rev_server_target = $setupVars["REV_SERVER_TARGET"];
    $rev_server_domain = $setupVars["REV_SERVER_DOMAIN"];
} else {
    $rev_server = false;
}
?>

<?php
// Query logging
if (isset($setupVars["QUERY_LOGGING"])) {
    if ($setupVars["QUERY_LOGGING"] == 1) {
        $piHoleLogging = true;
    } else {
        $piHoleLogging = false;
    }
} else {
    $piHoleLogging = true;
}
?>

<?php
// Excluded domains in API Query Log call
if (isset($setupVars["API_EXCLUDE_DOMAINS"])) {
    $excludedDomains = explode(",", $setupVars["API_EXCLUDE_DOMAINS"]);
} else {
    $excludedDomains = [];
}

// Exluded clients in API Query Log call
if (isset($setupVars["API_EXCLUDE_CLIENTS"])) {
    $excludedClients = explode(",", $setupVars["API_EXCLUDE_CLIENTS"]);
} else {
    $excludedClients = [];
}

// Exluded clients
if (isset($setupVars["API_QUERY_LOG_SHOW"])) {
    $queryLog = $setupVars["API_QUERY_LOG_SHOW"];
} else {
    $queryLog = "all";
}

// Privacy Mode
if (isset($setupVars["API_PRIVACY_MODE"])) {
    $privacyMode = $setupVars["API_PRIVACY_MODE"];
} else {
    $privacyMode = false;
}

?>

<?php
if (isset($_GET['tab']) && in_array($_GET['tab'], array("sysadmin", "adlists", "dns", "piholedhcp", "api", "privacy", "teleporter"))) {
    $tab = $_GET['tab'];
} else {
    $tab = "sysadmin";
}
?>
<div class="row">
    <div class="col-md-12">
        <div class="nav-tabs-custom">
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation"<?php if($tab === "sysadmin"){ ?> class="active"<?php } ?>>
                    <a href="#sysadmin" aria-controls="sysadmin" aria-expanded="<?php echo $tab === "sysadmin" ? "true" : "false"; ?>" role="tab" data-toggle="tab">System</a>
                </li>
                <li role="presentation"<?php if($tab === "adlists"){ ?> class="active"<?php } ?>>
                    <a href="#adlists" aria-controls="adlists" aria-expanded="<?php echo $tab === "adlists" ? "true" : "false"; ?>" role="tab" data-toggle="tab">Adlists</a>
                </li>
                <li role="presentation"<?php if($tab === "dns"){ ?> class="active"<?php } ?>>
                    <a href="#dns" aria-controls="dns" aria-expanded="<?php echo $tab === "dns" ? "true" : "false"; ?>" role="tab" data-toggle="tab">DNS</a>
                </li>
                <li role="presentation"<?php if($tab === "piholedhcp"){ ?> class="active"<?php } ?>>
                    <a href="#piholedhcp" aria-controls="piholedhcp" aria-expanded="<?php echo $tab === "piholedhcp" ? "true" : "false"; ?>" role="tab" data-toggle="tab">DHCP</a>
                </li>
                <li role="presentation"<?php if($tab === "api"){ ?> class="active"<?php } ?>>
                    <a href="#api" aria-controls="api" aria-expanded="<?php echo $tab === "api" ? "true" : "false"; ?>" role="tab" data-toggle="tab">API / Web interface</a>
                </li>
                <li role="presentation"<?php if($tab === "privacy"){ ?> class="active"<?php } ?>>
                    <a href="#privacy" aria-controls="privacy" aria-expanded="<?php echo $tab === "privacy" ? "true" : "false"; ?>" role="tab" data-toggle="tab">Privacy</a>
                </li>
                <li role="presentation"<?php if($tab === "teleporter"){ ?> class="active"<?php } ?>>
                    <a href="#teleporter" aria-controls="teleporter" aria-expanded="<?php echo $tab === "teleporter" ? "true" : "false"; ?>" role="tab" data-toggle="tab">Teleporter</a>
                </li>
            </ul>
            <div class="tab-content">
                <!-- ######################################################### System admin ######################################################### -->
                <div id="sysadmin" class="tab-pane fade<?php if($tab === "sysadmin"){ ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="box">
                                <div class="box-header with-border">
                                    <h3 class="box-title">FTL Information</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <?php
                                            if ($FTL) {
                                                function get_FTL_data($arg)
                                                {
                                                    global $FTLpid;
                                                    return trim(exec("ps -p " . $FTLpid . " -o " . $arg));
                                                }

                                                $FTLversion = exec("/usr/bin/pihole-FTL version");
                                            ?>
                                            <table class="table table-striped table-bordered nowrap">
                                                <tbody>
                                                    <tr>
                                                        <th scope="row">FTL version:</th>
                                                        <td><?php echo $FTLversion; ?></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Process identifier (PID):</th>
                                                        <td><?php echo $FTLpid; ?></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Time FTL started:</th>
                                                        <td><?php print_r(get_FTL_data("lstart")); ?></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">User / Group:</th>
                                                        <td><?php print_r(get_FTL_data("euser")); ?> / <?php print_r(get_FTL_data("egroup")); ?></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Total CPU utilization:</th>
                                                        <td><?php print_r(get_FTL_data("%cpu")); ?>%</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Memory utilization:</th>
                                                        <td><?php print_r(get_FTL_data("%mem")); ?>%</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Resident memory is the portion of memory occupied by a process that is held in main memory (RAM). The rest of the occupied memory exists in the swap space or file system.">Used memory:</span>
                                                        </th>
                                                        <td><?php echo formatSizeUnits(1e3 * floatval(get_FTL_data("rss"))); ?></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Size of the DNS domain cache">DNS cache size:</span>
                                                        </th>
                                                        <td id="cache-size">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Number of cache insertions">DNS cache insertions:</span>
                                                        </th>
                                                        <td id="cache-inserted">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Number of cache entries that had to be removed although they are not expired (increase cache size to reduce this number)">DNS cache evictions:</span>
                                                        </th>
                                                        <td id="cache-live-freed">&nbsp;</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            See also our <a href="https://docs.pi-hole.net/ftldns/dns-cache/" rel="noopener" target="_blank">DNS cache documentation</a>.
                                            <?php } else { ?>
                                            <div>The FTL service is offline!</div>
                                            <?php } ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="box box-warning">
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <?php if ($piHoleLogging) { ?>
                                                <button type="button" class="btn btn-warning confirm-disablelogging-noflush btn-block">Disable query logging</button>
                                            <?php } else { ?>
                                                <form role="form" method="post">
                                                    <input type="hidden" name="action" value="Enable">
                                                    <input type="hidden" name="field" value="Logging">
                                                    <input type="hidden" name="token" value="<?php echo $token ?>">
                                                    <button type="submit" class="btn btn-success btn-block">Enable query logging</button>
                                                </form>
                                            <?php } ?>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                                <button type="button" class="btn btn-warning confirm-flusharp btn-block">Flush network table</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-warning confirm-restartdns btn-block">Restart DNS resolver</button>
                                        </div>
                                    </div>
                                    <br/>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-flushlogs btn-block">Flush logs (last 24 hours)</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-poweroff btn-block">Power off system</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-reboot btn-block">Restart system</button>
                                        </div>
                                    </div>

                                    <form role="form" method="post" id="flushlogsform">
                                        <input type="hidden" name="field" value="flushlogs">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                    <form role="form" method="post" id="flusharpform">
                                        <input type="hidden" name="field" value="flusharp">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                    <form role="form" method="post" id="disablelogsform-noflush">
                                        <input type="hidden" name="field" value="Logging">
                                        <input type="hidden" name="action" value="Disable-noflush">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                    <form role="form" method="post" id="poweroffform">
                                        <input type="hidden" name="field" value="poweroff">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                    <form role="form" method="post" id="rebootform">
                                        <input type="hidden" name="field" value="reboot">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                    <form role="form" method="post" id="restartdnsform">
                                        <input type="hidden" name="field" value="restartdns">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### Adlists ######################################################### -->
                <div id="adlists" class="tab-pane fade<?php if($tab === "adlists"){ ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-md-12">
                            <div class="box">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Adlists used to generate Pi-hole's Gravity</h3>
                                </div>
                                <div class="box-body">
                                    <p>Please use the <a href="groups-adlists.php">group management pages</a> to edit the adlists used by Pi-hole.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### DHCP ######################################################### -->
                <div id="piholedhcp" class="tab-pane fade<?php if($tab === "piholedhcp"){ ?> in active<?php } ?>">
                    <?php
                    // Pi-hole DHCP server
                    if (isset($setupVars["DHCP_ACTIVE"])) {
                        if ($setupVars["DHCP_ACTIVE"] == 1) {
                            $DHCP = true;
                        } else {
                            $DHCP = false;
                        }
                        // Read setings from config file
                        if (isset($setupVars["DHCP_START"])) {
                            $DHCPstart = $setupVars["DHCP_START"];
                        } else {
                            $DHCPstart = "";
                        }
                        if (isset($setupVars["DHCP_END"])) {
                            $DHCPend = $setupVars["DHCP_END"];
                        } else {
                            $DHCPend = "";
                        }
                        if (isset($setupVars["DHCP_ROUTER"])) {
                            $DHCProuter = $setupVars["DHCP_ROUTER"];
                        } else {
                            $DHCProuter = "";
                        }

                        // This setting has been added later, we have to check if it exists
                        if (isset($setupVars["DHCP_LEASETIME"])) {
                            $DHCPleasetime = $setupVars["DHCP_LEASETIME"];
                            if (strlen($DHCPleasetime) < 1) {
                                // Fallback if empty string
                                $DHCPleasetime = 24;
                            }
                        } else {
                            $DHCPleasetime = 24;
                        }
                        if (isset($setupVars["DHCP_IPv6"])) {
                            $DHCPIPv6 = $setupVars["DHCP_IPv6"];
                        } else {
                            $DHCPIPv6 = false;
                        }
                        if (isset($setupVars["DHCP_rapid_commit"])) {
                            $DHCP_rapid_commit = $setupVars["DHCP_rapid_commit"];
                        } else {
                            $DHCP_rapid_commit = false;
                        }

                    } else {
                        $DHCP = false;
                        // Try to guess initial settings
                        if ($piHoleIPv4 !== "unknown") {
                            $DHCPdomain = explode(".", $piHoleIPv4);
                            $DHCPstart = $DHCPdomain[0] . "." . $DHCPdomain[1] . "." . $DHCPdomain[2] . ".201";
                            $DHCPend = $DHCPdomain[0] . "." . $DHCPdomain[1] . "." . $DHCPdomain[2] . ".251";
                            $DHCProuter = $DHCPdomain[0] . "." . $DHCPdomain[1] . "." . $DHCPdomain[2] . ".1";
                        } else {
                            $DHCPstart = "";
                            $DHCPend = "";
                            $DHCProuter = "";
                        }
                        $DHCPleasetime = 24;
                        $DHCPIPv6 = false;
                        $DHCP_rapid_commit = false;
                    }
                    if (isset($setupVars["PIHOLE_DOMAIN"])) {
                        $piHoleDomain = $setupVars["PIHOLE_DOMAIN"];
                    } else {
                        $piHoleDomain = "lan";
                    }
                    ?>
                    <form role="form" method="post">
                        <div class="row">
                            <!-- DHCP Settings Box -->
                            <div class="col-md-6">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">DHCP Settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div><input type="checkbox" name="active" id="DHCPchk" <?php if ($DHCP){ ?>checked<?php } ?>><label for="DHCPchk"><strong>DHCP server enabled</strong></label></div><br>
                                                <p id="dhcpnotice" <?php if (!$DHCP){ ?>hidden<?php } ?>>Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!</p>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-xs-12">
                                                <label>Range of IP addresses to hand out</label>
                                            </div>
                                            <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                                <div class="form-group">
                                                    <div class="input-group">
                                                        <div class="input-group-addon">From</div>
                                                        <input type="text" class="form-control DHCPgroup" name="from" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                               value="<?php echo $DHCPstart; ?>"
                                                               <?php if (!$DHCP){ ?>disabled<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                                <div class="form-group">
                                                    <div class="input-group">
                                                        <div class="input-group-addon">To</div>
                                                        <input type="text" class="form-control DHCPgroup" name="to" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                               value="<?php echo $DHCPend; ?>"
                                                               <?php if (!$DHCP){ ?>disabled<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <label>Router (gateway) IP address</label>
                                                <div class="form-group">
                                                    <div class="input-group">
                                                        <div class="input-group-addon">Router</div>
                                                        <input type="text" class="form-control DHCPgroup" name="router" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                               value="<?php echo $DHCProuter; ?>"
                                                               <?php if (!$DHCP){ ?>disabled<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <!-- Advanced DHCP Settings Box -->
                            <div class="col-md-6">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Advanced DHCP settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <label>Pi-hole domain name</label>
                                                <div class="form-group">
                                                    <div class="input-group">
                                                        <div class="input-group-addon">Domain</div>
                                                        <input type="text" class="form-control DHCPgroup" name="domain"
                                                               value="<?php echo $piHoleDomain; ?>"
                                                               <?php if (!$DHCP){ ?>disabled<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <label>DHCP lease time</label>
                                                <div class="form-group">
                                                    <div class="input-group">
                                                        <div class="input-group-addon">Lease time in hours</div>
                                                        <input type="number" class="form-control DHCPgroup"
                                                               name="leasetime"
                                                               id="leasetime" value="<?php echo $DHCPleasetime; ?>"
                                                               data-mask <?php if (!$DHCP){ ?>disabled<?php } ?>>
                                                    </div>
                                                </div>
                                                <p>Hint: 0 = infinite, 24 = one day, 168 = one week, 744 = one month, 8760 = one year</p>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                              <div><input type="checkbox" name="DHCP_rapid_commit" id="DHCP_rapid_commit" class="DHCPgroup" <?php if ($DHCP_rapid_commit){ ?>checked<?php }; if (!$DHCP){ ?> disabled<?php } ?>>&nbsp;<label for="DHCP_rapid_commit"><strong>Enable DHCPv4 rapid commit (fast address assignment)</strong></label></div>
                                              <div><input type="checkbox" name="useIPv6" id="useIPv6" class="DHCPgroup" <?php if ($DHCPIPv6){ ?>checked<?php }; if (!$DHCP){ ?> disabled<?php } ?>>&nbsp;<label for="useIPv6"><strong>Enable IPv6 support (SLAAC + RA)</strong></label></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- DHCP Leases Box -->
                        <div class="row">
                            <?php
                            $dhcp_leases = array();
                            if ($DHCP) {
                                // Read leases file
                                $leasesfile = true;
                                $dhcpleases = @fopen('/etc/pihole/dhcp.leases', 'r');
                                if (!is_resource($dhcpleases))
                                    $leasesfile = false;

                                function convertseconds($argument)
                                {
                                    $seconds = round($argument);
                                    if ($seconds < 60) {
                                        return sprintf('%ds', $seconds);
                                    } elseif ($seconds < 3600) {
                                        return sprintf('%dm %ds', ($seconds / 60), ($seconds % 60));
                                    } elseif ($seconds < 86400) {
                                        return sprintf('%dh %dm %ds', ($seconds / 3600 % 24), ($seconds / 60 % 60), ($seconds % 60));
                                    } else {
                                        return sprintf('%dd %dh %dm %ds', ($seconds / 86400), ($seconds / 3600 % 24), ($seconds / 60 % 60), ($seconds % 60));
                                    }
                                }

                                while (!feof($dhcpleases) && $leasesfile) {
                                    $line = explode(" ", trim(fgets($dhcpleases)));
                                    if (count($line) == 5) {
                                        $counter = intval($line[0]);
                                        if ($counter == 0) {
                                            $time = "Infinite";
                                        } elseif ($counter <= 315360000) // 10 years in seconds
                                        {
                                            $time = convertseconds($counter);
                                        } else // Assume time stamp
                                        {
                                            $time = convertseconds($counter - time());
                                        }

                                        if (strpos($line[2], ':') !== false) {
                                            // IPv6 address
                                            $type = 6;
                                        } else {
                                            // IPv4 lease
                                            $type = 4;
                                        }

                                        $host = htmlentities($line[3]);
                                        if ($host == "*") {
                                            $host = "<i>unknown</i>";
                                        }

                                        $clid = $line[4];
                                        if ($clid == "*") {
                                            $clid = "<i>unknown</i>";
                                        }

                                        array_push($dhcp_leases, ["TIME" => $time, "hwaddr" => strtoupper($line[1]), "IP" => $line[2], "host" => $host, "clid" => $clid, "type" => $type]);
                                    }
                                }
                            }

                            readStaticLeasesFile();
                            ?>
                            <div class="col-md-12">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">DHCP leases</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <label>Currently active DHCP leases</label>
                                                <table id="DHCPLeasesTable" class="table table-striped table-bordered nowrap" width="100%">
                                                    <thead>
                                                        <tr>
                                                            <th>MAC address</th>
                                                            <th>IP address</th>
                                                            <th>Hostname</th>
                                                            <td></td>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php foreach ($dhcp_leases as $lease) { ?>
                                                        <tr data-placement="auto" data-container="body" data-toggle="tooltip"
                                                            title="Lease type: IPv<?php echo $lease["type"]; ?><br/>Remaining lease time: <?php echo $lease["TIME"]; ?><br/>DHCP UID: <?php echo $lease["clid"]; ?>">
                                                            <td id="MAC"><?php echo $lease["hwaddr"]; ?></td>
                                                            <td id="IP" data-order="<?php echo bin2hex(inet_pton($lease["IP"])); ?>"><?php echo $lease["IP"]; ?></td>
                                                            <td id="HOST"><?php echo $lease["host"]; ?></td>
                                                            <td>
                                                                <button type="button" class="btn btn-danger btn-xs" id="removedynamic">
                                                                    <span class="fas fas fa-trash-alt"></span>
                                                                </button>
                                                                <button type="button" id="button" class="btn btn-warning btn-xs" data-static="alert">
                                                                    <span class="fas fas fa-file-import"></span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                        <?php } ?>
                                                    </tbody>
                                                </table>
                                                <br>
                                            </div>
                                            <div class="col-md-12">
                                                <label>Static DHCP leases configuration</label>
                                                <table id="DHCPStaticLeasesTable" class="table table-striped table-bordered nowrap" width="100%">
                                                    <thead>
                                                    <tr>
                                                        <th>MAC address</th>
                                                        <th>IP address</th>
                                                        <th>Hostname</th>
                                                        <td></td>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php foreach ($dhcp_static_leases as $lease) { ?>
                                                        <tr>
                                                            <td><?php echo $lease["hwaddr"]; ?></td>
                                                            <td data-order="<?php echo bin2hex(inet_pton($lease["IP"])); ?>"><?php echo $lease["IP"]; ?></td>
                                                            <td><?php echo htmlentities($lease["host"]); ?></td>
                                                            <td><?php if (strlen($lease["hwaddr"]) > 0) { ?>
                                                                <button type="submit" class="btn btn-danger btn-xs" name="removestatic"
                                                                        value="<?php echo $lease["hwaddr"]; ?>">
                                                                    <span class="far fa-trash-alt"></span>
                                                                </button>
                                                                <?php } ?>
                                                            </td>
                                                        </tr>
                                                        <?php } ?>
                                                    </tbody>
                                                    <tfoot style="display: table-row-group">
                                                        <tr>
                                                            <td><input type="text" class="form-group" name="AddMAC" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                            <td><input type="text" class="form-group" name="AddIP" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                            <td><input type="text" class="form-group" name="AddHostname" value="" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                            <td>
                                                                <button type="submit" class="btn btn-success btn-xs" name="addstatic">
                                                                    <span class="fas fa-plus"></span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                                <p>Specifying the MAC address is mandatory and only one entry per MAC
                                                   address is allowed. If the IP address is omitted and a host name is
                                                   given, the IP address will still be generated dynamically and the
                                                   specified host name will be used. If the host name is omitted, only
                                                   a static lease will be added.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" name="field" value="DHCP">
                                <input type="hidden" name="token" value="<?php echo $token ?>">
                                <button type="submit" class="btn btn-primary pull-right">Save</button>
                            </div>
                        </div>
                    </form>
                </div>
                <!-- ######################################################### DNS ######################################################### -->
                <div id="dns" class="tab-pane fade<?php if($tab === "dns"){ ?> in active<?php } ?>">
                    <form role="form" method="post">
                        <div class="row">
                            <div class="col-lg-6">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h1 class="box-title">Upstream DNS Servers</h1>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-sm-12">
                                                <table class="table table-bordered">
                                                    <tr>
                                                        <th colspan="2">IPv4</th>
                                                        <th colspan="2">IPv6</th>
                                                        <th>Name</th>
                                                    </tr>
                                                    <?php foreach ($DNSserverslist as $key => $value) { ?>
                                                    <tr>
                                                    <?php if (isset($value["v4_1"])) { ?>
                                                        <td title="<?php echo $value["v4_1"]; ?>">
                                                            <div><input type="checkbox" name="DNSserver<?php echo $value["v4_1"]; ?>" id="DNS4server<?php echo $value["v4_1"]; ?>" value="true" <?php if (in_array($value["v4_1"], $DNSactive)){ ?>checked<?php } ?>><label for="DNS4server<?php echo $value["v4_1"]; ?>"></label></div>
                                                        </td>
                                                    <?php } else { ?>
                                                        <td></td>
                                                    <?php } ?>
                                                    <?php if (isset($value["v4_2"])) { ?>
                                                        <td title="<?php echo $value["v4_2"]; ?>">
                                                            <div><input type="checkbox" name="DNSserver<?php echo $value["v4_2"]; ?>" id="DNS4server<?php echo $value["v4_2"]; ?>" value="true" <?php if (in_array($value["v4_2"], $DNSactive)){ ?>checked<?php } ?>><label for="DNS4server<?php echo $value["v4_2"]; ?>"></label></div>
                                                        </td>
                                                    <?php } else { ?>
                                                        <td></td>
                                                    <?php } ?>
                                                    <?php if (isset($value["v6_1"])) { ?>
                                                        <td title="<?php echo $value["v6_1"]; ?>">
                                                            <div><input type="checkbox" name="DNSserver<?php echo $value["v6_1"]; ?>" id="DNS6server<?php echo $value["v6_1"]; ?>" value="true" <?php if (in_array($value["v6_1"], $DNSactive)){ ?>checked<?php } ?>><label for="DNS6server<?php echo $value["v6_1"]; ?>"></label></div>
                                                        </td>
                                                    <?php } else { ?>
                                                        <td></td>
                                                    <?php } ?>
                                                    <?php if (isset($value["v6_2"])) { ?>
                                                        <td title="<?php echo $value["v6_2"]; ?>">
                                                            <div><input type="checkbox" name="DNSserver<?php echo $value["v6_2"]; ?>" id="DNS6server<?php echo $value["v6_2"]; ?>" value="true" <?php if (in_array($value["v6_2"], $DNSactive)){ ?>checked<?php } ?>><label for="DNS6server<?php echo $value["v6_2"]; ?>"></label></div>
                                                        </td>
                                                    <?php } else { ?>
                                                        <td></td>
                                                    <?php } ?>
                                                        <td><?php echo $key; ?></td>
                                                    </tr>
                                                    <?php } ?>
                                                </table>
                                                <p>ECS (Extended Client Subnet) defines a mechanism for recursive resolvers to send partial client IP address information to authoritative DNS name servers. Content Delivery Networks (CDNs) and latency-sensitive services use this to give geo-located responses when responding to name lookups coming through public DNS resolvers. <em>Note that ECS may result in reduced privacy.</em></p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h1 class="box-title">Upstream DNS Servers</h1>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-6">
                                                <strong>Custom 1 (IPv4)</strong>
                                                <div class="row">
                                                    <div class="col-md-1"><div>
                                                        <input type="checkbox" name="custom1" id="custom1" value="Customv4" <?php if (isset($custom1)){ ?>checked<?php } ?>>
                                                        <label for="custom1"></label></div>
                                                    </div>
                                                    <div class="col-md-11">
                                                        <input type="text" name="custom1val" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                                <?php if (isset($custom1)){ ?>value="<?php echo $custom1; ?>"<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <strong>Custom 2 (IPv4)</strong>
                                                <div class="row">
                                                    <div class="col-md-1"><div>
                                                        <input type="checkbox" name="custom2" id="custom2" value="Customv4" <?php if (isset($custom2)){ ?>checked<?php } ?>>
                                                        <label for="custom2"></label></div>
                                                    </div>
                                                    <div class="col-md-11">
                                                        <input type="text" name="custom2val" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                               <?php if (isset($custom2)){ ?>value="<?php echo $custom2; ?>"<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-6">
                                                <strong>Custom 3 (IPv6)</strong>
                                                <div class="row">
                                                    <div class="col-md-1"><div>
                                                        <input type="checkbox" name="custom3" id="custom3" value="Customv6" <?php if (isset($custom3)){ ?>checked<?php } ?>>
                                                        <label for="custom3"></label></div>
                                                    </div>
                                                    <div class="col-md-11">
                                                        <input type="text" name="custom3val" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                                <?php if (isset($custom3)){ ?>value="<?php echo $custom3; ?>"<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-md-6">
                                                <strong>Custom 4 (IPv6)</strong>
                                                <div class="row">
                                                    <div class="col-md-1"><div>
                                                        <input type="checkbox" name="custom4" id="custom4" value="Customv6" <?php if (isset($custom4)){ ?>checked<?php } ?>>
                                                        <label for="custom4"></label></div>
                                                    </div>
                                                    <div class="col-md-11">
                                                        <input type="text" name="custom4val" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                               <?php if (isset($custom4)){ ?>value="<?php echo $custom4; ?>"<?php } ?>>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h1 class="box-title">Interface listening behavior</h1>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div class="form-group">
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="DNSinterface1" value="local"
                                                                <?php if ($DNSinterface == "local"){ ?>checked<?php } ?>>
                                                        <label for="DNSinterface1"><strong>Listen on all interfaces</strong><br>Allows only queries from devices that are at most one hop away (local devices)</label>
                                                    </div>
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="DNSinterface2" value="single"
                                                                <?php if ($DNSinterface == "single"){ ?>checked<?php } ?>>
                                                        <label for="DNSinterface2"><strong>Listen only on interface <?php echo htmlentities($piHoleInterface); ?></strong></label>
                                                    </div>
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="DNSinterface3" value="all"
                                                                <?php if ($DNSinterface == "all"){ ?>checked<?php } ?>>
                                                        <label for="DNSinterface3"><strong>Listen on all interfaces, permit all origins</strong></label>
                                                    </div>
                                                </div>
                                                <p>Note that the last option should not be used on devices which are
                                                   directly connected to the Internet. This option is safe if your
                                                   Pi-hole is located within your local network, i.e. protected behind
                                                   your router, and you have not forwarded port 53 to this device. In
                                                   virtually all other cases you have to make sure that your Pi-hole is
                                                   properly firewalled.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Advanced DNS settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div>
                                                    <input type="checkbox" name="DNSrequiresFQDN" id="DNSrequiresFQDN" title="domain-needed" <?php if ($DNSrequiresFQDN){ ?>checked<?php } ?>>
                                                    <label for="DNSrequiresFQDN"><strong>Never forward non-FQDNs</strong></label>
                                                    <p>When there is a Pi-hole domain set and this box is
                                                    ticked, this asks FTL that this domain is purely
                                                    local and FTL may answer queries from <code>/etc/hosts</code> or DHCP leases
                                                    but should never forward queries on that domain to any upstream servers.</p>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="DNSbogusPriv" id="DNSbogusPriv" title="bogus-priv" <?php if ($DNSbogusPriv){ ?>checked<?php } ?>>
                                                    <label for="DNSbogusPriv"><strong>Never forward reverse lookups for private IP ranges</strong></label>
                                                    <p>All reverse lookups for private IP ranges (i.e., <code>192.168.0.x/24</code>, etc.)
                                                    which are not found in <code>/etc/hosts</code> or the DHCP leases are answered
                                                    with "no such domain" rather than being forwarded upstream. The set
                                                    of prefixes affected is the list given in <a href="https://tools.ietf.org/html/rfc6303">RFC6303</a>.</p>
                                                    <p><strong>Important</strong>: Enabling these two options may increase your privacy,
                                                    but may also prevent you from being able to access
                                                    local hostnames if the Pi-hole is not used as DHCP server.</p>
                                                </div>
                                                <br>
                                                <div>
                                                    <input type="checkbox" name="DNSSEC" id="DNSSEC" <?php if ($DNSSEC){ ?>checked<?php } ?>>
                                                    <label for="DNSSEC"><strong>Use DNSSEC</strong></label>
                                                    <p>Validate DNS replies and cache DNSSEC data. When forwarding DNS
                                                    queries, Pi-hole requests the DNSSEC records needed to validate
                                                    the replies. If a domain fails validation or the upstream does not
                                                    support DNSSEC, this setting can cause issues resolving domains.
                                                    Use an upstream DNS server which supports DNSSEC when activating DNSSEC. Note that
                                                    the size of your log might increase significantly
                                                    when enabling DNSSEC. A DNSSEC resolver test can be found
                                                    <a href="https://dnssec.vs.uni-due.de/" rel="noopener" target="_blank">here</a>.</p>
                                                </div>
                                                <br>
                                                <h4>Conditional forwarding</h4>
                                                <p>If not configured as your DHCP server, Pi-hole  typically won't be able to
                                                   determine the names of devices on your local network.  As a
                                                   result, tables such as Top Clients will only show IP addresses.</p>
                                                <p>One solution for this is to configure Pi-hole to forward these
	                                               requests to your DHCP server (most likely your router), but only for devices on your
	                                               home network.  To configure this we will need to know the IP
	                                               address of your DHCP server and which addresses belong to your local network.
                                                   Exemplary input is given below as placeholder in the text boxes (if empty).</p>
                                                <p>If your local network spans 192.168.0.1 - 192.168.0.255, then you will have to input
                                                   <code>192.168.0.0/24</code>. If your local network is 192.168.47.1 - 192.168.47.255, it will
                                                   be <code>192.168.47.0/24</code> and similar. If your network is larger, the CIDR has to be
                                                   different, for instance a range of 10.8.0.1 - 10.8.255.255 results in <code>10.8.0.0/16</code>,
                                                   whereas an even wider network of 10.0.0.1 - 10.255.255.255 results in <code>10.0.0.0/8</code>.
                                                   Setting up IPv6 ranges is exactly similar to setting up IPv4 here and fully supported.
                                                   Feel free to reach out to us on our
                                                   <a href="https://discourse.pi-hole.net" target="_blank">Discourse forum</a>
                                                   in case you need any assistance setting up local host name resolution for your particular system.</p>
                                                <p>You can also specify a local domain name (like <code>fritz.box</code>) to ensure queries to
                                                   devices ending in your local domain name will not leave your network, however, this is optional.
                                                   The local domain name must match the domain name specified
                                                   in your DHCP server for this to work. You can likely find it within the DHCP settings.</p>
                                                <div class="form-group">
                                                    <div>
                                                        <input type="checkbox" name="rev_server" id="rev_server" value="rev_server" <?php if(isset($rev_server) && ($rev_server == true)){ ?>checked<?php } ?>>
                                                        <label for="rev_server"><strong>Use Conditional Forwarding</strong></label>
                                                    </div>
                                                    <div class="input-group">
                                                      <table class="table table-bordered">
                                                        <tr>
                                                          <th>Local network in <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" target="_blank">CIDR notation</a></th>
                                                          <th>IP address of your DHCP server (router)</th>
                                                          <th>Local domain name (optional)</th>
                                                        </tr>
                                                        <tr>
                                                          <td>
                                                            <input type="text" name="rev_server_cidr" placeholder="192.168.0.0/16" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                            <?php if(isset($rev_server_cidr)){ ?>value="<?php echo $rev_server_cidr; ?>"<?php } ?>
                                                            <?php if(!isset($rev_server) || !$rev_server){ ?>disabled<?php } ?>>
                                                          </td>
                                                          <td>
                                                            <input type="text" name="rev_server_target" placeholder="192.168.0.1" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                            <?php if(isset($rev_server_target)){ ?>value="<?php echo $rev_server_target; ?>"<?php } ?>
                                                            <?php if(!isset($rev_server) || !$rev_server){ ?>disabled<?php } ?>>
                                                          </td>
                                                          <td>
                                                            <input type="text" name="rev_server_domain" placeholder="local" class="form-control" data-mask autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                            <?php if(isset($rev_server_domain)){ ?>value="<?php echo $rev_server_domain; ?>"<?php } ?>
                                                            <?php if(!isset($rev_server) || !$rev_server){ ?>disabled<?php } ?>>
                                                          </td>
                                                        </tr>
                                                      </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input type="hidden" name="field" value="DNS">
                                <input type="hidden" name="token" value="<?php echo $token ?>">
                                <button type="submit" class="btn btn-primary pull-right">Save</button>
                            </div>
                        </div>
                    </form>
                </div>
                <!-- ######################################################### API and Web ######################################################### -->
                <?php
                // Administrator email address
                if (isset($setupVars["ADMIN_EMAIL"])) {
                    $adminemail = $setupVars["ADMIN_EMAIL"];
                } else {
                    $adminemail = "";
                }
                ?>
                <div id="api" class="tab-pane fade<?php if($tab === "api"){ ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-md-6">
                            <form role="form" method="post">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">API settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <h4>Top Lists</h4>
                                                <p>Exclude the following domains from being shown in</p>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                                <div class="form-group">
                                                    <label>Top Domains / Top Advertisers</label>
                                                    <textarea name="domains" class="form-control" placeholder="Enter one domain per line" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                              rows="4"><?php foreach ($excludedDomains as $domain) {
                                                                             echo $domain . "\n"; }
                                                                       ?></textarea>
                                                </div>
                                            </div>
                                            <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                                <div class="form-group">
                                                    <label>Top Clients</label>
                                                    <textarea name="clients" class="form-control" placeholder="Enter one IP address or host name per line" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"
                                                              rows="4"><?php foreach ($excludedClients as $client) {
                                                                             echo $client . "\n"; }
                                                                       ?></textarea>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                            <h4>Query Log</h4>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-6">
                                                <div>
                                                    <input type="checkbox" name="querylog-permitted" id="querylog-permitted" <?php if($queryLog === "permittedonly" || $queryLog === "all"){ ?>checked<?php } ?>>
                                                    <label for="querylog-permitted"><strong>Show permitted domain entries</strong></label>
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div>
                                                <input type="checkbox" name="querylog-blocked" id="querylog-blocked" <?php if($queryLog === "blockedonly" || $queryLog === "all"){ ?>checked<?php } ?>>
                                                <label for="querylog-blocked"><strong>Show blocked domain entries</strong></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="box-footer clearfix">
                                        <input type="hidden" name="field" value="API">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                        <button type="button" class="btn btn-primary api-token">Show API token</button>
                                        <button type="submit" class="btn btn-primary pull-right">Save</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <form role="form" method="post">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Web interface settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <h4>Interface appearance</h4>
                                                <?php theme_selection(); ?>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <div>
                                                    <input type="checkbox" name="boxedlayout" id="boxedlayout" value="yes" <?php if ($boxedlayout){ ?>checked<?php } ?>>
                                                    <label for="boxedlayout"><strong>Use boxed layout (for large screens)</strong></label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-md-12">
                                                <h4>Administrator Email Address</h4>
                                                <input type="email" class="form-control" name="adminemail" value="<?php echo htmlspecialchars($adminemail); ?>">
                                                <input type="hidden" name="field" value="webUI">
                                                <input type="hidden" name="token" value="<?php echo $token ?>">
                                            </div>
                                        </div>
                                    </div>
                                    <div class="box-footer clearfix">
                                        <button type="submit" class="btn btn-primary pull-right">Save</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="col-md-6">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Styling (auto saved, per-browser)</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p>Checkbox and radio buttons</p>
                                        </div>
                                        <div class="col-md-6">
                                            <select id="iCheckStyle">
                                                <option>default</option>
                                                <option>primary</option>
                                                <option>success</option>
                                                <option>info</option>
                                                <option>warning</option>
                                                <option>danger</option>
                                                <option>turquoise</option>
                                                <option>emerland</option>
                                                <option>peterriver</option>
                                                <option>amethyst</option>
                                                <option>wetasphalt</option>
                                                <option>greensea</option>
                                                <option>nephritis</option>
                                                <option>belizehole</option>
                                                <option>wisteria</option>
                                                <option>midnightblue</option>
                                                <option>sunflower</option>
                                                <option>carrot</option>
                                                <option>alizarin</option>
                                                <option>clouds</option>
                                                <option>concrete</option>
                                                <option>orange</option>
                                                <option>pumpkin</option>
                                                <option>pomegranate</option>
                                                <option>silver</option>
                                                <option>asbestos</option>

                                                <option>material-red</option>
                                                <option>material-pink</option>
                                                <option>material-purple</option>
                                                <option>material-deeppurple</option>
                                                <option>material-indigo</option>
                                                <option>material-blue</option>
                                                <option>material-lightblue</option>
                                                <option>material-cyan</option>
                                                <option>material-teal</option>
                                                <option>material-green</option>
                                                <option>material-lightgreen</option>
                                                <option>material-lime</option>
                                                <option>material-yellow</option>
                                                <option>material-amber</option>
                                                <option>material-orange</option>
                                                <option>material-deeporange</option>
                                                <option>material-brown</option>
                                                <option>material-grey</option>
                                                <option>material-bluegrey</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p>CPU Temperature Unit</p>
                                        </div>
                                        <div class="col-md-6">
                                            <select id="tempunit-selector">
                                                <option value="C">Celsius</option>
                                                <option value="K">Kelvin</option>
                                                <option value="F">Fahrenheit</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div>
                                                <input type="checkbox" name="bargraphs" id="bargraphs" value="yes">
                                                <label for="bargraphs"><strong>Use new Bar charts on dashboard</strong></label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### Privacy (may be expanded further later on) ######################################################### -->
                <?php
                // Get privacy level from piholeFTL config array
                if (isset($piholeFTLConf["PRIVACYLEVEL"])) {
                    $privacylevel = intval($piholeFTLConf["PRIVACYLEVEL"]);
                } else {
                    $privacylevel = 0;
                }
                ?>
                <div id="privacy" class="tab-pane fade<?php if($tab === "privacy"){ ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-md-12">
                            <form role="form" method="post">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Privacy settings</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-md-12">
                                                <h4>DNS resolver privacy level</h4>
                                                <p>Specify if DNS queries should be anonymized, available options are:</p>
                                                <div>
                                                    <input type="radio" name="privacylevel" id="privacylevel_0" value="0" <?php if ($privacylevel === 0){ ?>checked<?php } ?>>
                                                    <label for="privacylevel_0"><strong>Show everything and record everything</strong></label>
                                                    <p>Gives maximum amount of statistics</p>
                                                </div>
                                                <div>
                                                    <input type="radio" name="privacylevel" id="privacylevel_1" value="1" <?php if ($privacylevel === 1){ ?>checked<?php } ?>>
                                                    <label for="privacylevel_1"><strong>Hide domains: Display and store all domains as "hidden"</strong></label>
                                                    <p>This disables the Top Domains and Top Ads tables on the dashboard</p>
                                                </div>
                                                <div>
                                                    <input type="radio" name="privacylevel" id="privacylevel_2" value="2" <?php if ($privacylevel === 2){ ?>checked<?php } ?>>
                                                    <label for="privacylevel_2"><strong>Hide domains and clients: Display and store all domains as "hidden" and all clients as "0.0.0.0"</strong></label>
                                                    <p>This disables all tables on the dashboard</p>
                                                </div>
                                                <div>
                                                    <input type="radio" name="privacylevel" id="privacylevel_3" value="3" <?php if ($privacylevel === 3){ ?>checked<?php } ?>>
                                                    <label for="privacylevel_3"><strong>Anonymous mode: This disables basically everything except the live anonymous statistics</strong></label>
                                                    <p>No history is saved at all to the database, and nothing is shown in the query log. Also, there are no top item lists.</p>
                                                </div>
                                                <p>The privacy level may be increased at any time without having to restart the DNS resolver. However, note that the DNS resolver needs to be restarted when lowering the privacy level. This restarting is automatically done when saving.</p>
                                                <?php if($privacylevel > 0 && $piHoleLogging){ ?>
                                                <p class="lookatme">Warning: Pi-hole's query logging is activated. Although the dashboard will hide the requested details, all queries are still fully logged to the pihole.log file.</p>
                                                <?php } ?>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="box-footer clearfix">
                                        <input type="hidden" name="field" value="privacyLevel">
                                        <input type="hidden" name="token" value="<?php echo $token ?>">
                                        <button type="submit" class="btn btn-primary pull-right">Apply</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### Teleporter ######################################################### -->
                <div id="teleporter" class="tab-pane fade<?php if($tab === "teleporter"){ ?> in active<?php } ?>">
                    <div class="row">
                        <?php if (extension_loaded('Phar')) { ?>
                        <form role="form" method="post" id="takeoutform"
                              action="scripts/pi-hole/php/teleporter.php"
                              target="_blank" enctype="multipart/form-data">
                            <input type="hidden" name="token" value="<?php echo $token ?>">
                            <div class="col-lg-6 col-md-12">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Backup</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <p>Backup your Pi-hole configuration (settings &amp; lists) as a downloadable archive</p>
                                                <button type="submit" class="btn btn-default">Backup</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-lg-6 col-md-12">
                                <div class="box box-warning">
                                    <div class="box-header with-border">
                                        <h3 class="box-title">Restore</h3>
                                    </div>
                                    <div class="box-body">
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <label>Restore...</label>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-6">
                                                <div>
                                                    <input type="checkbox" name="whitelist" id="tele_whitelist" value="true" checked>
                                                    <label for="tele_whitelist">Whitelist (exact)</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="regex_whitelist" id="tele_regex_whitelist" value="true" checked>
                                                    <label for="tele_regex_whitelist">Whitelist (regex/wildcard)</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="blacklist" id="tele_blacklist" value="true" checked>
                                                    <label for="tele_blacklist">Blacklist (exact)</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="regexlist" id="tele_regexlist" value="true" checked>
                                                    <label for="tele_regexlist">Blacklist (regex/wildcard)</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="adlist" id="tele_adlist" value="true" checked>
                                                    <label for="tele_adlist">Adlists</label>
                                                </div>
                                            </div>
                                            <div class="col-lg-6">
                                                <div>
                                                    <input type="checkbox" name="client" id="tele_client" value="true" checked>
                                                    <label for="tele_client">Client</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="group" id="tele_group" value="true" checked>
                                                    <label for="tele_group">Group</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="auditlog" id="tele_auditlog" value="true" checked>
                                                    <label for="tele_auditlog">Audit log</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="staticdhcpleases" id="tele_staticdhcpleases" value="true" checked>
                                                    <label for="tele_staticdhcpleases">Static DHCP Leases</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="localdnsrecords" id="tele_localdnsrecords" value="true" checked>
                                                    <label for="tele_localdnsrecords">Local DNS Records</label>
                                                </div>
                                                <div>
                                                    <input type="checkbox" name="localcnamerecords" id="tele_localcnamerecords" value="true" checked>
                                                    <label for="tele_localcnamerecords">Local CNAME Records</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <label for="zip_file">File input</label>
                                                <input type="file" name="zip_file" id="zip_file">
                                                <p class="help-block">Upload only Pi-hole backup files.</p>
                                            </div>
                                        </div>
                                        <div class="row">
                                            <div class="col-lg-12">
                                                <div>
                                                    <input type="checkbox" name="flushtables" id="tele_flushtables" value="true" checked>
                                                    <label for="tele_flushtables">Clear existing data</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="box-footer clearfix">
                                        <button type="submit" class="btn btn-default" name="action" value="in">Restore</button>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <?php } else { ?>
                        <div class="col-lg-12">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Teleporter</h3>
                                </div>
                                <div class="box-body">
                                    <p>The PHP extension <code>Phar</code> is not loaded. Please ensure it is installed and loaded if you want to use the Pi-hole teleporter.</p>
                                </div>
                            </div>
                        </div>
                        <?php } ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script src="scripts/vendor/jquery.confirm.min.js?v=<?=$cacheVer?>"></script>
<script src="scripts/pi-hole/js/utils.js?v=<?=$cacheVer?>"></script>
<script src="scripts/pi-hole/js/settings.js?v=<?=$cacheVer?>"></script>

<?php
require "scripts/pi-hole/php/footer.php";
?>
