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

<!-- Title -->
<div class="page-header">
    <h1>Compute Top Lists from the Pi-hole query database</h1>
</div>


<div class="row">
    <div class="col-md-12">
<!-- Date Input -->
      <div class="form-group">
        <label>Date and time range:</label>

        <div class="input-group">
          <div class="input-group-addon">
            <i class="fa fa-clock-o"></i>
          </div>
          <input type="text" class="form-control pull-right" id="querytime">
        </div>
        <!-- /.input group -->
      </div>
    </div>
</div>
<?php
if($boxedlayout)
{
	$tablelayout = "col-md-6";
}
else
{
	$tablelayout = "col-md-6 col-lg-4";
}
?>
<div class="row">
    <div class="<?php echo $tablelayout; ?>">
      <div class="box" id="domain-frequency">
        <div class="box-header with-border">
          <h3 class="box-title">Top Domains</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                    <th>Domain</th>
                    <th>Hits</th>
                    <th>Frequency</th>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>
        <div class="overlay" hidden>
          <i class="fa fa-refresh fa-spin"></i>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?php echo $tablelayout; ?>">
      <div class="box" id="ad-frequency">
        <div class="box-header with-border">
          <h3 class="box-title">Top Blocked Domains</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                    <th>Domain</th>
                    <th>Hits</th>
                    <th>Frequency</th>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>
        <div class="overlay" hidden>
          <i class="fa fa-refresh fa-spin"></i>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="<?php echo $tablelayout; ?>">
      <div class="box" id="client-frequency">
        <div class="box-header with-border">
          <h3 class="box-title">Top Clients</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                    <th>Client</th>
                    <th>Requests</th>
                    <th>Frequency</th>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>
        <div class="overlay" hidden>
          <i class="fa fa-refresh fa-spin"></i>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <!-- /.col -->
</div>

<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/vendor/moment.min.js"></script>
<script src="scripts/vendor/daterangepicker.js"></script>
<script src="scripts/pi-hole/js/db_lists.js"></script>
