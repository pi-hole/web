<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";

// Generate CSRF token
if(empty($_SESSION['token'])) {
    $_SESSION['token'] = base64_encode(openssl_random_pseudo_bytes(32));
}
$token = $_SESSION['token'];
?>
<!-- Send PHP info to JS -->
<div id="token" hidden><?php echo $token ?></div>

<div class="row">
    <div class="col-md-12">
      <div class="box" id="network-details">
        <div class="box-header with-border">
          <h3 class="box-title">Network overview</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <table id="network-entries" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                <thead>
                    <tr>
                        <th>IP address</th>
                        <th>Hardware address</th>
                        <th>Interface</th>
                        <th>Hostname</th>
                        <th>First seen</th>
                        <th>Last Query</th>
                        <th>Number of queries</th>
                        <th>Uses Pi-hole</th>
                    </tr>
                </thead>
                <tfoot>
                    <tr>
                        <th>IP address</th>
                        <th>Hardware address</th>
                        <th>Interface</th>
                        <th>Hostname</th>
                        <th>First seen</th>
                        <th>Last Query</th>
                        <th>Number of queries</th>
                        <th>Uses Pi-hole</th>
                    </tr>
                </tfoot>
            </table>
            <label>Background color: Last query from this device seen ...</label>
        <table width="100%">
          <tr class="text-center">
            <td style="background: #e7ffde;" width="15%">just now</td>
            <td style="background-image: linear-gradient(to right, #e7ffde 0%, #ffffdf 100%)" width="30%"><center>... to ...</center></td>
            <td style="background: #ffffdf;" width="15%">24 hours ago</td>
            <td style="background: #ffedd9;" width="20%">&gt; 24 hours ago</td>
            <td style="background: #ffbfaa;" width="20%">Device does not use Pi-hole</td>
          </tr>
        </table>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
</div>
<!-- /.row -->

<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/vendor/moment.min.js"></script>
<script src="scripts/pi-hole/js/ip-address-sorting.js"></script>
<script src="scripts/pi-hole/js/network.js"></script>
