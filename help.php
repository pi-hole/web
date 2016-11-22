<?php
    require "header.php";
?>

<div class="row">
    <div class="col-md-12">
    <h1>Help center</h1>
    <h2>Header</h2>
    <h4>Top left: Status display</h4>
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
        <li>Memory usage: Shows the percentage of memory actually blocked by applications. We show a red icon if the memory usage exceeds 75%</li>
    </ul>
    <h4>Top right: About</h4>
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
                <li>and others</li>
            </ul>
        </li>
        <li>Query Types: Shows to which upstream DNS the permitted requests have been forwarded to.</li>
        <li>Top Domains: Ranking of requested sites by number of DNS lookups.</li>
        <li>Top Advertisers: Ranking of requested sites by number of DNS lookups.</li>
        <li>Top Advertisers: Ranking of requested advertisements by number of DNS lookups.</li>
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
    <p>Add or remove domains (or subdomains) from the white-/blacklist. If a domain is added to e.g. the whitelist, any possible entry of the same domain will be automatically removed from the blacklist and vice versa. Adding wildcards using the web UI is currently <em>not</em> supported.</p>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Update Lists</h2>
    <p>Runs the command <pre>sudo pihole -g</pre> and prints the result transparently to the web UI. The gravity.sh script will update the list of ad-serving domains</p>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Disable / Enable</h2>
    Disables resp. enables Pi-Hole DNS Blocking completely. The change will be reflected by a changed status (top left)
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Donate</h2>
    If you like Pi-Hole, please consider a small donation. Keep in mind that Pi-hole is free, but powered by your donations
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Help (this page)</h2>
    Shows information about what is happening behind the scenes and what can be done with this web user interface (web UI)
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Footer</h2>
    Shows the currently installed Pi-hole and Web Interface version. If an update is available, this will be indicated here
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Emergency help</h2>
    In case the web UI does not work properly anymore (i.e. timeout errors or diagrams not showing up) you can try to flush the Pi-hole config file by clicking <a href="#" id="flush">FLUSH</a>. Note that your statistics will be reset and you loose the statistics of the day until now.
    </div>
</div>

<?php
    // Web based flushing of pi-hole log file
    if (isset($_GET["flush"]))
    {
        if($_GET["flush"] == "true")
        {
            exec("sudo pihole -f");
        }
    }

    require "footer.php";
?>

<script src="js/pihole/help.js"></script>
