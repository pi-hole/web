<?php
    require "header.php";
?>
<div class="row">
	<div class="col-md-6">
		<div class="box box-info">
			<div class="box-header with-border">
				<h3 class="box-title">Networking</h3>
			</div>
			<div class="box-body">
				<form role="form">
				<div class="form-group">
					<label>Pi-Hole Ethernet Interface</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<select class="form-control" disabled>
							<option>eth0</option>
						</select>
					</div>
				</div>
				<div class="form-group">
					<label>Pi-Hole IPv4 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="192.168.2.10/24">
					</div>
				</div>
				<div class="form-group">
					<label>Pi-Hole IPv6 address</label>
					<div class="input-group">
						<div class="input-group-addon"><i class="fa fa-plug"></i></div>
						<input type="text" class="form-control" disabled value="">
					</div>
				</div>
				</form>
			</div>
		</div>

		<div class="box box-warning">
			<div class="box-header with-border">
				<h3 class="box-title">Upstream DNS Servers</h3>
			</div>
			<div class="box-body">
				<form role="form">
				<div class="col-lg-6">
					<label>Primary DNS Server</label>
					<div class="form-group">
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Google" checked>Google</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="OpenDNS">OpenDNS</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Level3">Level3</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Norton">Norton</label></div>
						<div class="radio"><label><input type="radio" name="primaryDNS" value="Comodo">Comodo</label></div>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="primaryDNS" value="Custom"></div>
							<input type="text" class="form-control" data-inputmask="'alias': 'ip'" data-mask>
						</div>
					</div>
				</div>
				<div class="col-lg-6">
					<label>Secondary DNS Server</label>
					<div class="form-group">
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Google" checked>Google</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="OpenDNS">OpenDNS</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Level3">Level3</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Norton">Norton</label></div>
						<div class="radio"><label><input type="radio" name="secondaryDNS" value="Comodo">Comodo</label></div>
						<label>Custom</label>
						<div class="input-group">
							<div class="input-group-addon"><input type="radio" name="secondaryDNS" value="Custom"></div>
							<input type="text" class="form-control" data-inputmask="'alias': 'ip'" data-mask>
						</div>
					</div>
				</div>
				</form>
			</div>
		</div>
		<div class="box box-primary">
			<div class="box-header with-border">
				<h3 class="box-title">Query Logging</h3>
			</div>
			<div class="box-body">
				<form role="form">
				<div class="form-group">
					<div class="checkbox">
						<label><input type="checkbox" checked>Enabled (recommended)</label>
					</div>
				</div>
				Note that disabling will render graphs on the web user interface useless
				</form>
			</div>
		</div>
	</div>
	<div class="col-md-6">
		<div class="box box-success">
			<div class="box-header with-border">
				<h3 class="box-title">Web User Interface</h3>
			</div>
			<div class="box-body">
				<label>Exclude the following domains from being shown in</label>
				<form role="form">
					<div class="col-lg-6">
						<div class="form-group">
						<label>Top Domains / Top Advertisers</label>
						<div class="input-group">
							<div class="input-group-addon"><i class="fa fa-ban"></i></div>
							<select class="form-control" multiple>
								<option>ssl.google-analytics.com</option>
								<option>www.googleadservices.com</option>
								<option>www.google-analytics.com</option>
								<option>csi.gstatic.com</option>
								<option>fls-eu.amazon.com</option>
								<option>collector.githubapp.com</option>
								<option>pagead2.googlesyndication.com</option>
								<option></option>
								<option></option>
							</select>
						</div>
						</div>
					</div>
					<div class="col-lg-6">
						<div class="form-group">
						<label>Top Clients</label>
						<div class="input-group">
							<div class="input-group-addon"><i class="fa fa-ban"></i></div>
							<select class="form-control" multiple>
								<option>192.168.2.10</option>
								<option>192.168.2.12</option>
								<option>192.168.2.15</option>
								<option>192.168.2.17</option>
								<option>192.168.2.16</option>
								<option>192.168.2.19</option>
							</select>
						</div>
					</div>
				</div>
				</form>
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

