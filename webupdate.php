<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Pi-hole web updater</h1>
</div>

<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden="true">
    Connection closed
</div>

<pre id="output" style="width: 100%; height: 100%;"></pre>

<?php
    require "footer.php";
?>

<script src="js/pihole/webupdate.js"></script>
