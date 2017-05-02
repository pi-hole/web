		<div class="box box-danger <?php if ($collapse) { ?>collapsed-box<?php } ?>">
			<div class="box-header with-border">
				<h3 class="box-title">Pi-hole Teleporter</h3>
                <?php if ($collapse) { ?>
				<div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
                <?php } ?>
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
