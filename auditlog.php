<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
?>
<!-- Send PHP info to JS -->
<div id="token" hidden><?php echo $token ?></div>
<!-- Title -->
<div class="page-header">
    <h1>Audit log (showing live data)</h1>
</div>

<div class="row">
    <div class="col-md-6">
      <div class="box" id="domain-frequency">
        <div class="box-header with-border">
          <h3 class="box-title">Allowed queries</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                    <th>Domain</th>
                    <th>Hits</th>
                    <th>Actions</th>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>
        <div class="overlay">
          <i class="fa fa-refresh fa-spin"></i>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <!-- /.col -->
    <div class="col-md-6">
      <div class="box" id="ad-frequency">
        <div class="box-header with-border">
          <h3 class="box-title">Blocked queries</h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table class="table table-bordered">
                  <tbody>
                    <tr>
                    <th>Domain</th>
                    <th>Hits</th>
                    <th>Actions</th>
                    </tr>
                  </tbody>
                </table>
            </div>
        </div>
        <div class="overlay">
          <i class="fa fa-refresh fa-spin"></i>
        </div>
        <!-- /.box-body -->
      </div>
      <!-- /.box -->
    </div>
    <div class="col-md-12">
        <p><strong>Important:</strong> Note that black- and whitelisted domains are not automatically applied on this page to avoid restarting the DNS service too often. Instead, click on this button, to have the new settings become effective:</p>

    </div>
    <!-- /.col -->
</div>
<!-- /.row -->
<div class="container">
  <div class="row justify-content-md-right">
    <div class="col-2">
      <button class="btn btn-lg btn-primary btn-block" id="gravityBtn" disabled="true">Update black-/whitelists</button>
    </div>
  </div>
</div>
<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/pi-hole/js/auditlog.js"></script>
