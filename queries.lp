<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title/Header -->
<div class="app-content-header">
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <h1 class="mb-0">Query Log</h1>
            </div>
        </div>
    </div>
</div>

<div class="app-content">
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <div class="card card-info collapsed-card">
                    <div class="card-header pointer no-user-select" data-lte-toggle="card-collapse">
                        <h3 class="card-title">Advanced filtering</h3>
                        <div class="card-tools float-end">
                            <button type="button" class="btn btn-tool">
                                <i data-lte-icon="expand" class="fa fa-plus"></i>
                                <i data-lte-icon="collapse" class="fa fa-minus"></i>
                            </button>
                        </div>
                    </div>
                    <!-- /.card-header -->
                    <div class="card-body">
                        <div class="row">
                            <div class="mb-3 col-md-6">
                                <div class="input-group">
                                <span class="input-group-text">
                                    <i class="far fa-clock"></i>
                                </span>
                                <input type="button" class="form-control float-end" id="querytime" value="Click to select date and time range">
                                </div>
                                <small id="querytime-note" class="form-text text-muted" style="margin-top: 5px;"></small>
                            </div>
                            <div class="mb-3 col-md-6">
                                <div class="form-check"><input class="form-check-input" type="checkbox" id="disk"><label class="form-check-label" for="disk">Query on-disk data. This is <em>a lot</em> slower but necessary if you want to obtain queries older than 24 hours. This option disables live update.</label></div>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Domain*</label>
                                    <select id="domain_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Client (by IP)*</label>
                                    <select id="client_ip_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Client (by name)*</label>
                                    <select id="client_name_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Upstream*</label>
                                    <select id="upstream_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Type</label>
                                    <select id="type_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Status</label>
                                    <select id="status_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>Reply</label>
                                    <select id="reply_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-lg-3 col-md-4 col-sm-6">
                                <div class="mb-3">
                                    <label>DNSSEC status</label>
                                    <select id="dnssec_filter" class="form-control" placeholder="">
                                        <option disabled selected>Loading...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- /.card-body -->
                    <div class="card-footer clearfix">
                        <span class="float-start">* These input fields allow manual input as well. Use <code>*</code> for wildcard search. An <code>_</code> can be used as a single-character wildcard. If you want to search for <code>_</code> explicitly, then you must escape it like <code>\_</code></span>
                        <span class="float-end">Click "Refresh" below to apply.</span>
                    </div>
                    <!-- /.card -->
                </div>
            </div>
            <!-- /.col -->
        </div>
        <!-- /.row -->

        <div class="row">
            <div class="col-md-12">
                <div class="card" id="recent-queries">
                    <div class="card-header">
                        <h3 class="card-title">Recent Queries</h3>
                        <div class="float-end align-click-options">
                            <span class="form-check"><input class="form-check-input" type="checkbox" id="live"><label class="form-check-label" for="live">Live update</label></span>
                            <button type="button" id="refresh" class="btn btn-sm btn-info btn-flat">Refresh</button>
                        </div>
                    </div>
                    <!-- /.card-header -->
                    <div class="card-body">
                        <p>Click on a query log item to obtain additional information for this query.</p>
                        <table id="all-queries" class="table table-striped table-bordered" width="100%">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th></th>
                                    <th>Type</th>
                                    <th>Domain</th>
                                    <th>Client</th>
                                    <th><i class="fas fa-stopwatch" title="Query reply time"></i></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tfoot>
                                <tr>
                                    <th>Time</th>
                                    <th></th>
                                    <th>Type</th>
                                    <th>Domain</th>
                                    <th>Client</th>
                                    <th><i class="fas fa-stopwatch" title="Query reply time"></i></th>
                                    <th></th>
                                </tr>
                            </tfoot>
                        </table>
                        <p>Note: Queries for <code>pi.hole</code> and the hostname are never logged.</p>
                    </div>
                    <!-- /.card-body -->
                </div>
                <!-- /.card -->
            </div>
            <!-- /.col -->
        </div>
        <!-- /.row -->

    </div><!-- /.container-fluid -->
</div><!-- /.app-content -->

<script src="<?=pihole.fileversion('vendor/tom-select/tom-select.complete.min.js')?>"></script>
<script src="<?=pihole.fileversion('vendor/daterangepicker/daterangepicker.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/queries.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/ip-address-sorting.js')?>"></script>

<? mg.include('scripts/lua/footer.lp','r')?>
