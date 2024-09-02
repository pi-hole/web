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
PageTitle = "Privacy Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row">
    <div class="col-md-6 settings-level-basic">
        <div class="row">
            <div class="col-md-12">
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title" data-configkeys="dns.queryLogging">Query Logging</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-lg-12">
                                <p>The currently configured logging file is <code id="files.log.dnsmasq"></code></p>
                                <div>
                                    <input type="checkbox" id="dns.queryLogging" data-key="dns.queryLogging" title="log-queries">
                                    <label for="dns.queryLogging"><strong>Log DNS queries and replies</strong></label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-12 settings-level-expert">
                <div class="box box-warning">
                    <div class="box-header with-border">
                        <h3 class="box-title" data-configkeys="database.DBimport database.DBexport database.maxDBdays database.network.expire">Privacy-related database settings</h3>
                    </div>
                    <div class="box-body">
                        <div class="row">
                            <div class="col-lg-12">
                                    <p>Pi-hole's long-term database is stored at <code id="files.database"></code></p>
                                <div>
                                    <input type="checkbox" id="database.DBimport" data-key="database.DBimport" title="log-queries">
                                    <label for="database.DBimport"><strong>Should FTL load queries from the database on (re)start?</strong></label>
                                </div>
                                <div>
                                    <input type="checkbox" id="database.DBexport" data-key="database.DBexport" title="log-queries">
                                    <label for="database.DBexport"><strong>Should FTL store queries in the database?</strong></label>
                                </div>
                                <br>
                                <div class="row-flex">
                                    <input class="form-control" type="number" id="database.maxDBdays" data-key="database.maxDBdays" data-type="integer" value="" min="0" step="10">
                                    <label for="database.maxDBdays"><strong>Maximum number of days to keep queries in the database</strong></label>
                                </div>
                                <div class="row-flex">
                                    <input class="form-control" type="number" id="database.network.expire" data-key="database.network.expire" data-type="integer" value="" min="0" step="10">
                                    <label for="database.network.expire"><strong>How long should IP addresses be kept in the network_addresses table [days]?</strong></label>
                                </div>
                                <p>IP addresses (and associated host names) older than the specified number of days are removed to avoid dead entries in the network overview table.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6 settings-level-expert">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title" data-configkeys="misc.privacylevel">Query Anonymization ("Privacy Level")</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <p>Specify if DNS queries should be anonymized, available options are:</p>
                        <div>
                            <input type="radio" id="misc.privacylevel-0" name="misc.privacylevel" data-key="misc.privacylevel" data-type="integer" value="0">
                            <label for="misc.privacylevel-0"><strong>Show everything and record everything</strong></label>
                            <p class="help-block">Gives maximum amount of statistics</p>
                        </div>
                        <div>
                            <input type="radio" id="misc.privacylevel-1" name="misc.privacylevel" data-key="misc.privacylevel" data-type="integer" value="1">
                            <label for="misc.privacylevel-1"><strong>Hide domains: Display and store all domains as <code>hidden</code></strong></label>
                            <p class="help-block">This disables the Top Permitted Domains and Top Blocked Domains tables on the dashboard</p>
                        </div>
                        <div>
                            <input type="radio" id="misc.privacylevel-2" name="misc.privacylevel" data-key="misc.privacylevel" data-type="integer" value="2">
                            <label for="misc.privacylevel-2"><strong> Hide domains and clients: Display and store all domains as <code>hidden</code> and all clients as <code>0.0.0.0</code> </strong></label>
                            <p class="help-block">This disables all tables on the dashboard</p>
                        </div>
                        <div>
                            <input type="radio" id="misc.privacylevel-3" name="misc.privacylevel" data-key="misc.privacylevel" data-type="integer" value="3">
                            <label for="misc.privacylevel-3"><strong> Anonymous mode: This disables basically everything except the live anonymous statistics</strong></label>
                            <p class="help-block">No history is saved at all to the database, and nothing is shown in the query log. Also, there are no top item lists. Note that this also largely disabled regex capabilities.</p>
                        </div>
                        <p>The privacy level may be increased at any time without having to restart the DNS resolver. However, note that the DNS resolver needs to be restarted when lowering the privacy level. This restarting is automatically done when saving.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-12 settings-level-basic save-button-container">
        <button type="button" class="btn btn-primary save-button"><i class="fa-solid fa-fw fa-floppy-disk"></i>&nbsp;Save & Apply</button>
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-privacy.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
