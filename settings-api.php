<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';
?>
<div class="row">
    <div class="col-md-6">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Exclusions</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Domains to be excluded from Top Domains / Ads Lists</strong></p>
                        <textarea class="form-control" rows="4" id="webserver.api.excludeDomains" placeholder="Enter domains, one per line" style="resize: vertical;"></textarea>
                        <p class="help-block">Domains may be described by their domain name (like <code>example.com</code>)</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Clients to be excluded from Top Clients List</strong></p>
                        <textarea class="form-control" rows="4" id="webserver.api.excludeClients" placeholder="Enter clients, one per line" style="resize: vertical;"></textarea>
                        <p class="help-block">Clients may be described either by their IP addresses (IPv4 and IPv6 are supported), or hostnames (like <code>laptop.lan</code>).</p>
                    </div>
                </div>
            </div>
        </div>
    </div><!--
    <div class="col-md-3">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Query Log</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" name="querylog-permitted" id="querylog-permitted" <?php if ($queryLog === 'permittedonly' || $queryLog === 'all') { ?>checked<?php } ?>>
                            <label for="querylog-permitted"><strong>Show permitted domain entries</strong></label>
                            <p class="help-block">This will show all permitted domain entries in the query log.</p>
                        </div>
                        <div>
                            <input type="checkbox" name="querylog-blocked" id="querylog-blocked" <?php if ($queryLog === 'blockedonly' || $queryLog === 'all') { ?>checked<?php } ?>>
                            <label for="querylog-blocked"><strong>Show blocked domain entries</strong></label>
                            <p class="help-block">This will show all blocked domain entries in the query log.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>-->
    <div class="col-md-3">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Advanced Settings</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" id="webserver.api.localAPIauth">
                            <label for="webserver.api.localAPIauth"><strong>Local clients need to authenticate to access the API</strong></label>
                            <p class="help-block">This will require local clients to authenticate to access the API. This is useful if you want to prevent local users from accessing the API without knowing the password.</p>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div>
                            <input type="checkbox" id="webserver.api.prettyJSON">
                            <label for="webserver.api.prettyJSON"><strong>Prettify API output for human-readability</strong></label>
                            <p class="help-block">This will make the API output more human-readable, but will increase the size of the output and make the API a bit slower.</p>
                        </div>
                    </div>
                    <div class="col-lg-12">
                        <div class="row">
                            <div class="col-md-6">
                                <label for="webserver.api.temp.limit"><strong>Temperature limit for showing "hot":</strong></label>
                            </div>
                            <div class="col-md-6">
                                <input type="number" id="webserver.api.temp.limit">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-6">
                                <label for="webserver.api.temp.unit">Temperature unit:</label>
                            </div>
                            <div class="col-md-6">
                                <select id="webserver.api.temp.unit" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">2FA (TOTP) authentication</h3>
            </div>
            <div class="box-body">
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
                                    <th>ID</th>
                                    <th>Valid</th>
                                    <th>Login at</th>
                                    <th>Valid until</th>
                                    <th>Client IP</th>
                                    <th>User Agent</th>
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
</div>

<script src="<?php echo fileversion('scripts/pi-hole/js/settings-api.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
