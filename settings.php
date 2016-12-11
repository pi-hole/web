<?php
	require "header.php";

	// Reread ini file as things might have been changed
	$setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
?>
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
	// DNS settings
	$primaryDNSservers = [
			"8.8.8.8" => "Google",
			"208.67.222.222" => "OpenDNS",
			"4.2.2.1" => "Level3",
			"199.85.126.10" => "Norton",
			"8.26.56.26" => "Comodo"
		];

	$secondaryDNSservers = [
			"8.8.4.4" => "Google",
			"208.67.220.220" => "OpenDNS",
			"4.2.2.2" => "Level3",
			"199.85.127.10" => "Norton",
			"8.20.247.20" => "Comodo"
		];

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
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Google"  <?php if($piHoleDNS1 === "Google" ){ ?>checked<?php } ?> >Google</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="OpenDNS" <?php if($piHoleDNS1 === "OpenDNS"){ ?>checked<?php } ?> >OpenDNS</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Level3"  <?php if($piHoleDNS1 === "Level3" ){ ?>checked<?php } ?> >Level3</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Norton"  <?php if($piHoleDNS1 === "Norton" ){ ?>checked<?php } ?> >Norton ConnectSafe</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Comodo"  <?php if($piHoleDNS1 === "Comodo" ){ ?>checked<?php } ?> >Comodo Secure</label></div>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="primaryDNS" value="Custom"
							<?php if($piHoleDNS1 === "Custom"){ ?>checked<?php } ?>></div>
							<input type="text" class="form-control" data-inputmask="'alias': 'ip'" data-mask>
						</div>
					</div>
				</div>
				<div class="col-lg-6">
					<label>Secondary DNS Server</label>
					<div class="form-group">
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Google"  <?php if($piHoleDNS2 === "Google" ){ ?>checked<?php } ?> >Google</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="OpenDNS" <?php if($piHoleDNS2 === "OpenDNS"){ ?>checked<?php } ?> >OpenDNS</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Level3"  <?php if($piHoleDNS2 === "Level3" ){ ?>checked<?php } ?> >Level3</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Norton"  <?php if($piHoleDNS2 === "Norton" ){ ?>checked<?php } ?> >Norton ConnectSafe</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Comodo"  <?php if($piHoleDNS2 === "Comodo" ){ ?>checked<?php } ?> >Comodo Secure</label></div>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="primaryDNS" value="Custom"
							<?php if($piHoleDNS2 === "Custom"){ ?>checked<?php } ?>></div>
							<input type="text" class="form-control" data-inputmask="'alias': 'ip'" data-mask
							<?php if($piHoleDNS2 === "Custom"){ ?>value="<?php echo $setupVars["PIHOLE_DNS_2"]; ?>"<?php } ?>>
						</div>
					</div>
				</div>
			</div>
			<div class="box-footer">
				<button type="submit" class="btn btn-primary pull-right">Save</button>
			</div>
			</form>
		</div>
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
				<div class="form-group">
					<div class="checkbox"><label><input type="checkbox" <?php if($piHoleLogging) { ?>checked<?php } ?>>Enabled (recommended)</label></div>
				</div>
				Note that disabling will render graphs on the web user interface useless
				</form>
			</div>
		</div>
	</div>
<?php
	// Exluded domains
	if(isset($setupVars["WEBUI_EXCLUDE_DOMAINS"]))
	{
		$excludedDomains = explode(",", $setupVars["WEBUI_EXCLUDE_DOMAINS"]);
	} else {
		$excludedDomains = "";
	}

	// Exluded clients
	if(isset($setupVars["WEBUI_EXCLUDE_CLIENTS"]))
	{
		$excludedClients = explode(",", $setupVars["WEBUI_EXCLUDE_CLIENTS"]);
	} else {
		$excludedClients = "";
	}
?>
	<div class="col-md-6">
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
					<textarea class="form-control" rows="4" placeholder="Enter one domain per line"><?php foreach ($excludedDomains as $domain) { echo $domain."\n"; } ?></textarea>
					</div>
				</div>
				<div class="col-lg-6">
					<div class="form-group">
					<label>Top Clients</label>
					<textarea class="form-control" rows="4" placeholder="Enter one domain per line"><?php foreach ($excludedClient as $client) { echo $client."\n"; } ?></textarea>
					</div>
				</div>
			</div>
			<div class="box-footer">
				<button type="submit" class="btn btn-primary pull-right">Save</button>
			</div>
			</form>
		</div>
		<div class="box box-success">
			<div class="box-header with-border">
				<h3 class="box-title">Web User Interface</h3>
			</div>
			<form role="form" method="post">
			<div class="box-body">
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
				<h4>CPU Temperature Unit</h4>
				<div class="form-group">
					<div class="radio"><label><input type="radio" name="temperature" value="C" <?php if($temperatureunit === "C"){ ?>checked<?php } ?> >Celsius</label></div>
					<div class="radio"><label><input type="radio" name="temperature" value="F" <?php if($temperatureunit === "F"){ ?>checked<?php } ?> >Fahrenheit</label></div>
				</div>
			</div>
			</form>
		</div>
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
		<div class="box box-danger">
			<div class="box-header with-border">
				<h3 class="box-title">System Administration</h3>
			</div>
			<div class="box-body">
				<button type="submit" class="btn btn-default" disabled>Restart system</button>
				<button type="submit" class="btn btn-default" disabled>Restart DNS server</button>
				<button type="submit" class="btn btn-default" disabled>Flush logs</button>
			</div>
		</div>
	</div>
</div>

<?php
    require "footer.php";
?>
<script src="js/other/jquery.inputmask.js"></script>
<script src="js/other/jquery.inputmask.extensions.js"></script>
<script src="js/pihole/settings.js"></script>

