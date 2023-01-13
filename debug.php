<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';
?>
<!-- Title -->
<div class="page-header">
    <h1>Generate debug log</h1>
</div>
<div class="box">
    <div class="box-header with-border"><h1 class="box-title">Options:</h1></div>
    <div class="box-body">
        <div>
            <input type="checkbox" id="dbcheck">
            <label for="dbcheck"><strong>Execute database integrity check.</strong>
                <br class="hidden-md hidden-lg"><span class="text-red">This can add several minutes to debug log time.</span>
            </label>
        </div>
        <div>
            <input type="checkbox" id="upload">
            <label for="upload"><strong>Upload debug log and provide Debug Token.</strong>
                <br class="hidden-md hidden-lg"><span>The URL token will be shown at the end of the report, once finished.</span>
            </label>
        </div>
    </div>
</div>
<br>
<p>Once you click this button a debug log will be generated and can automatically be uploaded if we detect a working internet connection.</p>
<button type="button" id="debugBtn" class="btn btn-lg btn-primary btn-block">Generate debug log</button>
<pre id="output" style="width: 100%; height: 100%;" hidden></pre>

<script src="<?php echo fileversion('scripts/pi-hole/js/debug.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
