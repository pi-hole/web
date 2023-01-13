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
    <h1>Local CNAME Records</h1>
    <small>On this page, you can add CNAME records.</small>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new CNAME record
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
                        <label for="target">Target Domain:</label>
                        <input id="target" type="url" class="form-control" placeholder="Associated Target Domain" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <strong>Note:</strong>
                <p>The target of a <code>CNAME</code> must be a domain that the Pi-hole already has in its cache or is authoritative for. This is a universal limitation of <code>CNAME</code> records.</p>
                <p>The reason for this is that Pi-hole will not send additional queries upstream when serving <code>CNAME</code> replies. As consequence, if you set a target that isn't already known, the reply to the client may be incomplete. Pi-hole just returns the information it knows at the time of the query. This results in certain limitations for <code>CNAME</code> targets,
                for instance, only <i>active</i> DHCP leases work as targets - mere DHCP <i>leases</i> aren't sufficient as they aren't (yet) valid DNS records.</p>
                <p>Additionally, you can't <code>CNAME</code> external domains (<code>bing.com</code> to <code>google.com</code>) successfully as this could result in invalid SSL certificate errors when the target server does not serve content for the requested domain.</p>
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
                    List of local CNAME records
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="customCNAMETable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>Domain</th>
                            <th>Target</th>
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

<script src="<?php echo fileversion('scripts/pi-hole/js/customcname.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
