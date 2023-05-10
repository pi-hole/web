<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
?>
<div class="row">
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Export your Pi-hole's configuration</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-10">
                        <p>Warning: This archive contains sensitive information about your Pi-hole installation, e.g. the API token and the 2FA-TOTP secret (if enabled). Please be careful with this file and do not share it with anyone even if they claim to help you.</p>
                        <? if not mg.request_info.https then mg.write("<p class='text-danger'>Warning: You are currently not using an end-to-end encryption. This means that your API token and 2FA-TOTP secret will be transmitted in plain text. We recommend to use HTTPS when exporting your configuration.</p>") end ?>
                    </div>
                    <div class="col-lg-2">
                        <a class="btn btn-app btn-success" href="/api/teleporter" target="_blank">
                            <i class="fa fa-save"></i><br>Export
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Import previously imported configuration</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-10">
                        <div class="form-group">
                            <label for="file">File input</label>
                            <input type="file" name="file" id="file" accept=".zip">
                            <p class="help-block">When importing settings from a <em>newer</em> version of Pi-hole, not yet existing settings will be ignored. When importing from an <em>older</em> version of Pi-hole, settings for newer features will be initialized with their default values.</p>
                        </div>
                    </div>
                    <div class="col-lg-2">
                        <a class="btn btn-app btn-success" id="submit-import">
                            <i class="fa fa-upload"></i><br>Import
                        </a>
                    </div>
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
                        <p id="modal-import-success-message"></p>
                    </div>
                </div>
                <div id="modal-import-error" style="display:none">
                    <div class="alert alert-danger alert-dismissible">
                        <h4><i class="icon fa fa-fw fa-ban"></i> <span id="modal-import-error-title"></span></h4>
                        <p id="modal-import-error-message"></p>
                    </div>
                </div>
                <p id="modal-import-info-message"></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default pull-left" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-teleporter.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
