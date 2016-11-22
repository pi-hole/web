<?php
    require "header.php";
?>
<!-- Title -->
<div class="page-header">
    <h1>Help center</h1>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Header</h2>
    <h3>Top left: Status display</h3>
    <p>Shows different status messages:</p>
    <ul>
        <li>Status (Active, Offline, Starting) of the Pi-hole</li>
        <li>Current CPU temperature
        <?php
        if($temperatureunit != "F"){
        ?>
        (switch unit to <a href="help.php?tempunit=fahrenheit">Fahrenheit</a>)
        <?php
        }
        else
        {
        ?>
        (switch unit to <a href="help.php?tempunit=celsius">Celsius</a>)
        <?php
        }
        ?></li>
        <li></li>
    </ul>
    <h3>Top right: About</h3>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Main page</h2>
    <p>On the main page, various statistics of pi-hole are shown to the user.</p>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Query Log</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>White- / Blacklist</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Update lists</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Disable / Enable</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Donate</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Help (this page)</h2>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Footer</h2>
    </div>
</div>


<?php
    require "footer.php";
?>
