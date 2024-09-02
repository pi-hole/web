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
PageTitle = "Local DNS Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row">
    <div class="col-md-12 col-lg-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title" id="title-hosts" data-configkeys="dns.hosts">Local DNS records</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <h3 class="box-title">List of local DNS records</h3>
                            <!-- /.box-header -->
                        <table id="hosts-Table" class="table table-striped table-bordered" width="100%">
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>IP</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tfoot class="add-new-item">
                                <tr>
                                    <th>
                                        <input id="Hdomain" type="url" class="form-control" data-configkeys="hosts" placeholder="Domain" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </th>
                                    <th>
                                        <input id="Hip" type="text" class="form-control" data-configkeys="hosts" placeholder="Associated IP" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </th>
                                    <th>
                                        <button type="button" id="btnAdd-host" class="btn btn-primary btn-xs" data-configkeys="hosts"><i class="fa fa-plus"></i></button>
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                        <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Clear Filters</button>
                    </div>
                </div>
            </div>
            <div class="box-footer">
                <strong>Note:</strong>
                <p>Adding/removing local DNS records will flush the cache but does not require a restart of the DNS server.</p>
            </div>
        </div>
    </div>
    <div class="col-md-12 col-lg-6">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title" id="title-cnameRecords" data-configkeys="dns.cnameRecords">Local CNAME records records</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <h3 class="box-title">List of local CNAME records</h3>
                            <!-- /.box-header -->
                        <table id="cnameRecords-Table" class="table table-striped table-bordered" width="100%">
                            <thead>
                                <tr>
                                    <th>Domain</th>
                                    <th>Target</th>
                                    <th>TTL *</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tfoot class="add-new-item">
                                <tr>
                                    <th>
                                        <input id="Cdomain" type="url" class="form-control" data-configkeys="cnameRecords" placeholder="Domain" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </th>
                                    <th>
                                        <input id="Ctarget" type="url" class="form-control" data-configkeys="cnameRecords" placeholder="Target Domain" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </th>
                                    <th>
                                        <input id="Cttl" type="numeric" class="form-control" data-configkeys="cnameRecords" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </th>
                                    <th>
                                        <button type="button" id="btnAdd-cname" class="btn btn-primary btn-xs" data-configkeys="cnameRecords"><i class="fa fa-plus"></i></button>
                                    </th>
                                </tr>
                            </tfoot>
                        </table>
                        <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Clear Filters</button>
                    </div>
                </div>
            </div>
            <div class="box-footer">
                <strong>Note:</strong>
                <p>The target of a <code>CNAME</code> must be a domain that the Pi-hole already has in its cache or is authoritative for. This is a universal limitation of <code>CNAME</code> records.</p>
                <p>The reason for this is that Pi-hole will not send additional queries upstream when serving <code>CNAME</code> replies. As consequence, if you set a target that isn't already known, the reply to the client may be incomplete. Pi-hole just returns the information it knows at the time of the query. This results in certain limitations for <code>CNAME</code> targets,
                for instance, only <i>active</i> DHCP leases work as targets - mere DHCP <i>leases</i> aren't sufficient as they aren't (yet) valid DNS records.</p>
                <p>Additionally, you can't <code>CNAME</code> external domains (<code>bing.com</code> to <code>google.com</code>) successfully as this could result in invalid SSL certificate errors when the target server does not serve content for the requested domain.</p>
                <p>Adding/removing local CNAME records will restart the DNS server.</p>
            </div>
        </div>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/vendor/jquery.confirm.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-dns-records.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/ip-address-sorting.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
