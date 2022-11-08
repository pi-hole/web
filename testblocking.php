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
$ipaddress = $_SERVER['REMOTE_ADDR'] ;
?>
<!-- Title -->
<div class="page-header">
    <h1>Test add blocking</h1>
</div>

<!-- General info -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="test">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Info
                </h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <p>This pages test on each device if Pi-hole is blocking ads <br>
                            Some routers advertise themselves as the DNS server so a device might have the router set as
                            a
                            DNS.
                            This might have a negative effect on the performance of ad blocking.<br>
                            Test is executed on the device and will produce an allowed/blocked result specific for the
                            device.<br>
                            The first two results (google.com and amazon.com) are used for validation that the device
                            has internet access.
                        </p>
                    </div>
                </div>
                <div class="box-footer clearfix">
                    <button type="button" class="btn btn-info pull-right" onclick="startDomainTest()">Start
                        test</button>
                </div>
            </div>
        </div>
    </div>
</div>



<div id="results-table" class="row hidden">
    <div class="col-md-12">
        <div class="box" id="test-results-list">
            <div class=" box-header with-border">
                <h3 class="box-title">
                    <?php Echo "Results for device with ip: $ipaddress";?>
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="test-domains-results" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Pass/Block</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            </div>
            <div id="overlay" class="overlay hidden">
                <i class="fa fa-sync fa-spin"></i>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->

        <script src="./scripts/pi-hole/js/domain-test.js"></script>