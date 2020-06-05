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
    <h1>Find Blocked Domain In Lists</h1>
</div>
<div class="row">
  <div class="col-md-12">
    <div class="box">
      <div class="box-body">
        <div class="form-group">
          <div class="input-group">
            <input id="domain" type="text" class="form-control" placeholder="Domain to look for (example.com or sub.example.com)">
            <input id="quiet" type="hidden" value="no">
            <span class="input-group-btn">
              <button type="button" id="btnSearch" class="btn btn-default">Search partial match</button>
              <button type="button" id="btnSearchExact" class="btn btn-default">Search exact match</button>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<pre id="output" style="width: 100%; height: 100%;" hidden></pre>

<script src="scripts/pi-hole/js/queryads.js"></script>

<?php
    require "scripts/pi-hole/php/footer.php";
?>
