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
    <p>On the main page, various statistics of pi-hole are shown to the user:</p>
    <ul>
        <li>Summary: A summary of statistics showing how many out of how many total DNS queries have been blocked today, how that translates into a percentage and how many domains are on the blacklist. This graph is updated every 10 seconds. Changes are highlighted.</li>
        <li>Queries over time: Diagram showing DNS queries (total and blocked) over 10 minute time intervals. More information can be acquired by hovering over the lines.</li>
        <li>Query Types: Shows which types of query have been processed:
            <ul>
                <li>A: IPv4 address lookup (most commonly used to map hostnames to an IP address of the host)</li>
                <li>AAAA: IPv6 address lookup (most commonly used to map hostnames to an IP address of the host)</li>
                <li>PTR: most common use is for implementing reverse DNS lookups</li>
                <li>SRV: Service locator (often used by XMPP, SIP, and LDAP)</li>
            </ul>
        </li>
        <li>Query Types: Shows to which upstream DNS the permitted requests have been forwarded to.</li>
        <li>Top Domains: Ranking of requested sites by number of DNS lookups.</li>
        <li>Top Advertisers: Ranking of requested sites by number of DNS lookups.</li>
        <li>Top Advertisers: Ranking of requested advertisments by number of DNS lookups.</li>
        <li>Top Clients: Ranking of total DNS requests separated by clients on the local network.</li>
    </ul>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Query Log</h2>
    <p>Shows the recent queries after parsing the pi-hole log files. It is possible to search through the whole list by using the "Search" input field. If the status is reported as "OK", then the DNS request has been permitted. Otherwise ("Pi-holed") it has been blocked. By clicking on the buttons under "Action" the corresponding domains can quickly be added to the white-/blacklist. The status of this action will be reported on this page.</p>
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
