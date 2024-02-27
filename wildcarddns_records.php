<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/
/* author DjoSmer */

require 'scripts/pi-hole/php/header_authenticated.php';
?>

<style>
    tr.group {
        background: rgba(0, 0, 0, 0.1) !important;
    }
</style>

<!-- Title -->
<div class="page-header">
    <h1>Local Wildcard DNS Records</h1>
    <small>On this page, you can add Wildcard DNS records.</small>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new Wildcard DNS record
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-3">
                        <label for="domain">Wildcard DNS Name:</label>
                        <input id="wildcardName" type="text" class="form-control" placeholder="Wildcard DNS name" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                    <div class="form-group col-md-6">
                        <label for="domain">Domain:</label>
                        <input id="domain" type="url" class="form-control" placeholder="Domain or comma-separated list of domains" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                    <div class="form-group col-md-3">
                        <label for="ip">IP Address:</label>
                        <input id="ip" type="text" class="form-control" placeholder="Associated IP address" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <strong>Note:</strong>
                <p><code>Wildcard DNS</code>, for those who don’t know – is a trick to allow any kind of host name – to have a specific same IP as it’s DNS name. For example, if my domain is test.com and my IP is 1.2.3.4, the record full.test.com will also have the same IP: 1.2.3.4.</p>
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
                    List of local Wildcard DNS records
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="customWildcardDNSTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>Wildcard DNS Name</th>
                            <th>Domain</th>
                            <th>IP</th>
                            <th>Enabled</th>
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

<script src="<?php echo fileversion('scripts/pi-hole/js/customwildcarddns.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
