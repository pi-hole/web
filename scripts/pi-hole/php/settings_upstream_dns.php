<?php

    // Ensure this script can only be included from settings.php
    if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
    {
        die("Direct access to this script is forbidden!");
    }

    // DNS settings
    $DNSservers = [];
    $DNSactive = [];

    $i = 1;
    while(isset($setupVars["PIHOLE_DNS_".$i])){
        if(isinserverlist($setupVars["PIHOLE_DNS_".$i]))
        {
            array_push($DNSactive,$setupVars["PIHOLE_DNS_".$i]);
        }
        elseif(strpos($setupVars["PIHOLE_DNS_".$i],"."))
        {
            if(!isset($custom1))
            {
                $custom1 = $setupVars["PIHOLE_DNS_".$i];
            }
            else
            {
                $custom2 = $setupVars["PIHOLE_DNS_".$i];
            }
        }
        elseif(strpos($setupVars["PIHOLE_DNS_".$i],":"))
        {
            if(!isset($custom3))
            {
                $custom3 = $setupVars["PIHOLE_DNS_".$i];
            }
            else
            {
                $custom4 = $setupVars["PIHOLE_DNS_".$i];
            }
        }
        $i++;
    }

    if(isset($setupVars["DNS_FQDN_REQUIRED"])){
        if($setupVars["DNS_FQDN_REQUIRED"])
        {
            $DNSrequiresFQDN = true;
        }
        else
        {
            $DNSrequiresFQDN = false;
        }
    } else {
        $DNSrequiresFQDN = true;
    }

    if(isset($setupVars["DNS_BOGUS_PRIV"])){
        if($setupVars["DNS_BOGUS_PRIV"])
        {
            $DNSbogusPriv = true;
        }
        else
        {
            $DNSbogusPriv = false;
        }
    } else {
        $DNSbogusPriv = true;
    }

    if(isset($setupVars["DNSSEC"])){
        if($setupVars["DNSSEC"])
        {
            $DNSSEC = true;
        }
        else
        {
            $DNSSEC = false;
        }
    } else {
        $DNSSEC = false;
    }

    if(isset($setupVars["DNSMASQ_LISTENING"])){
        if($setupVars["DNSMASQ_LISTENING"] === "single")
        {
            $DNSinterface = "single";
        }
        elseif($setupVars["DNSMASQ_LISTENING"] === "all")
        {
            $DNSinterface = "all";
        }
        else
        {
            $DNSinterface = "local";
        }
    } else {
        $DNSinterface = "single";
    }
?>
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Upstream DNS Servers</h3>
            </div>
            <div class="box-body">
                <form role="form" method="post">
                <div class="col-lg-6">
                    <label>Upstream DNS Servers</label>
                    <table class="table table-bordered">
                        <tr>
                            <th colspan="2">IPv4</th>
                            <th colspan="2">IPv6</th>
                            <th>Name</th>
                        </tr>
                        <?php foreach ($DNSserverslist as $key => $value) { ?>
                        <tr>
                            <?php if(isset($value["v4_1"])) { ?>
                            <td title="<?php echo $value["v4_1"];?>"><input type="checkbox" name="DNSserver<?php echo $value["v4_1"];?>" value="true" <?php if(in_array($value["v4_1"],$DNSactive)){ ?>checked<?php } ?> ></td><?php }else{ ?><td></td><?php } ?>
                            <?php if(isset($value["v4_2"])) { ?>
                            <td title="<?php echo $value["v4_2"];?>"><input type="checkbox" name="DNSserver<?php echo $value["v4_2"];?>" value="true" <?php if(in_array($value["v4_2"],$DNSactive)){ ?>checked<?php } ?> ></td><?php }else{ ?><td></td><?php } ?>
                            <?php if(isset($value["v6_1"])) { ?>
                            <td title="<?php echo $value["v6_1"];?>"><input type="checkbox" name="DNSserver<?php echo $value["v6_1"];?>" value="true" <?php if(in_array($value["v6_1"],$DNSactive) && $IPv6connectivity){ ?>checked<?php } if(!$IPv6connectivity){ ?> disabled <?php } ?> ></td><?php }else{ ?><td></td><?php } ?>
                            <?php if(isset($value["v6_2"])) { ?>
                            <td title="<?php echo $value["v6_2"];?>"><input type="checkbox" name="DNSserver<?php echo $value["v6_2"];?>" value="true" <?php if(in_array($value["v6_2"],$DNSactive) && $IPv6connectivity){ ?>checked<?php } if(!$IPv6connectivity){ ?> disabled <?php } ?> ></td><?php }else{ ?><td></td><?php } ?>
                            <td><?php echo $key;?></td>
                        </tr>
                        <?php } ?>
                    </table>
                </div>
                <div class="col-lg-6">
                    <label>&nbsp;</label>
                    <div class="form-group">
                        <label>Custom 1 (IPv4)</label>
                        <div class="input-group">
                            <div class="input-group-addon"><input type="checkbox" name="custom1" value="Customv4"
                            <?php if(isset($custom1)){ ?>checked<?php } ?>></div>
                            <input type="text" name="custom1val" class="form-control" data-inputmask="'alias': 'ip'" data-mask <?php if(isset($custom1)){ ?>value="<?php echo $custom1; ?>"<?php } ?>>
                        </div>
                        <label>Custom 2 (IPv4)</label>
                        <div class="input-group">
                            <div class="input-group-addon"><input type="checkbox" name="custom2" value="Customv4"
                            <?php if(isset($custom2)){ ?>checked<?php } ?>></div>
                            <input type="text" name="custom2val" class="form-control" data-inputmask="'alias': 'ip'" data-mask <?php if(isset($custom2)){ ?>value="<?php echo $custom2; ?>"<?php } ?>>
                        </div>
                        <label>Custom 3 (IPv6)</label>
                        <div class="input-group">
                            <div class="input-group-addon"><input type="checkbox" name="custom3" value="Customv6"
                            <?php if(isset($custom3)){ ?>checked<?php } ?>></div>
                            <input type="text" name="custom3val" class="form-control" data-inputmask="'alias': 'ipv6'" data-mask <?php if(isset($custom3)){ ?>value="<?php echo $custom3; ?>"<?php } ?>>
                        </div>
                        <label>Custom 4 (IPv6)</label>
                        <div class="input-group">
                            <div class="input-group-addon"><input type="checkbox" name="custom4" value="Customv6"
                            <?php if(isset($custom4)){ ?>checked<?php } ?>></div>
                            <input type="text" name="custom4val" class="form-control" data-inputmask="'alias': 'ipv6'" data-mask <?php if(isset($custom4)){ ?>value="<?php echo $custom4; ?>"<?php } ?>>
                        </div>
                    </div>
                </div>
                <div class="col-lg-12">
                <div class="box box-warning collapsed-box">
                    <div class="box-header with-border">
                        <h3 class="box-title">Advanced DNS settings</h3>
                        <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
                    </div>
                    <div class="box-body">
                        <div class="col-lg-12">
                            <div class="form-group">
                                <div class="checkbox"><label><input type="checkbox" name="DNSrequiresFQDN" <?php if($DNSrequiresFQDN){ ?>checked<?php } ?> title="domain-needed"> never forward non-FQDNs</label></div>
                            </div>
                            <div class="form-group">
                                <div class="checkbox"><label><input type="checkbox" name="DNSbogusPriv" <?php if($DNSbogusPriv){ ?>checked<?php } ?> title="bogus-priv"> never forward reverse lookups for private IP ranges</label></div>
                            </div>
                            <p>Note that enabling these two options may increase your privacy slightly, but may also prevent you from being able to access local hostnames if the Pi-hole is not used as DHCP server</p>
                            <div class="form-group">
                                <div class="checkbox"><label><input type="checkbox" name="DNSSEC" <?php if($DNSSEC){ ?>checked<?php } ?>> Use DNSSEC</label></div>
                            </div>
                            <p>Validate DNS replies and cache DNSSEC data. When forwarding DNS queries, Pi-hole requests the DNSSEC records needed to  validate the replies. Use Google or Norton DNS servers when activating DNSSEC. Note that the size of your log might increase significantly when enabling DNSSEC. A DNSSEC resolver test can be found <a href="http://dnssec.vs.uni-due.de/" target="_blank">here</a>.</p>

                            <div class="form-group">
                            <label>Interface listening behavior</label>
                                <div class="radio">
                                    <label><input type="radio" name="DNSinterface" value="local" <?php if($DNSinterface == "local"){ ?>checked<?php } ?> >Listen on all interfaces, but allow only queries from devices that are at most one hop away (local devices)</label>
                                </div>
                                <div class="radio">
                                    <label><input type="radio" name="DNSinterface" value="single" <?php if($DNSinterface == "single"){ ?>checked<?php } ?> >Listen only on interface <?php echo $piHoleInterface; ?></label>
                                </div>
                                <div class="radio">
                                    <label><input type="radio" name="DNSinterface" value="all" <?php if($DNSinterface == "all"){ ?>checked<?php } ?> >Listen on all interfaces, permit all origins (make sure your Pi-hole is firewalled!)</label>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
                </div>
            </div>
            <div class="box-footer">
                <input type="hidden" name="field" value="DNS">
                <input type="hidden" name="token" value="<?php echo $token ?>">
                <button type="submit" class="btn btn-primary pull-right">Save</button>
            </div>
            </form>
        </div>
