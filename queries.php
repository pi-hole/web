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

$showing = "";

if(isset($setupVars["API_QUERY_LOG_SHOW"]))
{
	if($setupVars["API_QUERY_LOG_SHOW"] === "all")
	{
		$showing = "showing all queries";
	}
	elseif($setupVars["API_QUERY_LOG_SHOW"] === "permittedonly")
	{
		$showing = "showing permitted queries only";
	}
	elseif($setupVars["API_QUERY_LOG_SHOW"] === "blockedonly")
	{
		$showing = "showing blocked queries only";
	}
	elseif($setupVars["API_QUERY_LOG_SHOW"] === "nothing")
	{
		$showing = "showing no queries at all";
	}
}
else
{
	// If filter variable is not set, we
	// automatically show all queries
	$showing = "showing all queries";
}

if(isset($_GET["all"]))
{
	$showing .= " within the Pi-hole log";
}
else if(isset($_GET["client"]))
{
	$showing .= " for client ".htmlentities($_GET["client"]);
}
else if(isset($_GET["domain"]))
{
	$showing .= " for domain ".htmlentities($_GET["domain"]);
}
else if(isset($_GET["from"]) && isset($_GET["until"]))
{
	$showing .= " within limited time interval";
}
else
{
	$showing .= " within recent 10 minutes, <a href=\"?all\">show all</a>";
}

if(isset($setupVars["API_PRIVACY_MODE"]))
{
	if($setupVars["API_PRIVACY_MODE"])
	{
		// Overwrite string from above
		$showing .= ", privacy mode enabled";
	}
}

if(strlen($showing) > 0)
{
	$showing = "(".$showing.")";
}
?>
<!-- Send PHP info to JS -->
<div id="token" hidden><?php echo $token ?></div>


<!--
<div class="row">
    <div class="col-md-12">
        <button class="btn btn-info margin-bottom pull-right">Refresh Data</button>
    </div>
</div>
-->

<!-- Alerts -->
<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Adding <span id="alDomain"></span> to the <span id="alList"></span>...
</div>
<div id="alSuccess" class="alert alert-success alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Success!
</div>
<div id="alFailure" class="alert alert-danger alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Failure! Something went wrong.<span id="err"></span>
</div>

<div class="row">
    <div class="col-md-12">
      <div class="box" id="recent-queries">
        <div class="box-header with-border">
          <h3 class="box-title">Recent Queries <?php echo $showing; ?></h3>
        </div>
        <!-- /.box-header -->
        <div class="box-body">
            <div class="table-responsive">
                <table id="all-queries" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tfoot>
                        <tr>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Domain</th>
                            <th>Client</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </tfoot>
                </table>
            </div>
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
<script src="scripts/pi-hole/js/queries.js"></script>
