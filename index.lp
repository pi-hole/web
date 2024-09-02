<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

indexpage = true
mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
?>
<!-- Small boxes (Stat box) -->
<div class="row">
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-aqua no-user-select" id="total_queries" title="only A + AAAA queries">
            <div class="inner">
                <p>Total queries</p>
                <h3 class="statistic"><span id="dns_queries">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-globe-americas"></i>
            </div>
            <a href="network.lp" class="small-box-footer" title="" id="total_clients">
                <span id="active_clients">-</span> active clients <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-red no-user-select">
            <div class="inner">
                <p>Queries Blocked</p>
                <h3 class="statistic"><span id="blocked_queries">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-hand-paper"></i>
            </div>
            <a href="queries.lp?upstream=blocklist" class="small-box-footer" title="">
                List blocked queries <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-yellow no-user-select">
            <div class="inner">
                <p>Percentage Blocked</p>
                <h3 class="statistic"><span id="percent_blocked">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-chart-pie"></i>
            </div>
            <a href="queries.lp" class="small-box-footer" title="">
                List all queries <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-green no-user-select">
            <div class="inner">
                <p>Domains on Lists</p>
                <h3 class="statistic"><span id="gravity_size">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-list-alt"></i>
            </div>
            <a href="groups-lists.lp" class="small-box-footer" title="">
                Manage lists <i class="fa fa-arrow-circle-right"></i>
            </a>
        </div>
    </div>
    <!-- ./col -->
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="queries-over-time">
            <div class="box-header with-border">
                <h3 class="box-title">Total queries over last 24 hours</h3>
                <button class="btn btn-xs btn-default pull-right zoom-reset" data-sel="reset-history"><i class="fas fa-undo"></i>&nbsp;Reset zoom</button>
                <span class="pull-right zoom-info" data-toggle="tooltip" title="You can zoom this graph by either holding down the [Ctrl] key and using your mouse wheel or by using the &quot;pinch&quot; multi-touch gesture. You can furthermore click and drag to pan the graph."><i class="fa fa-info-circle"></i></span>
            </div>
            <div class="box-body">
                <div class="chart" style="width: 100%; height: 180px">
                    <canvas id="queryOverTimeChart"></canvas>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="clients">
            <div class="box-header with-border">
                <h3 class="box-title">Client activity over last 24 hours</h3>
                <button class="btn btn-xs btn-default pull-right zoom-reset" data-sel="reset-clients"><i class="fas fa-undo"></i>&nbsp;Reset zoom</button>
                <span class="pull-right zoom-info" data-toggle="tooltip" title="You can zoom this graph by either holding down the [Ctrl] key and using your mouse wheel or by using the &quot;pinch&quot; multi-touch gesture. You can furthermore click and drag to pan the graph."><i class="fa fa-info-circle"></i></span>
            </div>
            <div class="box-body">
                <div class="chart" style="width: 100%; height: 180px">
                    <canvas id="clientsChart" class="extratooltipcanvas no-user-select"></canvas>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <div class="box" id="query-types-pie">
            <div class="box-header with-border">
                <h3 class="box-title">Query Types</h3>
            </div>
            <div class="box-body">
                <div style="width:50%">
                    <canvas id="queryTypePieChart" width="280" height="280"></canvas>
                </div>
                <div class="chart-legend" style="width:50%" id="query-types-legend" ></div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
    <div class="col-md-6">
        <div class="box" id="forward-destinations-pie">
            <div class="box-header with-border">
                <h3 class="box-title">Upstream servers</h3>
            </div>
            <div class="box-body">
                <div style="width:50%">
                    <canvas id="forwardDestinationPieChart" width="280" height="280" class="extratooltipcanvas no-user-select"></canvas>
                </div>
                <div class="chart-legend" style="width:50%" id="forward-destinations-legend"></div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>

<? if pihole.boxedlayout() then tablelayout = 'col-md-6' else  tablelayout = 'col-md-6 col-lg-6' end ?>
<div class="row">
    <div class="<?=tablelayout?>">
        <div class="box" id="domain-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Permitted Domains</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Domain</th>
                            <th>Hits</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?=tablelayout?>">
        <div class="box" id="ad-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Blocked Domains</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Domain</th>
                            <th>Hits</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>
<div class="row">
    <!-- /.col -->
    <div class="<?=tablelayout?>">
        <div class="box" id="client-frequency">
            <div class="box-header with-border">
                <h3 class="box-title">Top Clients (total)</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Client</th>
                            <th>Requests</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?=tablelayout?>">
        <div class="box" id="client-frequency-blocked">
            <div class="box-header with-border">
                <h3 class="box-title">Top Clients (blocked only)</h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                            <th>Client</th>
                            <th>Requests</th>
                            <th>Frequency</th>
                            </tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
    <!-- /.col -->
</div>
<!-- /.row -->

<script src="<?=pihole.fileversion('scripts/pi-hole/js/charts.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/index.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
