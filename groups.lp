<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>

<!-- Title -->
<div class="page-header">
    <h1>Group management</h1>
</div>

<!-- Group Input -->
<div class="row">
    <div class="col-md-12">
        <div class="card" id="add-group">
            <!-- /.card-header -->
            <div class="card-header with-border">
                <h3 class="card-title">
                    Add a new group
                </h3>
            </div>
            <!-- /.card-header -->
            <div class="card-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="new_name">Name:</label>
                        <input id="new_name" type="text" class="form-control" placeholder="Group name">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="new_comment">Comment:</label>
                        <input id="new_comment" type="text" class="form-control" placeholder="Group comment (optional)">
                    </div>
                </div>
            </div>
            <div class="card-footer clearfix">
                <strong>Hints:</strong>
                <ol>
                    <li>Multiple groups can be added by separating each group name with a space or comma</li>
                    <li>Group names can have spaces if entered in quotes. e.g "My New Group"</li>
                </ol>
                <button type="button" id="btnAdd" class="btn btn-primary float-end">Add</button>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="card" id="groups-list">
            <div class="card-header with-border">
                <h3 class="card-title">
                    List of groups
                </h3>
            </div>
            <!-- /.card-header -->
            <div class="card-body">
                <table id="groupsTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th></th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Comment</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Reset sorting</button>
            </div>
            <!-- /.card-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="<?=pihole.fileversion('vendor/bootstrap-select/bootstrap-select.min.js')?>"></script>
<script src="<?=pihole.fileversion('vendor/bootstrap-toggle/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/groups-common.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/groups.js')?>"></script>

<? mg.include('scripts/lua/footer.lp','r')?>
