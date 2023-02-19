<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
require 'scripts/pi-hole/php/header_authenticated.php';
?>
<!-- Alert Modal -->
<div id="alertModal" class="modal fade" role="dialog" data-backdrop="static" data-keyboard="false">
    <div class="vertical-alignment-helper">
        <div class="modal-dialog vertical-align-center">
            <div class="modal-content">
                <div class="modal-body text-center">
                    <span class="fa-stack fa-2x" style="margin-bottom: 10px">
                        <div class="alProcessing">
                            <i class="fa-stack-2x alSpinner"></i>
                        </div>
                        <div class="alSuccess" style="display: none">
                            <i class="fa fa-circle fa-stack-2x text-green"></i>
                            <i class="fa fa-check fa-stack-1x fa-inverse"></i>
                        </div>
                        <div class="alFailure" style="display: none">
                            <i class="fa fa-circle fa-stack-2x text-red"></i>
                            <i class="fa fa-times fa-stack-1x fa-inverse"></i>
                        </div>
                    </span>
                    <div class="alProcessing">Adding <span id="alDomain"></span> to the <span id="alList"></span>...</div>
                    <div class="alSuccess text-bold text-green" style="display: none"><span id="alDomain"></span> successfully added to the <span id="alList"></span></div>
                    <div class="alFailure text-bold text-red" style="display: none">
                        <span id="alNetErr">Timeout or Network Connection Error!</span>
                        <span id="alCustomErr"></span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box box-warning collapsed-box box-solid">
            <div class="box-header with-border">
                <h3 class="box-title">Advanced filtering</h3>
                <div class="box-tools pull-right">
                    <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button>
                </div>
                <!-- /.box-tools -->
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <div class="input-group">
                        <div class="input-group-addon">
                            <i class="far fa-clock"></i>
                        </div>
                        <input type="button" class="form-control pull-right" id="querytime" value="Click to select date and time range">
                        </div>
                    </div>
                    <div class="form-group col-md-6">
                        <div><input type="checkbox" id="disk"><label for="disk">Query on-disk data. This is <em>a lot</em> slower but necessary if you want to obtain queries older than 24 hours.</label></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-3">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Domain</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="domain_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Client (by IP)</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="client_ip_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Client (by name)</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="client_name_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Upstream</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="upstream_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Type</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="type_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Status</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="status_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">Reply</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="reply_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-3 col-md-4 col-sm-6 col-xs-12">
                        <div class="box box-default box-solid">
                            <div class="box-header small-box-header">
                                <h3 class="box-title">DNSSEC status</h3>
                                <!-- /.box-tools -->
                            </div>
                            <!-- /.box-header -->
                            <div class="box-body">
                                <select id="dnssec_filter" class="form-control" placeholder="">
                                    <option disabled selected>Loading...</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /.box-body -->
            <div class="box-footer clearfix">
                <span class="pull-right">Click "Refresh" below to apply.</span>
            </div>
            <!-- /.box -->
        </div>
    </div>
    <!-- /.col -->
</div>
<!-- /.row -->

<div class="row">
    <div class="col-md-12">
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">Recent Queries</h3>
                <a id="refresh" href="#" class="btn btn-sm btn-info btn-flat pull-right">Refresh</a>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <p>Click on a query log item to obtain additional information for this query.</p>
                <table id="all-queries" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th></th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr>
                            <th>Time</th>
                            <th></th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                        </tr>
                    </tfoot>
                </table>
                <p>Note: Queries for <code>pi.hole</code> and the hostname are never logged.</p>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
</div>
<!-- /.row -->

<script src="<?php echo fileversion('scripts/vendor/bootstrap-select.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/ip-address-sorting.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/vendor/daterangepicker.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/utils.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/queries.js'); ?>"></script>

<?php
    require 'scripts/pi-hole/php/footer.php';
?>
