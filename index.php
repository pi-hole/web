<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

$indexpage = true;
require 'scripts/pi-hole/php/header_authenticated.php';
require_once 'scripts/pi-hole/php/gravity.php';
?>
<!-- Sourceing CSS colors from stylesheet to be used in JS code -->
<span class="queries-permitted"></span>
<span class="queries-blocked"></span>
<span class="graphs-grid"></span>
<span class="graphs-ticks"></span>
<!-- Small boxes (Stat box) -->
<div class="row">
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-green no-user-select" id="total_queries" title="only A + AAAA queries">
            <div class="inner">
                <p>Total queries (<span id="unique_clients">-</span> clients)</p>
                <h3 class="statistic"><span id="dns_queries_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-globe-americas"></i>
            </div>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-aqua no-user-select">
            <div class="inner">
                <p>Queries Blocked</p>
                <h3 class="statistic"><span id="queries_blocked_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-hand-paper"></i>
            </div>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-yellow no-user-select">
            <div class="inner">
                <p>Percentage Blocked</p>
                <h3 class="statistic"><span id="percentage_blocked_today">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-chart-pie"></i>
            </div>
        </div>
    </div>
    <!-- ./col -->
    <div class="col-lg-3 col-sm-6">
        <!-- small box -->
        <div class="small-box bg-red no-user-select" title="<?php echo gravity_last_update(); ?>">
            <div class="inner">
                <p>Domains on Adlists</p>
                <h3 class="statistic"><span id="domains_being_blocked">---</span></h3>
            </div>
            <div class="icon">
                <i class="fas fa-list-alt"></i>
            </div>
        </div>
    </div>
    <!-- ./col -->
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="queries-over-time">
            <div class="box-header with-border">
                <h3 class="box-title">Total queries over last <span class="maxlogage-interval">24</span> hours</h3>
            </div>
            <div class="box-body">
                <div class="chart">
                    <canvas id="queryOverTimeChart" width="800" height="140"></canvas>
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
                <h3 class="box-title">Client activity over last <span class="maxlogage-interval">24</span> hours</h3>
            </div>
            <div class="box-body">
                <div class="chart">
                    <canvas id="clientsChart" width="800" height="140" class="extratooltipcanvas no-user-select"></canvas>
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
                <div class="pull-left" style="width:50%">
                    <canvas id="queryTypePieChart" width="120" height="120"></canvas>
                </div>
                <div class="pull-left" style="width:50%">
                    <div id="query-types-legend" class="chart-legend"></div>
                </div>
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
                <div class="pull-left" style="width:50%">
                    <canvas id="forwardDestinationPieChart" width="120" height="120" class="extratooltipcanvas no-user-select"></canvas>
                </div>
                <div class="pull-left" style="width:50%">
                    <div id="forward-destinations-legend" class="chart-legend extratooltipcanvas no-user-select"></div>
                </div>
            </div>
            <div class="overlay">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
    </div>
</div>

<?php
    if ($boxedlayout) {
        $tablelayout = 'col-md-6';
    } else {
        $tablelayout = 'col-md-6 col-lg-6';
    } ?>
<div class="row">
    <div class="<?php echo $tablelayout; ?>">
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
    <div class="<?php echo $tablelayout; ?>">
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
    <div class="<?php echo $tablelayout; ?>">
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
    <div class="<?php echo $tablelayout; ?>">
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

<script src="scripts/pi-hole/js/index.js?v=<?php echo $cacheVer; ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
