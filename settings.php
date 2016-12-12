<?php
	require "header.php";
	require "php/savesettings.php";
	// Reread ini file as things might have been changed
	$setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
?>
<div class="row">
	<div class="col-md-6"><p>Debug output: <?php print_r($debug); ?></p></div>
	<div class="col-md-6"><p>Error output: <?php print_r($error); ?></p></div>
</div>

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
	if(isset($setupVars["IPV6_ADDRESS"])){
		$piHoleIPv6 = $setupVars["IPV6_ADDRESS"];
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
					<label>Pi-Hole Ethernet Interface</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleInterface; ?>">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-Hole IPv4 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleIPv4; ?>">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-Hole IPv6 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $piHoleIPv6; ?>">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-Hole hostname</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-laptop"></i></div>
						<input type="text" class="form-control" disabled value="<?php echo $hostname; ?>">
					</div>
				</div>
			</div>
		</div>
<?php
	// Pi-Hole DHCP server
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
	}
	else
	{
		$DHCP = false;
		// Try to guess initial settings
		$DHCPdomain = explode(".",$piHoleIPv4);
		$DHCPstart  = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".201";
		$DHCPend    = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".251";
		$DHCProuter = $DHCPdomain[0].".".$DHCPdomain[1].".".$DHCPdomain[2].".1";
	}
?>
		<div class="box box-warning">
			<div class="box-header with-border">
				<h3 class="box-title">Pi-Hole DHCP Server</h3>
			</div>
			<div class="box-body">
				<form role="form" method="post">
				<div class="form-group">
					<div class="checkbox"><label><input type="checkbox" name="active" <?php if($DHCP){ ?>checked<?php } ?> id="DHCPchk"> DHCP server enabled</label></div>
				</div>
				<label>Range of IP addresses to hand out</label>
				<div class="form-group">
					<div class="col-md-6">
						<div class="input-group">
							<div class="input-group-addon">From</div>
								<input type="text" class="form-control DHCPgroup" name="from" value="<?php echo $DHCPstart; ?>" data-inputmask="'alias': 'ip'" data-mask>
					</div>
					</div>
					<div class="col-md-6">
						<div class="input-group">
							<div class="input-group-addon">To</div>
								<input type="text" class="form-control DHCPgroup" name="to" value="<?php echo $DHCPend; ?>" data-inputmask="'alias': 'ip'" data-mask>
						</div>
					</div>
					<label>Router IP address</label>
					<div class="col-md-12">
						<div class="input-group">
							<div class="input-group-addon">Router</div>
								<input type="text" class="form-control DHCPgroup" name="router" value="<?php echo $DHCProuter; ?>" data-inputmask="'alias': 'ip'" data-mask>
						</div>
					</div><br/>
<?php if($DHCP) { ?>
					<label>DHCP leases</label>
					<div class="col-md-12">
							<pre style=" height: 10em; overflow-y: scroll;"><?php echo file_get_contents("/etc/pihole/dhcp.leases"); ?></pre>

					</div>
<?php } ?>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="DHCP">
				<button type="submit" class="btn btn-primary pull-right">Save</button>
			</div>
			</form>
		</div>

<?php
	// DNS settings
	if(isset($setupVars["PIHOLE_DNS_1"])){
		if(isset($primaryDNSservers[$setupVars["PIHOLE_DNS_1"]]))
		{
			$piHoleDNS1 = $primaryDNSservers[$setupVars["PIHOLE_DNS_1"]];
		}
		else
		{
			$piHoleDNS1 = "Custom";
		}
	} else {
		$piHoleDNS1 = "unknown";
	}

	if(isset($setupVars["PIHOLE_DNS_2"])){
		if(isset($secondaryDNSservers[$setupVars["PIHOLE_DNS_2"]]))
		{
			$piHoleDNS2 = $secondaryDNSservers[$setupVars["PIHOLE_DNS_2"]];
		}
		else
		{
			$piHoleDNS2 = "Custom";
		}
	} else {
		$piHoleDNS2 = "unknown";
	}
?>
		<div class="box box-warning">
			<div class="box-header with-border">
				<h3 class="box-title">Upstream DNS Servers</h3>
			</div>
			<div class="box-body">
				<form role="form" method="post">
				<div class="col-lg-6">
					<label>Primary DNS Server</label>
					<div class="form-group">
						<?php foreach ($primaryDNSservers as $key => $value) { ?> <div class="radio"><label><input type="radio" name="primaryDNS" value="<?php echo $value;?>" <?php if($piHoleDNS1 === $value){ ?>checked<?php } ?> ><?php echo $value;?> (<?php echo $key;?>)</label></div> <?php } ?>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="primaryDNS" value="Custom"
							<?php if($piHoleDNS1 === "Custom"){ ?>checked<?php } ?>></div>
							<input type="text" name="DNS1IP" class="form-control" data-inputmask="'alias': 'ip'" data-mask
							<?php if($piHoleDNS1 === "Custom"){ ?>value="<?php echo $setupVars["PIHOLE_DNS_1"]; ?>"<?php } ?>>
						</div>
					</div>
				</div>
				<div class="col-lg-6">
					<label>Secondary DNS Server</label>
					<div class="form-group">
						<?php foreach ($secondaryDNSservers as $key => $value) { ?> <div class="radio"><label><input type="radio" name="secondaryDNS" value="<?php echo $value;?>" <?php if($piHoleDNS2 === $value){ ?>checked<?php } ?> ><?php echo $value;?> (<?php echo $key;?>)</label></div> <?php } ?>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="secondaryDNS" value="Custom"
							<?php if($piHoleDNS2 === "Custom"){ ?>checked<?php } ?>></div>
							<input type="text" name="DNS2IP" class="form-control" data-inputmask="'alias': 'ip'" data-mask
							<?php if($piHoleDNS2 === "Custom"){ ?>value="<?php echo $setupVars["PIHOLE_DNS_2"]; ?>"<?php } ?>>
						</div>
					</div>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="DNS">
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
				<h3 class="box-title">Query Logging</h3>
			</div>
			<div class="box-body">
				<form role="form" method="post">
				<p>Current status:
				<?php if($piHoleLogging) { ?>
					Enabled (recommended)
				<?php }else{ ?>
					Disabled
				<?php } ?></p>
				<input type="hidden" name="field" value="Logging">
				<?php if($piHoleLogging) { ?>
					<p>Note that disabling will render graphs on the web user interface useless</p>
				<?php } ?>
				</form>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="DNS">
				<?php if($piHoleLogging) { ?>
					<input type="hidden" name="action" value="Disable">
					<button type="submit" class="btn btn-primary pull-right">Disable query logging</button>
				<?php } else { ?>
					<input type="hidden" name="action" value="Enable">
					<button type="submit" class="btn btn-primary pull-right">Enable query logging</button>
				<?php } ?>
			</div>
		</div>
<?php
	// Exluded domains
	if(isset($setupVars["API_EXCLUDE_DOMAINS"]))
	{
		$excludedDomains = explode(",", $setupVars["API_EXCLUDE_DOMAINS"]);
	} else {
		$excludedDomains = "";
	}

	// Exluded clients
	if(isset($setupVars["API_EXCLUDE_CLIENTS"]))
	{
		$excludedClients = explode(",", $setupVars["API_EXCLUDE_CLIENTS"]);
	} else {
		$excludedClients = "";
	}

	// Exluded clients
	if(isset($setupVars["API_QUERY_LOG_SHOW"]))
	{
		$queryLog = $setupVars["API_QUERY_LOG_SHOW"];
	} else {
		$queryLog = "all";
	}
?>
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
					<textarea name="clients" class="form-control" rows="4" placeholder="Enter one domain per line"><?php foreach ($excludedClients as $client) { echo $client."\n"; } ?></textarea>
					</div>
				</div>
				<h4>Query Log</h4>
				<div class="form-group">
					<div class="checkbox"><label><input type="checkbox" name="querylog-permitted" <?php if($queryLog === "permittedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show permitted queries</label></div>
					<div class="checkbox"><label><input type="checkbox" name="querylog-blocked" <?php if($queryLog === "blockedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show blocked queries</label></div>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="API">
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
						<div class="checkbox"><label><input type="checkbox" disabled> Show permitted queries</label></div>
						<div class="checkbox"><label><input type="checkbox" disabled> Show blocked queries</label></div>
					</div>
				</div>
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
				<h4>CPU Temperature Unit</h4>
				<div class="form-group">
					<div class="radio"><label><input type="radio" name="tempunit" value="C" <?php if($temperatureunit === "C"){ ?>checked<?php } ?> >Celsius</label></div>
					<div class="radio"><label><input type="radio" name="tempunit" value="F" <?php if($temperatureunit === "F"){ ?>checked<?php } ?> >Fahrenheit</label></div>
				</div>
			</div>
			<div class="box-footer">
				<input type="hidden" name="field" value="webUI">
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
			</div>
		</div>
	</div>
</div>

<?php
    require "footer.php";
?>
<script src="js/other/jquery.inputmask.js"></script>
<script src="js/other/jquery.inputmask.extensions.js"></script>
<script src="js/other/jquery.confirm.min.js"></script>
<script src="js/pihole/settings.js"></script>

