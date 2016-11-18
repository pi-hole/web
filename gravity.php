<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Update list of ad-serving domains</h1>
</div>

<!-- Alerts -->
<div id="alInfo" class="alert alert-info alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Updating...
</div>
<div id="alSuccess" class="alert alert-success alert-dismissible fade in" role="alert" hidden="true">
    <button type="button" class="close" data-hide="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
    Success!
</div>

<pre id="output" style="width: 100%; height: 100%;"></pre>

<?php
    require "footer.php";
?>


<script src="js/pihole/gravity.js"></script>
