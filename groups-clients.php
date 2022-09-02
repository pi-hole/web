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
    <h1>Client group management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-client">
            <!-- /.box-header -->
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new client
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="select">Known clients:</label>
                        <select id="select" class="form-control" placeholder="">
                            <option disabled selected>Loading...</option>
                        </select>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="new_comment">Comment:</label>
                        <input id="new_comment" type="text" class="form-control" placeholder="Client description (optional)">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                        <p>You can select an existing client or add a custom one by typing into the field above and confirming your entry with <kbd>&#x23CE;</kbd>.</p>
                        <p>Clients may be described either by their IP addresses (IPv4 and IPv6 are supported),
                            IP subnets (CIDR notation, like <code>192.168.2.0/24</code>),
                            their MAC addresses (like <code>12:34:56:78:9A:BC</code>),
                            by their hostnames (like <code>localhost</code>), or by the interface they are connected to (prefaced with a colon, like <code>:eth0</code>).
                        </p>
                        <p>Note that client recognition by IP addresses (incl. subnet ranges) are preferred over MAC address, host name or interface recognition as
                            the two latter will only be available after some time.
                            Furthermore, MAC address recognition only works for devices at most one networking hop away from your Pi-hole.
                        </p>
                    </div>
                </div>
            </div>
            <div class="box-footer clearfix">
                <button type="button" id="btnAdd" class="btn btn-primary pull-right">Add</button>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box" id="clients-list">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of configured clients
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="clientsTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th></th>
                            <th title="Acceptable values are: IP address, subnet (CIDR notation), MAC address (AA:BB:CC:DD:EE:FF format) or host names.">Client</th>
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

<script src="scripts/vendor/bootstrap-select.min.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/vendor/bootstrap-toggle.min.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/pi-hole/js/ip-address-sorting.js?v=<?php echo $cacheVer; ?>"></script>
<script src="scripts/pi-hole/js/groups-clients.js?v=<?php echo $cacheVer; ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
