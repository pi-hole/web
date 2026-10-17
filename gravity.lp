<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title/Header -->
<div class="app-content-header">
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <h1 class="mb-0">Update Gravity (list of blocked domains)</h1>
            </div>
        </div>
    </div>
</div>

<div class="app-content">
    <div class="container-fluid">
        <!-- Alerts -->
        <div id="alertInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden>
            <button type="button" class="btn-close" data-hide="alert" aria-label="Close"></button>
            Updating... this may take a while. <strong>Please do not navigate away from or close this page.</strong>
        </div>
        <div id="alertSuccess" class="alert alert-success alert-dismissible fade in" role="alert" hidden>
            <button type="button" class="btn-close" data-hide="alert" aria-label="Close"></button>
            Success!
        </div>

        <button type="button" id="gravityBtn" class="btn btn-lg btn-primary w-100">Update</button>
        <pre id="output" class="bg-body-tertiary text-body mt-3 p-2 border rounded text-body d-none"></pre>

    </div><!-- /.container-fluid -->
</div><!-- /.app-content -->

<script src="<?=pihole.fileversion('scripts/js/gravity.js')?>"></script>
<? mg.include('scripts/lua/footer.lp','r')?>
