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
        <li>Status: Current status of the Pi-hole - Active (<i class="fa fa-circle" style="color:#7FFF00"></i>), Offline (<i class="fa fa-circle" style="color:#FF0000"></i>), or Starting (<i class="fa fa-circle" style="color:#ff9900"></i>)</li>
        <li>Temp: Current CPU temperature
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
        <li>Load: load averages for the last minute, 5 minutes and 15 minutes, respectively. A load average of 1 reflects the full workload of a single processor on the system. We show a red icon if the current load exceeds the number of available processors on this machine (which is <?php echo $nproc; ?>)</li>
        <li>Memory usage: Shows the percentage of memory acutally blocked by applications. We show a red icon if the memory usage exceeds 75%</li>
    </ul>
    <h3>Top right: About</h3>
    <ul>
        <li>GitHub: Link to pi-hole repository</li>
        <li>Details: Link to Jacob Salmela's blog with some more details, describing also the concept of the Pi-hole</li>
        <li>Updates: Link to list of releases</li>
        <li>Update notifications: If updates are available, a link will be shown here.</li>
    </ul>
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
