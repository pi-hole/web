<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
	require "scripts/pi-hole/php/header.php";
	require "scripts/pi-hole/php/savesettings.php";
	// Reread ini file as things might have been changed
	$setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
?>
<style type="text/css">
	.tooltip-inner {
		max-width: none;
		white-space: nowrap;
	}
	@-webkit-keyframes Pulse{
		from {color:#630030;-webkit-text-shadow:0 0 9px #333;}
		50% {color:#e33100;-webkit-text-shadow:0 0 18px #e33100;}
		to {color:#630030;-webkit-text-shadow:0 0 9px #333;}
	}
	p.lookatme {
		-webkit-animation-name: Pulse;
		-webkit-animation-duration: 2s;
		-webkit-animation-iteration-count: infinite;
	}
</style>

<?php // Check if ad lists should be updated after saving ...
if(isset($_POST["submit"])) {
	if($_POST["submit"] == "saveupdate") {
	// If that is the case -> refresh to the gravity page and start updating immediately
?>
<meta http-equiv="refresh" content="1;url=gravity.php?go">
<?php }} ?>

<?php if(isset($debug)){ ?>
<div id="alDebug" class="alert alert-warning alert-dismissible fade in" role="alert">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    <h4><i class="icon fa fa-warning"></i> Debug</h4>
    <pre><?php print_r($_POST); ?></pre>
</div>
<?php } ?>

<?php if(strlen($success) > 0){ ?>
<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    <h4><i class="icon fa fa-info"></i> Info</h4>
    <?php echo $success; ?>
</div>
<?php } ?>

<?php if(strlen($error) > 0){ ?>
<div id="alError" class="alert alert-danger alert-dismissible fade in" role="alert">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    <h4><i class="icon fa fa-ban"></i> Error</h4>
    <?php echo $error; ?>
</div>
<?php } ?>

<div class="row">
	<div class="col-md-6">
<?php
	// Networking
	if(isset($setupVars["PIHOLE_INTERFACE"])){
		$piHoleInterface = $setupVars["PIHOLE_INTERFACE"];
	} else {
		$piHoleInterface = "unknown";
	}
	if(isset($setupVars["IPV4_ADDRESS"])){
		$piHoleIPv4 = $setupVars["IPV4_ADDRESS"];
	} else {
		$piHoleIPv4 = "unknown";
	}
	$IPv6connectivity = false;
	if(isset($setupVars["IPV6_ADDRESS"])){
		$piHoleIPv6 = $setupVars["IPV6_ADDRESS"];
			sscanf($piHoleIPv6, "%2[0-9a-f]", $hexstr);
			if(strlen($hexstr) == 2)
			{
				// Convert HEX string to number
				$hex = hexdec($hexstr);
				// Global Unicast Address (2000::/3, RFC 4291)
				$GUA = (($hex & 0x70) === 0x20);
				// Unique Local Address   (fc00::/7, RFC 4193)
				$ULA = (($hex & 0xfe) === 0xfc);
				if($GUA || $ULA)
				{
					// Scope global address detected
					$IPv6connectivity = true;
				}
			}
	} else {
		$piHoleIPv6 = "unknown";
	}
	$hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");
?>
		<div class="box box-warning">
			<div class="box-header with-border">
				<h3 class="box-title">Networking</h3>
			</div>
			<div class="box-body">
				<div class="form-group">
					<label>Pi-hole Ethernet Interface</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleInterface; ?>">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-hole IPv4 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleIPv4; ?>">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-hole IPv6 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleIPv6; ?>">
					</div>
					<?php if (!defined('AF_INET6')){ ?><p style="color: #F00;">Warning: PHP has been compiled without IPv6 support.</p><?php } ?>
				</div>
				<div class="form-group">
					<label>Pi-hole hostname</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-laptop"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $hostname; ?>">
					</div>
				</div>
			</div>
		</div>
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

<?php

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
	</div>
	<div class="col-md-6">
<?php
	// Query logging
	if(isset($setupVars["QUERY_LOGGING"]))
	{
		if($setupVars["QUERY_LOGGING"] == 1)
		{
			$piHoleLogging = true;
		}
		else
		{
			$piHoleLogging = false;
		}
	} else {
		$piHoleLogging = true;
	}
?>
		<div class="box box-primary">
			<div class="box-header with-border">
				<h3 class="box-title">Query Logging<?php if($piHoleLogging) { ?> (size of log <?php echo formatSizeUnits(filesize("/var/log/pihole.log")); ?>)<?php } ?></h3>
			</div>
			<div class="box-body">
				<p>Current status:
				<?php if($piHoleLogging) { ?>
					Enabled (recommended)
				<?php }else{ ?>
					Disabled
				<?php } ?></p>
				<?php if($piHoleLogging) { ?>
					<p>Note that disabling will render graphs on the web user interface useless</p>
				<?php } ?>
			</div>
			<div class="box-footer">
				<form role="form" method="post">
				<button type="button" class="btn btn-default confirm-flushlogs">Flush logs</button>
				<input type="hidden" name="field" value="Logging">
				<input type="hidden" name="token" value="<?php echo $token ?>">
				<?php if($piHoleLogging) { ?>
					<input type="hidden" name="action" value="Disable">
					<button type="submit" class="btn btn-primary pull-right">Disable query logging</button>
				<?php } else { ?>
					<input type="hidden" name="action" value="Enable">
					<button type="submit" class="btn btn-primary pull-right">Enable query logging</button>
				<?php } ?>
				</form>
			</div>
		</div>
<?php
	// Excluded domains in API Query Log call
	if(isset($setupVars["API_EXCLUDE_DOMAINS"]))
	{
		$excludedDomains = explode(",", $setupVars["API_EXCLUDE_DOMAINS"]);
	} else {
		$excludedDomains = [];
	}

	// Exluded clients in API Query Log call
	if(isset($setupVars["API_EXCLUDE_CLIENTS"]))
	{
		$excludedClients = explode(",", $setupVars["API_EXCLUDE_CLIENTS"]);
	} else {
		$excludedClients = [];
	}

	// Exluded clients
	if(isset($setupVars["API_QUERY_LOG_SHOW"]))
	{
		$queryLog = $setupVars["API_QUERY_LOG_SHOW"];
	} else {
		$queryLog = "all";
	}

	// Privacy Mode
	if(isset($setupVars["API_PRIVACY_MODE"]))
	{
		$privacyMode = $setupVars["API_PRIVACY_MODE"];
	} else {
		$privacyMode = false;
	}

?>
        <div class="box box-danger collapsed-box">
            <div class="box-header with-border">
                <h3 class="box-title">Pi-Hole's Block Lists</h3>
                <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
            </div>
            <form role="form" method="post">
                <div class="box-body">
                    <div class="col-lg-12">
                        <label>Lists used to generate Pi-hole's Gravity</label>
                        <?php foreach ($adlist as $key => $value) { ?>
                            <div class="form-group">
                                <div class="checkbox">
                                    <label style="word-break: break-word;">
                                        <input type="checkbox" name="adlist-enable-<?php echo $key; ?>" <?php if($value[0]){ ?>checked<?php } ?>>
                                        <a href="<?php echo htmlentities ($value[1]); ?>" target="_new"><?php echo htmlentities($value[1]); ?></a>
                                        <input type="checkbox" name="adlist-del-<?php echo $key; ?>" hidden>
                                        <br>
                                        <button class="btn btn-danger btn-xs" id="adlist-btn-<?php echo $key; ?>">
                                            <span class="glyphicon glyphicon-trash"></span>
                                        </button>
                                    </label>
                                </div>
                            </div>
                        <?php } ?>
                        <div class="form-group">
                            <textarea name="newuserlists" class="form-control" rows="1" placeholder="Enter one URL per line to add new ad lists"></textarea>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    <input type="hidden" name="field" value="adlists">
                    <input type="hidden" name="token" value="<?php echo $token ?>">
                    <button type="submit" class="btn btn-primary" name="submit" value="save">Save</button>
                    <button type="submit" class="btn btn-primary pull-right" name="submit" value="saveupdate">Save and Update</button>
                </div>
            </form>
        </div>
        <div class="box box-success">
			<div class="box-header with-border">
				<h3 class="box-title">API</h3>
			</div>
			<form role="form" method="post">
			<div class="box-body">
				<h4>Top Lists</h4>
				<p>Exclude the following domains from being shown in</p>
				<div class="col-lg-6">
					<div class="form-group">
					<label>Top Domains / Top Advertisers</label>
					<textarea name="domains" class="form-control" rows="4" placeholder="Enter one domain per line"><?php foreach ($excludedDomains as $domain) { echo $domain."\n"; } ?></textarea>
					</div>
				</div>
				<div class="col-lg-6">
					<div class="form-group">
					<label>Top Clients</label>
					<textarea name="clients" class="form-control" rows="4" placeholder="Enter one IP address or host name per line"><?php foreach ($excludedClients as $client) { echo $client."\n"; } ?></textarea>
					</div>
				</div>
				<h4>Privacy settings (Statistics / Query Log)</h4>
				<div class="col-lg-6">
					<div class="form-group">
						<div class="checkbox"><label><input type="checkbox" name="querylog-permitted" <?php if($queryLog === "permittedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show permitted domain entries</label></div>
					</div>
				</div>
				<div class="col-lg-6">
					<div class="form-group">
						<div class="checkbox"><label><input type="checkbox" name="querylog-blocked" <?php if($queryLog === "blockedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show blocked domain entries</label></div>
					</div>
				</div>
				<h4>Privacy mode</h4>
				<div class="col-lg-12">
					<div class="form-group">
						<div class="checkbox"><label><input type="checkbox" name="privacyMode" <?php if($privacyMode){ ?>checked<?php } ?>> Don't show origin of DNS requests in query log</label></div>
					</div>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="API">
				<input type="hidden" name="token" value="<?php echo $token ?>">
				<button type="button" class="btn btn-primary api-token">Show API token</button>
				<button type="submit" class="btn btn-primary pull-right">Save</button>
			</div>
			</form>
		</div>
<?php
	// CPU temperature unit
	if(isset($setupVars["TEMPERATUREUNIT"]))
	{
		$temperatureunit = $setupVars["TEMPERATUREUNIT"];
	}
	else
	{
		$temperatureunit = "C";
	}
	// Use $boxedlayout value determined in header.php
?>
		<div class="box box-success">
			<div class="box-header with-border">
				<h3 class="box-title">Web User Interface</h3>
			</div>
			<form role="form" method="post">
			<div class="box-body">
<?php /*
				<h4>Query Log Page</h4>
				<div class="col-lg-6">
					<div class="form-group">
						<label>Default value for <em>Show XX entries</em></label>
						<select class="form-control" disabled>
							<option>10</option>
							<option>25</option>
							<option>50</option>
							<option>100</option>
							<option>All</option>
						</select>
					</div>
				</div>
*/ ?>
				<h4>Interface appearance</h4>
				<div class="form-group">
					<div class="checkbox"><label><input type="checkbox" name="boxedlayout" value="yes" <?php if($boxedlayout){ ?>checked<?php } ?> >Use boxed layout (helpful when working on large screens)</label></div>
				</div>
				<h4>CPU Temperature Unit</h4>
				<div class="form-group">
					<div class="radio"><label><input type="radio" name="tempunit" value="C" <?php if($temperatureunit === "C"){ ?>checked<?php } ?> >Celsius</label></div>
					<div class="radio"><label><input type="radio" name="tempunit" value="K" <?php if($temperatureunit === "K"){ ?>checked<?php } ?> >Kelvin</label></div>
					<div class="radio"><label><input type="radio" name="tempunit" value="F" <?php if($temperatureunit === "F"){ ?>checked<?php } ?> >Fahrenheit</label></div>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="webUI">
				<input type="hidden" name="token" value="<?php echo $token ?>">
				<button type="submit" class="btn btn-primary pull-right">Save</button>
			</div>
			</form>
		</div>
<?php /*
		<div class="box box-info">
			<div class="box-header with-border">
				<h3 class="box-title">Blocking Page</h3>
			</div>
			<div class="box-body">
				<p>Show page with details if a site is blocked</p>
				<div class="form-group">
					<div class="radio"><label><input type="radio" name="blockingPage" value="Yes" <?php if($pishowBlockPage){ ?>checked<?php } ?> disabled>Yes</label></div>
					<div class="radio"><label><input type="radio" name="blockingPage" value="No" <?php if(!$pishowBlockPage){ ?>checked<?php } ?> disabled>No</label></div>
					<p>If Yes: Hide content for in page ads?</p>
					<div class="checkbox"><label><input type="checkbox" <?php if($pishowBlockPageInpage) { ?>checked<?php } ?> disabled>Enabled (recommended)</label></div>
				</div>
			</div>
		</div>
*/ ?>
		<div class="box box-danger">
			<div class="box-header with-border">
				<h3 class="box-title">System Administration</h3>
			</div>
			<div class="box-body">
				<button type="button" class="btn btn-default confirm-reboot">Restart system</button>
				<button type="button" class="btn btn-default confirm-restartdns">Restart DNS server</button>
				<button type="button" class="btn btn-default confirm-flushlogs">Flush logs</button>

				<form role="form" method="post" id="rebootform">
					<input type="hidden" name="field" value="reboot">
					<input type="hidden" name="token" value="<?php echo $token ?>">
				</form>
				<form role="form" method="post" id="restartdnsform">
					<input type="hidden" name="field" value="restartdns">
					<input type="hidden" name="token" value="<?php echo $token ?>">
				</form>
				<form role="form" method="post" id="flushlogsform">
					<input type="hidden" name="field" value="flushlogs">
					<input type="hidden" name="token" value="<?php echo $token ?>">
				</form>
			</div>
		</div>
<?php
if($FTL)
{
	function get_FTL_data($arg)
	{
		global $FTLpid;
		return trim(exec("ps -p ".$FTLpid." -o ".$arg));
	}
	$FTLversion = exec("/usr/bin/pihole-FTL version");
}
?>
		<div class="box box-danger collapsed-box">
			<div class="box-header with-border">
				<h3 class="box-title">Pi-hole FTL (<?php if($FTL){ ?>Running<?php }else{ ?>Not running<?php } ?>)</h3>
				<div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
			</div>
			<div class="box-body">
				<?php if($FTL){ ?>FTL version: <?php echo $FTLversion; ?><br>
				Process identifier (PID): <?php echo $FTLpid; ?><br>
				Time FTL started: <?php print_r(get_FTL_data("start")); ?><br>
				User / Group: <?php print_r(get_FTL_data("euser")); ?> / <?php print_r(get_FTL_data("egroup")); ?><br>
				Total CPU utilization: <?php print_r(get_FTL_data("%cpu")); ?>%<br>
				Memory utilization: <?php print_r(get_FTL_data("%mem")); ?>%<br>
				<span title="Resident memory is the portion of memory occupied by a process that is held in main memory (RAM). The rest of the occupied memory exists in the swap space or file system.">Used memory: <?php echo formatSizeUnits(1e3*floatval(get_FTL_data("rss"))); ?></span><br>
				<?php } ?>
			</div>
		</div>
		<div class="box box-danger collapsed-box">
			<div class="box-header with-border">
				<h3 class="box-title">Pi-hole Teleporter</h3>
				<div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
			</div>
			<div class="box-body">
			<?php if (extension_loaded('zip')) { ?>
				<form role="form" method="post" id="takeoutform" action="scripts/pi-hole/php/teleporter.php" target="_blank"  enctype="multipart/form-data">
					<input type="hidden" name="token" value="<?php echo $token ?>">
					<div class="col-lg-12">
						<p>Export your Pi-hole lists as downloadable ZIP file</p>
						<button type="submit" class="btn btn-default">Export</button>
					<hr>
					</div>
					<div class="col-lg-6">
					<label>Import ...</label>
						<div class="form-group">
							<div class="checkbox">
							<label><input type="checkbox" name="whitelist" value="true" checked> Whitelist</label>
							</div>
							<div class="checkbox">
							<label><input type="checkbox" name="blacklist" value="true" checked> Blacklist (exact)</label>
							</div>
							<div class="checkbox">
							<label><input type="checkbox" name="wildlist" value="true" checked> Blacklist (wildcard)</label>
							</div>
						</div>
					</div>
					<div class="col-lg-6">
						<div class="form-group">
							<label for="zip_file">File input</label>
							<input type="file" name="zip_file" id="zip_file">
							<p class="help-block">Upload only Pi-hole backup files.</p>
							<button type="submit" class="btn btn-default" name="action" value="in">Import</button>
						</div>
					</div>
				</form>
			<?php } else { ?>
				<p>The PHP extension <code>zip</code> is not loaded. Please ensure it is installed and loaded if you want to use the Pi-hole teleporter.</p>
			<?php } ?>
			</div>
		</div>
	</div>
</div>

<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/vendor/jquery.inputmask.js"></script>
<script src="scripts/vendor/jquery.inputmask.extensions.js"></script>
<script src="scripts/vendor/jquery.confirm.min.js"></script>
<script src="scripts/pi-hole/js/settings.js"></script>
