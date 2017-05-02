<?php
    // Pi-hole DHCP server
    if(isset($setupVars["DHCP_ACTIVE"]))
    {
        if($setupVars["DHCP_ACTIVE"] == 1)
        {
            $DHCP = true;
        }
        else
        {
            $DHCP = false;
        }
        // Read setings from config file
        $DHCPstart = $setupVars["DHCP_START"];
        $DHCPend = $setupVars["DHCP_END"];
        $DHCProuter = $setupVars["DHCP_ROUTER"];
        // This setting has been added later, we have to check if it exists
        if(isset($setupVars["DHCP_LEASETIME"]))
        {
            $DHCPleasetime = $setupVars["DHCP_LEASETIME"];
            if(strlen($DHCPleasetime) < 1)
            {
                // Fallback if empty string
                $DHCPleasetime = 24;
            }
        }
        else
        {
            $DHCPleasetime = 24;
        }
        if(isset($setupVars["DHCP_IPv6"]))
        {
            $DHCPIPv6 = $setupVars["DHCP_IPv6"];
        }
        else
        {
            $DHCPIPv6 = false;
        }

    }
    else
    {
        $DHCP = false;
        // Try to guess initial settings
        if($piHoleIPv4 !== "unknown") {
            $DHCPdomain = explode(".",$piHoleIPv4);
            $DHCPstart  = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".201";
            $DHCPend    = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".251";
            $DHCProuter = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".1";
        }
        else {
            $DHCPstart  = "";
            $DHCPend    = "";
            $DHCProuter = "";
        }
        $DHCPleasetime = 24;
        $DHCPIPv6 = false;
    }
    if(isset($setupVars["PIHOLE_DOMAIN"])){
        $piHoleDomain = $setupVars["PIHOLE_DOMAIN"];
    } else {
        $piHoleDomain = "local";
    }
?>
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Pi-hole DHCP Server</h3>
            </div>
            <div class="box-body">
                <form role="form" method="post">
                <div class="col-md-6">
                    <div class="form-group">
                        <div class="checkbox"><label><input type="checkbox" name="active" <?php if($DHCP){ ?>checked<?php } ?> id="DHCPchk"> DHCP server enabled</label></div>
                    </div>
                </div>
                <div class="col-md-6">
                    <p id="dhcpnotice" <?php if(!$DHCP){ ?>hidden<?php } ?>>Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!</p>
                </div>
                    <div class="col-md-12">
                        <label>Range of IP addresses to hand out</label>
                    </div>
                    <div class="col-md-6">
                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-addon">From</div>
                                <input type="text" class="form-control DHCPgroup" name="from" data-inputmask="'alias': 'ip'" data-mask value="<?php echo $DHCPstart; ?>" <?php if(!$DHCP){ ?>disabled<?php } ?>>
                        </div>
                    </div>
                    </div>
                    <div class="col-md-6">
                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-addon">To</div>
                                <input type="text" class="form-control DHCPgroup" name="to" data-inputmask="'alias': 'ip'" data-mask value="<?php echo $DHCPend; ?>" <?php if(!$DHCP){ ?>disabled<?php } ?>>
                        </div>
                    </div>
                    </div>
                    <div class="col-md-12">
                    <label>Router (gateway) IP address</label>
                    <div class="form-group">
                        <div class="input-group">
                            <div class="input-group-addon">Router</div>
                                <input type="text" class="form-control DHCPgroup" name="router" data-inputmask="'alias': 'ip'" data-mask value="<?php echo $DHCProuter; ?>" <?php if(!$DHCP){ ?>disabled<?php } ?>>
                        </div>
                    </div>
                    </div>
                    <div class="col-md-12">
                    <div class="box box-warning collapsed-box">
                        <div class="box-header with-border">
                            <h3 class="box-title">Advanced DHCP settings</h3>
                            <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
                        </div>
                        <div class="box-body">
                            <div class="col-md-12">
                                <div class="form-group">
                                    <div class="checkbox"><label><input type="checkbox" name="useIPv6" <?php if($DHCPIPv6){ ?>checked<?php } ?> class="DHCPgroup" <?php if(!$DHCP){ ?>disabled<?php } ?>> Enable IPv6 support (SLAAC + RA)</label></div>
                                </div>
                            </div>
                            <div class="col-md-12">
                            <label>Pi-hole domain name</label>
                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon">Domain</div>
                                        <input type="text" class="form-control DHCPgroup" name="domain" value="<?php echo $piHoleDomain; ?>" <?php if(!$DHCP){ ?>disabled<?php } ?>>
                                </div>
                            </div>
                            </div>
                            <div class="col-md-12">
                            <label>DHCP lease time</label>
                            <div class="form-group">
                                <div class="input-group">
                                    <div class="input-group-addon">Lease time in hours</div>
                                        <input type="text" class="form-control DHCPgroup" name="leasetime" id="leasetime" value="<?php echo $DHCPleasetime; ?>" data-inputmask="'mask': '9', 'repeat': 7, 'greedy' : false" data-mask <?php if(!$DHCP){ ?>disabled<?php } ?>>
                                </div>
                            </div>
                                <p>Hint: 0 = infinite, 24 = one day, 168 = one week, 744 = one month, 8760 = one year</p>
                            </div>
                        </div>
                    </div>
                    </div>
<?php
$dhcp_leases = array();
if($DHCP) {
    // Read leases file
    $leasesfile = true;
    $dhcpleases = @fopen('/etc/pihole/dhcp.leases', 'r');
    if(!is_resource($dhcpleases))
        $leasesfile = false;

    function convertseconds($argument) {
        $seconds = round($argument);
        if($seconds < 60)
        {
            return sprintf('%ds', $seconds);
        }
        elseif($seconds < 3600)
        {
            return sprintf('%dm %ds', ($seconds/60), ($seconds%60));
        }
        elseif($seconds < 86400)
        {
            return sprintf('%dh %dm %ds',  ($seconds/3600%24),($seconds/60%60), ($seconds%60));
        }
        else
        {
            return sprintf('%dd %dh %dm %ds', ($seconds/86400), ($seconds/3600%24),($seconds/60%60), ($seconds%60));
        }
    }

    while(!feof($dhcpleases) && $leasesfile)
    {
        $line = explode(" ",trim(fgets($dhcpleases)));
        if(count($line) == 5)
        {
            $counter = intval($line[0]);
            if($counter == 0)
            {
                $time = "Infinite";
            }
            elseif($counter <= 315360000) // 10 years in seconds
            {
                $time = convertseconds($counter);
            }
            else // Assume time stamp
            {
                $time = convertseconds($counter-time());
            }

            if(strpos($line[2], ':') !== false)
            {
                // IPv6 address
                $type = 6;
            }
            else
            {
                // IPv4 lease
                $type = 4;
            }

            $host = $line[3];
            if($host == "*")
            {
                $host = "<i>unknown</i>";
            }

            $clid = $line[4];
            if($clid == "*")
            {
                $clid = "<i>unknown</i>";
            }

            array_push($dhcp_leases,["TIME"=>$time, "hwaddr"=>strtoupper($line[1]), "IP"=>$line[2], "host"=>$host, "clid"=>$clid, "type"=>$type]);
        }
    }
}

readStaticLeasesFile();
?>
                <div class="col-md-12">
                <div class="box box-warning <?php if(!isset($_POST["addstatic"])){ ?>collapsed-box<?php } ?>">
                    <div class="box-header with-border">
                        <h3 class="box-title">DHCP leases</h3>
                        <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse" id="leaseexpand"><i class="fa fa-plus"></i></button></div>
                    </div>
                    <div class="box-body">
                    <div class="col-md-12">
                        <label>Currently active DHCP leases</label>
                        <table id="DHCPLeasesTable" class="table table-striped table-bordered dt-responsive nowrap" cellspacing="0" width="100%">
                            <thead>
                                <tr>
                                    <th>MAC address</th>
                                    <th>IP address</th>
                                    <th>Hostname</th>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($dhcp_leases as $lease) { ?><tr data-placement="auto" data-container="body" data-toggle="tooltip" title="Lease type: IPv<?php echo $lease["type"]; ?><br/>Remaining lease time: <?php echo $lease["TIME"]; ?><br/>DHCP UID: <?php echo $lease["clid"]; ?>"><td id="MAC"><?php echo $lease["hwaddr"]; ?></td><td id="IP"><?php echo $lease["IP"]; ?></td><td id="HOST"><?php echo $lease["host"]; ?></td><td><button class="btn btn-warning btn-xs" type="button" id="button" data-static="alert"><span class="glyphicon glyphicon-copy"></span></button></td></tr><?php } ?>
                            </tbody>
                        </table><br>
                    </div>
                    <div class="col-md-12">
                        <label>Static DHCP leases configuration</label>
                        <table id="DHCPStaticLeasesTable" class="table table-striped table-bordered dt-responsive nowrap" cellspacing="0" width="100%">
                            <thead>
                                <tr>
                                    <th>MAC address</th>
                                    <th>IP address</th>
                                    <th>Hostname</th>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($dhcp_static_leases as $lease) { ?><tr><td><?php echo $lease["hwaddr"]; ?></td><td><?php echo $lease["IP"]; ?></td><td><?php echo $lease["host"]; ?></td><td><?php if(strlen($lease["hwaddr"]) > 0){ ?><button class="btn btn-danger btn-xs" type="submit" name="removestatic" value="<?php echo $lease["hwaddr"]; ?>"><span class="glyphicon glyphicon-trash"></span></button><?php } ?></td></tr><?php } ?>
                            </tbody>
                            <tfoot style="display: table-row-group">
                                <tr><td><input type="text" name="AddMAC"></td><td><input type="text" name="AddIP"></td><td><input type="text" name="AddHostname" value=""></td><td><button class="btn btn-success btn-xs" type="submit" name="addstatic"><span class="glyphicon glyphicon-plus"></span></button></td></tr>
                            </tfoot>
                        </table>
                        <p>Specifying the MAC address is mandatory and only one entry per MAC address is allowed. If the IP address is omitted and a host name is given, the IP address will still be generated dynamically and the specified host name will be used. If the host name is omitted, only a static lease will be added.</p>
                    </div>
                    </div>
                </div>
                </div>
            </div>
            <div class="box-footer">
                <input type="hidden" name="field" value="DHCP">
                <input type="hidden" name="token" value="<?php echo $token ?>">
                <button type="submit" class="btn btn-primary pull-right">Save</button>
            </div>
            </form>
        </div>
