<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Output the last lines of the pihole.log file (live)</h1>
</div>

<div class="checkbox"><label><input type="checkbox" name="active" checked id="chk1"> enable automatic scrolling on update</label></div>
<pre id="output" style="width: 100%; height: 100%;"></pre>
<div class="checkbox"><label><input type="checkbox" name="active" checked id="chk2"> enable automatic scrolling on update</label></div>

<?php
    require "footer.php";
?>


<script src="js/pihole/taillog.js"></script>
