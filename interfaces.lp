<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2024 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title -->
<div class="page-header">
    <h1>Pi-hole interface overview</h1>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <div class="text-center">
                            <i id="spinner" class="fas fa-spinner fa-pulse fa-5x"></i>
                        </div>
                        <div id="tree"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<pre id="output" style="width: 100%; height: 100%;" hidden></pre>

<script src="<?=pihole.fileversion('scripts/js/interfaces.js')?>"></script>
<? mg.include('scripts/lua/footer.lp','r')?>
