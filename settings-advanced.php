<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';
?>
<div class="row" id="advanced-content">
    <!-- dynamically filled with content -->
    <div class="overlay" id="advanced-overlay">
        <i class="fa fa-sync fa-spin"></i>
    </div>
</div>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings-advanced.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
