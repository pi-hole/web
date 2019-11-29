<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";

?>

<!-- Title -->
<div class="page-header">
    <h1>Custom DNS</h1>
</div>

<!-- Domain Input -->
<form class="form-inline" >
    <div class="form-group">
        <input id="domain" type="text" class="form-control" placeholder="Add a domain (example.com or sub.example.com)">
    </div>
    <div class="form-group">
        <input id="ip" type="text" class="form-control" placeholder="Define an associate IP">
    </div>
    <div class="form-group">
        <button id="btnAdd" class="btn btn-default" type="button">Add</button>
    </div>
</form>

<!-- Alerts -->
<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Updating the custom DNS entries...
</div>
<div id="alSuccess" class="alert alert-success alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Success! The list will refresh.
</div>
<div id="alFailure" class="alert alert-danger alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Failure! Something went wrong, see output below:<br/><br/><pre><span id="err"></span></pre>
</div>
<div id="alWarning" class="alert alert-warning alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    At least one domain was already present, see output below:<br/><br/><pre><span id="warn"></span></pre>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of custom DNS domains
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="customDNSTable" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                    <thead>
                    <tr>
                        <th>Domain</th>
                        <th>IP</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" hidden="true">Clear Filters</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/customdns.js"></script>

<?php
require "scripts/pi-hole/php/footer.php";
?>
