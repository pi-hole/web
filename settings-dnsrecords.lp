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
    <div class="col-md-6 settings-level-1">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Local DNS records</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="box collapsed-box">
                            <!-- /.box-header -->
                            <div class="box-header with-border">
                                <h3 class="box-title">
                                    Add new DNS record
                                </h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button>
                                </div>
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <div class="row">
                                    <div class="form-group col-md-6">
                                        <label for="domain">Domain:</label>
                                        <input id="Hdomain" type="url" class="form-control" placeholder="Add a domain (example.com or sub.example.com)" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </div>
                                    <div class="form-group col-md-6">
                                        <label for="target">IP address:</label>
                                        <input id="Hip" type="text" class="form-control" placeholder="Associated IP address" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </div>
                                </div>
                            </div>
                            <div class="box-footer clearfix">
                            <strong>Note:</strong>
                            <p>The target of a <code>CNAME</code> must be a domain that the Pi-hole already has in its cache or is authoritative for. This is a universal limitation of <code>CNAME</code> records.</p>
                            <p>The reason for this is that Pi-hole will not send additional queries upstream when serving <code>CNAME</code> replies. As consequence, if you set a target that isn't already known, the reply to the client may be incomplete. Pi-hole just returns the information it knows at the time of the query. This results in certain limitations for <code>CNAME</code> targets,
                                for instance, only <i>active</i> DHCP leases work as targets - mere DHCP <i>leases</i> aren't sufficient as they aren't (yet) valid DNS records.</p>
                                <p>Additionally, you can't <code>CNAME</code> external domains (<code>bing.com</code> to <code>google.com</code>) successfully as this could result in invalid SSL certificate errors when the target server does not serve content for the requested domain.</p>
                                <button type="button" id="btnAdd-host" class="btn btn-primary pull-right">Add</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <h3 class="box-title">List of local DNS records</h3>
                            <!-- /.box-header -->
                        <table id="dnsRecordsTable" class="table table-striped table-bordered" width="100%">
                            <thead>
                            <tr>
                                <th>Domain</th>
                                <th>IP</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                        </table>
                        <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Clear Filters</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6 settings-level-1">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">Local CNAME records records</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="box collapsed-box">
                            <!-- /.box-header -->
                            <div class="box-header with-border">
                                <h3 class="box-title">
                                    Add new CNAME record
                                </h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button>
                                </div>
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <div class="row">
                                    <div class="form-group col-md-5">
                                        <label for="domain">Domain:</label>
                                        <input id="Cdomain" type="url" class="form-control" placeholder="Add a domain (example.com or sub.example.com)" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </div>
                                    <div class="form-group col-md-5">
                                        <label for="target">Target Domain:</label>
                                        <input id="Ctarget" type="url" class="form-control" placeholder="Associated Target Domain" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </div>
                                    <div class="form-group col-md-2">
                                        <label for="target">TTL (optional):</label>
                                        <input id="Cttl" type="numeric" class="form-control" placeholder="TTL in seconds" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                    </div>
                                </div>
                            </div>
                            <div class="box-footer clearfix">
                                <button type="button" id="btnAdd-cname" class="btn btn-primary pull-right">Add</button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <h3 class="box-title">List of local CNAME records</h3>
                            <!-- /.box-header -->
                        <table id="customCNAMETable" class="table table-striped table-bordered" width="100%">
                            <thead>
                            <tr>
                                <th>Domain</th>
                                <th>Target</th>
                                <th>TTL</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                        </table>
                        <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Clear Filters</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/jquery.confirm.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-dns-records.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/ip-address-sorting.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
