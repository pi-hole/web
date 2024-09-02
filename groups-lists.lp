<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
?>

<!-- Title -->
<div class="page-header">
    <h1>Subscribed lists group management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new subscribed list
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="new_address">Address:</label>
                        <input id="new_address" type="text" class="form-control" placeholder="URL" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="new_comment">Comment:</label>
                        <input id="new_comment" type="text" class="form-control" placeholder="List description (optional)">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <strong>Hints:</strong>
                <ol>
                    <li>Please run <code>pihole -g</code> or update your gravity list <a href="<?=webhome?>gravity">online</a> after modifying your lists.</li>
                    <li>Multiple lists can be added by separating each <i>unique</i> URL with a space or comma</li>
                    <li>Click on the icon in the first column to get additional information about your lists. The icons correspond to the health of the list.</li>
                </ol>
                <div class="btn-toolbar pull-right" role="toolbar" aria-label="Toolbar with buttons">
                    <div class="btn-group" role="group">
                        <button type="button" id="btnAddBlock" class="btn btn-danger pull-right">Add blocklist</button>
                    </div>
                    <div class="btn-group" role="group">
                        <button type="button" id="btnAddAllow" class="btn btn-success pull-right">Add allowlist</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="lists-list">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Subscribed lists
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="listsTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th></th>
                            <th class="no-padding"></th>
                            <th class="no-padding"></th>
                            <th>Address</th>
                            <th>Status</th>
                            <th>Comment</th>
                            <th>Group assignment</th>
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

<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-select.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/groups-common.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/groups-lists.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
