<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Output the last lines of the pihole.log file (live)</h1>
</div>

<pre id="output" style="width: 100%; height: 100%;" hidden="true"></pre>

<?php
    require "footer.php";
?>


<script src="js/pihole/taillog.js"></script>
