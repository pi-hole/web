<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';
?>

<!-- Title -->
<div class="page-header">
    <h1>Group management</h1>
</div>

<!-- Group Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new group
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="new_name">Name:</label>
                        <input id="new_name" type="text" class="form-control" placeholder="Group name or space-separated group names">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="new_desc">Description:</label>
                        <input id="new_desc" type="text" class="form-control" placeholder="Group description (optional)">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <strong>Hints:</strong>
                <ol>
                    <li>Multiple groups can be added by separating each group name with a space</li>
                    <li>Group names can have spaces if entered in quotes. e.g "My New Group"</li>
                </ol>
                <button type="button" id="btnAdd" class="btn btn-primary pull-right">Add</button>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="groups-list">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of groups
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="groupsTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th></th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Description</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Reset sorting</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/vendor/bootstrap-select.min.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/vendor/bootstrap-toggle.min.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/pi-hole/js/groups.js?v=<?php echo $cacheVer; ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
