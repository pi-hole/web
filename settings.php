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

<?php
	$includeWidget = "";

	$settingsWidget = $_GET["w"];
	
	$settingsWidgets = array(
		"networking"	=> "scripts/pi-hole/php/settings_networking.php",
		"dhcp"			=> "scripts/pi-hole/php/settings_dhcp.php",
		"upstream_dns"	=> "scripts/pi-hole/php/settings_upstream_dns.php",
		"querylogging"	=> "scripts/pi-hole/php/settings_querylogging.php",
		"blocklist"		=> "scripts/pi-hole/php/settings_blocklist.php",
		"api"			=> "scripts/pi-hole/php/settings_api.php",
		"webui"			=> "scripts/pi-hole/php/settings_webui.php",
		"sysadmin"		=> "scripts/pi-hole/php/settings_sysadmin.php",
		"ftl"			=> "scripts/pi-hole/php/settings_ftl.php",
		"teleporter"	=> "scripts/pi-hole/php/settings_teleporter.php",
	);
	
	$includeWidget = $settingsWidgets[$settingsWidget];
	
?>
<div class="row">
	
	<?php
		if (!empty($includeWidget)) {
			/* 
			 * Tell included widget that it can expand sections
			 */
			$collapse = FALSE;
	?>
    <div class="col-md-12">
		<?php require $includeWidget; ?>
	</div>
	<?php
		}
		else {
			/* 
			 * Tell included widget to not expand sections
			 */
			$collapse = TRUE;
	?>
	<div class="col-md-6">
		
		<?php require 'scripts/pi-hole/php/settings_networking.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_dhcp.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_upstream_dns.php' ?>

	</div>
	<div class="col-md-6">
		
		<?php require 'scripts/pi-hole/php/settings_querylogging.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_blocklist.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_api.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_webui.php' ?>

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
		
		<?php require 'scripts/pi-hole/php/settings_sysadmin.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_ftl.php' ?>
		
		<?php require 'scripts/pi-hole/php/settings_teleporter.php' ?>
		
	</div>
	
	<?php
		}
	?>

</div>

<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/vendor/jquery.inputmask.js"></script>
<script src="scripts/vendor/jquery.inputmask.extensions.js"></script>
<script src="scripts/vendor/jquery.confirm.min.js"></script>
<script src="scripts/pi-hole/js/settings.js"></script>
