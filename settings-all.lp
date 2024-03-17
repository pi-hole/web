<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')

-- Page title and level selector
PageTitle = "All Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row settings-level-expert" id="advanced-content">
    <!-- dynamically filled with content -->
    <div class="overlay" id="advanced-overlay">
        <i class="fa fa-sync fa-spin"></i>
    </div>
    <div class="col-lg-12 settings-level-expert save-button-container">
        <button type="button" class="btn btn-primary save-button"><i class="fa-solid fa-fw fa-floppy-disk"></i>&nbsp;Save & Apply</button>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-advanced.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
