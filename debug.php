<?php /* 
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Generate debug log</h1>
</div>

<p><input type="checkbox" id="upload" checked> Upload debug log and provide token once finished</p>
<p>Once you click this button a debug log will be generated and can automatically be uploaded if we detect a working internet connection.</p>
<button class="btn btn-lg btn-primary btn-block" id="debugBtn">Generate debug log</button>
<pre id="output" style="width: 100%; height: 100%;" hidden="true"></pre>

<?php
    require "scripts/pi-hole/php/footer.php";
?>


<script src="scripts/pi-hole/js/debug.js"></script>
