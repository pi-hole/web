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
    <h1>Output the last lines of the pihole-FTL.log file (live)</h1>
</div>

<input type="checkbox" name="active" id="active" checked id="chk1"><label for="active">Automatic scrolling on update</label>
<pre id="output" style="width: 100%; height: 100%; max-height:650px; overflow-y:scroll;"></pre>
<input type="checkbox" name="active" id="active" checked id="chk2"><label for="active">Automatic scrolling on update</label>

<script src="scripts/pi-hole/js/taillog-FTL.js"></script>

<?php
    require "scripts/pi-hole/php/footer.php";
?>
