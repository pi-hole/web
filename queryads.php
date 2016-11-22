<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Query list of ad-serving domains</h1>
</div>
<!-- Domain Input -->
<div class="form-group input-group">
    <input id="domain" type="text" class="form-control" placeholder="Domain to look for (example.com or sub.example.com)">
    <span class="input-group-btn">
        <button id="btnSearch" class="btn btn-default" type="button">Search</button>
    </span>
</div>

<pre id="output" style="width: 100%; height: 100%;" hidden="true"></pre>

<?php
    require "footer.php";
?>


<script src="js/pihole/queryads.js"></script>
