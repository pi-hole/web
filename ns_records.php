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

<!-- Title -->
<div class="page-header">
    <h1>Local NS Records</h1>
    <small>On this page, you can associate a domain name with a specific name server</small>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new domain/name server combination
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="domain">Domain:</label>
                        <input id="domain" type="url" class="form-control" placeholder="Domain or comma-separated list of domains" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="ip">NS IP Address:</label>
                        <input id="target" type="text" class="form-control" placeholder="Associated name server's IP address" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <strong>Note:</strong>
                <p>Doing this will add extra layers of lookups to do with yet another server. You should only really do this if needed. This will also forward ANY request for *.your.domain to the server.</p>
                <button type="button" id="btnAdd" class="btn btn-primary pull-right">Add</button>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="recent-queries">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of forwarded domain requests
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="customNSTable" class="table table-striped table-bordered" width="100%">
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
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/ip-address-sorting.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/pi-hole/js/customns.js?v=<?php echo $cacheVer; ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
