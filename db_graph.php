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
?>

<div class="page-header">
    <h1>Compute graphical statistics from the Pi-hole query database</h1>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Select date and time range
                </h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-12">
                        <div class="input-group">
                            <div class="input-group-addon">
                                <i class="far fa-clock"></i>
                            </div>
                            <input type="button" class="form-control pull-right" id="querytime" value="Click to select date and time range">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div id="timeoutWarning" class="alert alert-warning alert-dismissible fade in" role="alert" hidden>
            Depending on how large of a range you specified, the request may time out while Pi-hole tries to retrieve all the data.<br/><span id="err"></span>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="queries-over-time">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Queries over the selected time period
                </h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="chart">
                            <canvas id="queryOverTimeChart" width="800" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <div class="overlay" hidden>
                <i class="fa fa-sync fa-spin"></i>
            </div>
        </div>
    </div>
</div>

<script src="<?php echo fileversion('scripts/vendor/daterangepicker.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/db_graph.js'); ?>"></script>
<?php
require 'scripts/pi-hole/php/footer.php';
?>
