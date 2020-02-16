<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
    $type = "all";
    $pagetitle = "Domain";
    $adjective = "";
    if (isset($_GET['type']) && ($_GET['type'] === "white" || $_GET['type'] === "black")) {
        $type = $_GET['type'];
        $pagetitle = ucfirst($type)."list";
        $adjective = $type."listed";
    }
?>

<!-- Title -->
<div class="page-header">
    <h1><?php echo $pagetitle; ?> management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new <?php echo $adjective; ?> domain
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
                            <?php if($type === "all" || $type === "white") { ?>
                                <option value="0">Exact whitelist</option>
                                <option value="2">Regex whitelist</option>
                            <?php } if($type === "white") { ?>
                                <option value="2W">Wildcard whitelist</option>
                            <?php } if($type === "all" || $type === "black") { ?>
                                <option value="1">Exact blacklist</option>
                                <option value="3">Regex blacklist</option>
                            <?php } if($type === "black") { ?>
                                <option value="3W">Wildcard blacklist</option>
                            <?php } ?>
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
                    List of <?php echo $adjective; ?> domains
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
                <button type="button" id="resetButton" hidden="true">Reset sorting</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/groups-common.js"></script>
<script src="scripts/pi-hole/js/groups-domains.js"></script>

<?php
require "scripts/pi-hole/php/footer.php";
?>
