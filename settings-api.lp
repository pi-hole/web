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
PageTitle = "Web Interface - API Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row">
    <div class="col-md-6 settings-level-0">
        <div class="row">
            <div class="col-md-12 settings-level-1">
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title">Exclusions</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Domains to be excluded from Top Domains / Ads Lists</strong></p>
                                <textarea class="form-control" rows="4" id="webserver.api.excludeDomains" data-key="webserver.api.excludeDomains" placeholder="Enter domains, one per line" style="resize: vertical;"></textarea>
                                <p class="help-block">Domains may be described by their domain name (like <code>example.com</code>)</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Clients to be excluded from Top Clients List</strong></p>
                                <textarea class="form-control" rows="4" id="webserver.api.excludeClients" data-key="webserver.api.excludeClients" placeholder="Enter clients, one per line" style="resize: vertical;"></textarea>
                                <p class="help-block">Clients may be described either by their IP addresses (IPv4 and IPv6 are supported), or hostnames (like <code>laptop.lan</code>).</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 settings-level-0">
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title">Theme settings</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <div class="row">
                                    <div class="col-lg-3">
                                        <label for="webserver.interface.theme">Used theme:</label>
                                    </div>
                                    <div class="col-md-9">
                                        <select id="webserver.interface.theme" data-key="webserver.interface.theme" class="form-control" placeholder="">
                                            <option disabled selected>Loading...</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <input type="checkbox" id="webserver.interface.boxed" data-key="webserver.interface.boxed">
                                    <label for="webserver.interface.boxed"><strong>Should the web interface use the boxed layout?</strong></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div><!--
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Query Log</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" name="querylog-permitted" id="querylog-permitted" <? if queryLog == 'permittedonly' or queryLog == 'all' then ?>checked<? end ?>>
                            <label for="querylog-permitted"><strong>Show permitted domain entries</strong></label>
                            <p class="help-block"><span class="text-red">This will show all permitted domain entries in the query log.</span></p>
                        </div>
                        <div>
                            <input type="checkbox" name="querylog-blocked" id="querylog-blocked" <? if queryLog == 'blockedonly' or queryLog == 'all' then ?>checked<? end ?>>
                            <label for="querylog-blocked"><strong>Show blocked domain entries</strong></label>
                            <p class="help-block"><span class="text-red">This will show all blocked domain entries in the query log.</span></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>-->
    <div class="col-md-6 settings-level-1">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Advanced Settings</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" id="webserver.api.localAPIauth" data-key="webserver.api.localAPIauth">
                            <label for="webserver.api.localAPIauth"><strong>Local clients need to authenticate to access the API</strong></label>
                            <p class="help-block">This will require local clients to authenticate to access the API. This is useful if you want to prevent local users from accessing the API without knowing the password.</p>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" id="webserver.api.prettyJSON" data-key="webserver.api.prettyJSON">
                            <label for="webserver.api.prettyJSON"><strong>Prettify API output for human-readability</strong></label>
                            <p class="help-block">This will make the API output more human-readable, but will increase the size of the output and make the API a bit slower.</p>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" id="webserver.api.allow_destructive" data-key="webserver.api.allow_destructive">
                            <label for="webserver.api.allow_destructive"><strong>Permit destructive actions via API</strong></label>
                            <p class="help-block">This will allow clients to perform destructive actions via the API, such as rebooting or shutting down the system Pi-hole is running on.</p>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div class="row">
                            <div class="col-md-6">
                                <label for="webserver.api.temp.limit"><strong>Temperature limit for "hot":</strong></label>
                            </div>
                            <div class="col-md-6">
                                <input type="number" id="webserver.api.temp.limit" data-key="webserver.api.temp.limit">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-6">
                                <label for="webserver.api.temp.unit">Temperature unit:</label>
                            </div>
                            <div class="col-md-6">
                                <select id="webserver.api.temp.unit" data-key="webserver.api.temp.unit" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                        <button type="button" id="button-enable-totp" class="btn btn-success hidden" data-toggle="modal" data-target="#modal-totp">Enable 2FA</button>
                        <button type="button" id="button-disable-totp" class="btn btn-danger hidden" data-toggle="modal" data-target="#modal-totp-disable">Disable 2FA</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-12">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Currently active sessions</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <table id="APISessionsTable" class="table table-striped table-bordered nowrap" width="100%">
                            <thead>
                                <tr>
                                    <td></td>
                                    <th title="Session ID used internally by our Pi-hole">ID</th>
                                    <th title="Session is still valid (neither expired nor closed)">Valid</th>
                                    <th title="Connection between client and Pi-hole is end-to-end encrypted">TLS</th>
                                    <th title="Time at which the client created the session">Login at</th>
                                    <th title="Time at which the session expires (if not prolonged)">Valid until</th>
                                    <th title="The client that created this session (the current connection is highlighted in bold-face)">Client IP</th>
                                    <th title="User agent of the client to ease client identifiability (if available)">User Agent</th>
                                    <td></td>
                                </tr>
                            </thead>
                            <tbody>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-12 settings-level-0">
        <button type="button" class="btn btn-primary save-button"><i class="fa-solid fa-fw fa-floppy-disk"></i>&nbsp;Save & Apply</button>
    </div>
</div>

<div class="modal fade" id="modal-totp" style="display: none;">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span></button>
                <h4 class="modal-title">Enable two-factor authentication</h4>
            </div>
            <div class="modal-body">
                <p>Use a phone app like Google Authenticator, 2FA Authenticator, FreeOTP or BitWarden, etc. to get 2FA codes when prompted during login.</p>
                <p>1. Scan the QR code below with your app or enter the secret manually.</p>
                <div class="text-center">
                    <i id="qrcode-spinner" class="fas fa-spinner fa-pulse fa-5x"></i>
                </div>
                <div class="text-center">
                    <canvas id="qrcode" class="qrcode" title="QR Code" hidden="true"></canvas>
                </div>
                <p class="text-center"><code id="totp_secret"></code></p>
                <p>2. Enter the 2FA code from your app below to confirm that you have set up 2FA correctly.</p>
                <div class="row">
                    <div class="col-md-6 col-md-offset-3">
                        <div id="totp_div" class="has-feedback has-error">
                            <div class="pwd-field form-group">
                                <input type="text" size="6" maxlength="6" class="form-control totp_token" id="totp_code" placeholder=""/>
                            </div>
                            <i class="fa-solid fa-clock-rotate-left pwd-field form-control-feedback"></i>
                        </div>
                    </div>
                </div>
                <p>IMPORTANT: If you lose your 2FA token, you will not be able to login. You will need to disable 2FA on the command line and re-enable 2FA to generate a new secret.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default pull-left" data-dismiss="modal">Close</button>
                <button type="button" id="totp_submit" disabled="true" class="btn btn-default">Enable 2FA</button>
            </div>
        </div>
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/vendor/jquery.confirm.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/vendor/qrious.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-api.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
