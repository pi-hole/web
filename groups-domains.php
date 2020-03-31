<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
?>

<!-- Title -->
<div class="page-header">
    <h1>Domain group management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new domain
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="col-md-6">
                        <label for="ex1">Domain:</label>
                        <input id="new_domain" type="text" class="form-control" placeholder="Domain to be added">
                    </div>
                    <div class="col-md-2">
                        <label for="ex2">Type:</label>
                        <select id="new_type" class="form-control">
                            <option value="0">Exact whitelist</option>
                            <option value="1">Exact blacklist</option>
                            <option value="2">Regex whitelist</option>
                            <option value="3">Regex blacklist</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <label for="ex3">Comment:</label>
                        <input id="new_comment" type="text" class="form-control" placeholder="Domain description (optional)">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <button id="btnAdd" class="btn btn-primary pull-right">Add</button>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="domains-list">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of configured domains
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="domainsTable" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Domain</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Comment</th>
                        <th>Group assignment</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" hidden="true" class="btn btn-default btn-sm text-red">Reset sorting</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/groups-domains.js"></script>

<?php
require "scripts/pi-hole/php/footer.php";
?>
