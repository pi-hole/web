<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Pi-hole web updater</h1>
</div>

<button id="btnStart" class="btn btn-default" type="button">Start update</button>


<pre id="output" style="width: 100%; height: 100%;"></pre>

<?php
    require "footer.php";
?>

<script src="js/pihole/webupdate.js"></script>
