<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';

$showing = '';

if (isset($setupVars['API_QUERY_LOG_SHOW'])) {
    if ($setupVars['API_QUERY_LOG_SHOW'] === 'all') {
        $showing = 'showing';
    } elseif ($setupVars['API_QUERY_LOG_SHOW'] === 'permittedonly') {
        $showing = 'showing permitted';
    } elseif ($setupVars['API_QUERY_LOG_SHOW'] === 'blockedonly') {
        $showing = 'showing blocked';
    } elseif ($setupVars['API_QUERY_LOG_SHOW'] === 'nothing') {
        $showing = 'showing no queries (due to setting)';
    }
} elseif (isset($_GET['type']) && $_GET['type'] === 'blocked') {
    $showing = 'showing blocked';
} else {
    // If filter variable is not set, we
    // automatically show all queries
    $showing = 'showing';
}

$showall = false;
if (isset($_GET['all'])) {
    $showing .= ' all queries within the Pi-hole log';
} elseif (isset($_GET['client'])) {
    // Add switch between showing all queries and blocked only
    if (isset($_GET['type']) && $_GET['type'] === 'blocked') {
        // Show blocked queries for this client + link to all
        $showing .= ' blocked queries for client '.htmlentities($_GET['client']);
        $showing .= ', <a href="?client='.htmlentities($_GET['client']).'">show all</a>';
    } else {
        // Show All queries for this client + link to show only blocked
        $showing .= ' all queries for client '.htmlentities($_GET['client']);
        $showing .= ', <a href="?client='.htmlentities($_GET['client']).'&type=blocked">show blocked only</a>';
    }
} elseif (isset($_GET['forwarddest'])) {
    if ($_GET['forwarddest'] === 'blocked') {
        $showing .= ' queries blocked by Pi-hole';
    } elseif ($_GET['forwarddest'] === 'cached') {
        $showing .= ' queries answered from cache';
    } else {
        $showing .= ' queries for upstream destination '.htmlentities($_GET['forwarddest']);
    }
} elseif (isset($_GET['querytype'])) {
    $showing .= ' type '.getQueryTypeStr($_GET['querytype']).' queries';
} elseif (isset($_GET['domain'])) {
    $showing .= ' queries for domain '.htmlentities($_GET['domain']);
} elseif (isset($_GET['from']) || isset($_GET['until'])) {
    $showing .= ' queries within specified time interval';
} else {
    $showing .= ' up to 100 queries';
    $showall = true;
}

if (strlen($showing) > 0) {
    $showing = '('.$showing.')';
    if ($showall) {
        $showing .= ', <a href="?all">show all</a>';
    }
}
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
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">Recent Queries <?php echo $showing; ?></h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="all-queries" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Reply</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Reply</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                </table>
                <p>Note: Queries for <code>pi.hole</code> and the hostname are never logged.</p>
                <p><strong>Filtering options:</strong></p>
                <ul>
                    <li>Click a value in a column to add/remove that value to/from the filter</li>
                    <li>On a computer: Hold down <kbd>Ctrl</kbd>, <kbd>Alt</kbd>, or <kbd>&#8984;</kbd> to allow highlighting for copying to clipboard</li>
                    <li>On a mobile: Long press to highlight the text and enable copying to clipboard
                </ul><br/><button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Clear filters</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>
<!-- /.row -->
<script src="scripts/pi-hole/js/ip-address-sorting.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/pi-hole/js/queries.js?v=<?php echo $cacheVer; ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
