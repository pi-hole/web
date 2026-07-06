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
    <h1>Subscribed lists group management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="card" id="add-group">
            <!-- /.card-header -->
            <div class="card-header">
                <h3 class="card-title">
                    Add a new subscribed list
                </h3>
            </div>
            <!-- /.card-header -->
            <div class="card-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="new_address">Address:</label>
                        <input id="new_address" type="text" class="form-control" placeholder="URL" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                    <div class="form-group col-lg-3 col-md-6">
                        <label for="new_comment">Comment:</label>
                        <input id="new_comment" type="text" class="form-control" placeholder="List description (optional)">
                    </div>
                    <div class="form-group col-lg-3 col-md-6">
                        <label for="new_group">Group assignment:</label>
                        <div><select class="selectpicker form-control" id="new_group" multiple></select></div>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <strong>Hints:</strong>
                <ol>
                    <li>Please run <code>pihole -g</code> or update your gravity list <a href="<?=webhome?>gravity">online</a> after modifying your lists.</li>
                    <li>Multiple lists can be added by separating each <em>unique</em> URL with a space or comma</li>
                </ol>
                <div class="btn-toolbar float-end" role="toolbar" aria-label="Toolbar with buttons">
                    <div class="btn-group" role="group">
                        <button type="button" id="btnAddBlock" class="btn btn-danger float-end">Add blocklist</button>
                    </div>
                    <div class="btn-group" role="group">
                        <button type="button" id="btnAddAllow" class="btn btn-success float-end">Add allowlist</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="card" id="lists-list">
            <div class="card-header">
                <h3 class="card-title">
                    Subscribed lists
                </h3>
            </div><!-- /.card-header -->

            <div class="card-body">
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
                <button type="button" id="resetButton" class="btn btn-secondary btn-sm text-red hidden">Reset sorting</button>
            </div><!-- /.card-body -->

            <div class="card-footer">
                <div class="row">
                    <div class="col-12">
                        <p><strong>Hint:</strong> Click on the icons (first and second columns) to get additional information about your lists. The icons correspond to the health of the list.</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12 list-icon-legend-block">
                        <div class="list-icon-legend">
                            <p><strong>List Status:</strong></p>
                            <div>
                                <span class="fa fa-fw fa-check-circle list-status-1"></span> - List download was successful<br>
                                <span class="fa fa-fw fa-history list-status-2"></span> - List unchanged upstream, Pi-hole used a local copy<br>
                                <span class="fa fa-fw fa-exclamation-circle list-status-3"></span> - List unavailable, Pi-hole used a local copy<br>
                                <span class="fa fa-fw fa-times-circle list-status-4"></span> - List unavailable and no local copy of this list is available<br>
                                <span class="fa fa-fw fa-question-circle list-status-0"></span> - Unknown<br>
                                <em>(The status icon turns gray when the list is disabled.)</em>
                            </div>
                        </div>
                        <div class="list-icon-legend">
                            <p><strong>List Type:</strong></p>
                            <div>
                                <span class="fa fa-fw fa-check text-green"></span> - Allow list<br>
                                <span class="fa fa-fw fa-ban text-red"></span> - Block list
                            </div>
                        </div>
                    </div>
                </div>
            </div><!-- /.card-footer -->

        </div><!-- /.card -->
    </div>
</div>

<script src="<?=pihole.fileversion('vendor/bootstrap-select/bootstrap-select.min.js')?>"></script>
<script src="<?=pihole.fileversion('vendor/bootstrap-toggle/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/groups-common.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/js/groups-lists.js')?>"></script>

<? mg.include('scripts/lua/footer.lp','r')?>
