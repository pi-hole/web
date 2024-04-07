<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')

-- Page title and level selector
PageTitle = "Teleporter"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row">
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Export your Pi-hole's configuration</h3>
            </div>
            <div class="box-body">
                <p><strong>Warning:</strong><br>This archive contains sensitive information about your Pi-hole installation, e.g. your 2FA-TOTP secret (if enabled). Please be careful with this file and do not share it with anyone even if they claim to help you.</p>
                <? if not is_secure then ?><p class='text-danger'><strong>Warning:</strong><br>You are currently not using an end-to-end encryption. This means that secrets like your 2FA-TOTP secret will be transmitted in plain text. We recommend to use HTTPS when exporting your configuration.</p><? end ?>
                <div class="pull-right">
                    <a class="btn btn-app btn-success" id="GETTeleporter" target="_blank">
                        <i class="fa fa-save fa-xl"></i><br>Export
                    </a>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Import previously exported configuration</h3>
            </div>
            <div class="box-body">
                <div class="form-group">
                    <label for="file">File input</label>
                    <input type="file" name="file" id="file" accept="application/gzip,application/zip">
                    <br>
                    <p class="help-block">When importing settings from a <em>newer</em> version of Pi-hole, not yet existing settings will be ignored. When importing from an <em>older</em> version of Pi-hole, settings for newer features will be initialized with their default values.</p>
                </div>
                <div class="form-group">
                    <label for="import-selection">Select what to import</label>
                    <div><input type="checkbox" id="import.config" data-key="config" class="import-select" checked="true">&nbsp;<label for="import.config"><strong>Configuration</strong></label></div>
                    <div><input type="checkbox" id="import.dhcp_leases" data-key="dhcp_leases" class="import-select" checked="true">&nbsp;<label for="import.dhcp_leases"><strong>DHCP leases</strong></label></div>
                    <div><input type="checkbox" id="import.gravity.group" data-key="config" class="import-select" checked="true">&nbsp;<label for="import.gravity.group"><strong>Groups</strong></label></div>
                    <div><input type="checkbox" id="import.gravity.adlist" data-key="config" class="import-select" checked="true">&nbsp;<label for="import.gravity.adlist"><strong>Lists</strong></label></div>
                    <div><input type="checkbox" id="import.gravity.domainlist" data-key="config" class="import-select" checked="true">&nbsp;<label for="import.gravity.domainlist"><strong>Domains/Regexes</strong></label></div>
                    <div><input type="checkbox" id="import.gravity.client" data-key="config" class="import-select" checked="true">&nbsp;<label for="import.gravity.client"><strong>Clients</strong></label></div>
                </div>
                <div class="pull-right">
                    <a class="btn btn-app btn-success" id="submit-import">
                        <i class="fa fa-upload fa-xl"></i><br>Import
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="modal fade" id="modal-import" style="display: none;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span></button>
                <h4 class="modal-title">Importing Pi-hole teleporter file...</h4>
            </div>
            <div class="modal-body">
                <p>Depending on your network speed, it may take a few moments until the file is uploaded and imported. Please be patient and don't interrupt the process...</p>
                <div class="text-center">
                    <i id="import-spinner" class="fas fa-spinner fa-pulse fa-5x"></i>
                </div>
                <div id="modal-import-success" style="display:none">
                    <div class="alert alert-success alert-dismissible">
                        <h4><i class="icon fa fa-fw fa-check"></i> <span id="modal-import-success-title"></span></h4>
                        <div id="modal-import-success-message"></div>
                    </div>
                </div>
                <div id="modal-import-error" style="display:none">
                    <div class="alert alert-danger alert-dismissible">
                        <h4><i class="icon fa fa-fw fa-ban"></i> <span id="modal-import-error-title"></span></h4>
                        <div id="modal-import-error-message"></div>
                    </div>
                </div>
                <div id="modal-import-gravity" style="display:none">
                    <div class="alert alert-info alert-dismissible">
                        <h4><i class="icon fa fa-fw fa-info-circle"></i> Please run gravity</h4>
                        <p>Use <a href='/admin/gravity'>Tools &rarr; Gravity</a> or run <code>pihole -g</code> to update your lists.</p>
                    </div>
                </div>
                <div id="modal-import-info-message"></div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default pull-left" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-teleporter.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
