<?php
    require "scripts/pi-hole/php/header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Pi-hole web updater</h1>
</div>

<button id="btnStart" class="btn btn-lg btn-primary btn-block" type="button">Start update</button>


<pre id="output" style="width: 100%; height: 100%;"></pre>

<?php
    require "scripts/pi-hole/php/footer.php";
?>

<script src="scripts/pi-hole/js/webupdate.js"></script>
