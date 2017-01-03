<?php
    require "scripts/pi-hole/php/header.php";

    if(strlen($pwhash) > 0)
    {
        $authenticationsystem = true;
    }
    else
    {
        $authenticationsystem = false;
    }
?>

<div class="row">
    <div class="col-md-12">
    <h1>Help center</h1>
    <h2>Header</h2>
    <h4>Top left: Status display</h4>
    <p>Shows different status messages:</p>
    <ul>
        <li>Status: Current status of the Pi-hole - Active (<i class="fa fa-circle" style="color:#7FFF00"></i>), Offline (<i class="fa fa-circle" style="color:#FF0000"></i>), or Starting (<i class="fa fa-circle" style="color:#ff9900"></i>)</li>
        <li>Temp: Current CPU temperature</li>
        <li>Load: load averages for the last minute, 5 minutes and 15 minutes, respectively. A load average of 1 reflects the full workload of a single processor on the system. We show a red icon if the current load exceeds the number of available processors on this machine (which is <?php echo $nproc; ?>)</li>
        <li>Memory: Shows the percentage of memory actually blocked by applications. We show a red icon if the memory usage exceeds 75%</li>
        <li>Disk: Shows the percentage of disk used (for the main partition "/"). A red icon is shown if the disk usage exceeds 79%</li>
    </ul>
    <h4>Top right: About</h4>
    <ul>
        <li>GitHub: Link to the Pi-hole repository</li>
        <li>Details: Link to Jacob Salmela's blog with some more details, describing also the concept of the Pi-hole</li>
        <li>Updates: Link to list of releases</li>
        <li>Update notifications: If updates are available, a link will be shown here.</li>
        <?php if($authenticationsystem){ ?>
        <li>Session timer: Shows the time remaining until the current login session expires.</li>
        <?php } ?>
    </ul>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Main page</h2>
    <p>On the main page, you can see various Pi-hole statistics:</p>
    <ul>
        <li>Summary: A summary of statistics showing how many total DNS queries have been blocked today, what percentage of DNS queries have been blocked, and how many domains are in the compiled ad list. This summary is updated every 10 seconds.</li>
        <li>Queries over time: Graph showing DNS queries (total and blocked) over 10 minute time intervals. More information can be acquired by hovering over the lines. This graph is updated every 10 minutes.</li>
        <li>Query Types: Identifies the types of processed queries:
            <ul>
                <li>A: address lookup (most commonly used to map hostnames to an IPv4 address of the host)</li>
                <li>AAAA: address lookup (most commonly used to map hostnames to an IPv6 address of the host)</li>
                <li>PTR: most common use is for implementing reverse DNS lookups</li>
                <li>SRV: Service locator (often used by XMPP, SIP, and LDAP)</li>
                <li>and others</li>
            </ul>
        </li>
        <li>Query Types: Shows to which upstream DNS the permitted requests have been forwarded to.</li>
        <li>Top Domains: Ranking of requested sites by number of DNS lookups.</li>
        <li>Top Advertisers: Ranking of requested advertisements by number of DNS lookups.</li>
        <li>Top Clients: Ranking of how many DNS requests each client has made on the local network.</li>
    </ul>
    <?php if($authenticationsystem){ ?>
    <p>Note that the login session does <em>not</em> expire on the main page, as the summary is updated every 10 seconds which refreshes the session.</p>
    <?php } ?>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Query Log</h2>
    <p>Shows the recent queries by parsing Pi-hole's log. It is possible to search through the whole list by using the "Search" input field. If the status is reported as "OK", then the DNS request has been permitted. Otherwise ("Pi-holed") it has been blocked. By clicking on the buttons under "Action" the corresponding domains can quickly be added to the white-/blacklist. The status of the action will be reported on this page.</p>
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
    <p>Will download any updates from the third-party ad-serving domain lists that we source. By default, this command runs once a week via cron.</p>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Query adlists</h2>
    This function is useful to find out what list a domain appears on. Since we don't control what the third-parties put on the block lists, you may find that a domain you normally visit stops working. If this is the case, you could run  this command to scan for strings in the list of blocked domains and it will return the list the domain is found on. This proved useful a while back when the Mahakala list was adding apple.com and microsoft.com to their block list.</p>
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Disable / Enable</h2>
    Disables/enables Pi-Hole blocking completely. You may have to wait a few minutes for the changes to reach all of your devices. The change will be reflected by a changed status (top left)
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Settings</h2>
    Change settings for the Pi-Hole
    <h4>Networking</h4>
    Displays information about the interfaces of the Pi-Hole. No changes possible
    <h4>Pi-Hole DHCP Server</h4>
    Using this setting you can enable/disable the DHCP server of the Pi-Hole. Note that you should disable any other DHCP server on your network to avoid IP addresses being used more than once. You have to give the range of IPs that DHCP will serve and the IP of the local router (gateway). If the DHCP server is active, the current leases are shown on the settings page.
    <h4>Upstream DNS Servers</h4>
    Customize used upstream DNS servers + advanced settings
    <h4>Query Logging</h4>
    Enabled/disable query logging on your Pi-hole
    <h4>API</h4>
    Change settings which apply to the API as well as the web UI<br>
    Note that Top Clients have to be given as IP addresses
    <h4>Web User Interface</h4>
    Other settings which affect the webUI but not the API of Pi-hole
    <h4>System Administration</h4>
    Apply system-wide actions like restarting of the server
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Authentication system (currently <?php if($authenticationsystem) { ?>enabled<?php } else { ?>disabled<?php } ?>)</h2>
    <p>Using the command<pre>sudo pihole -a -p pa22w0rd</pre> where <em>pa22w0rd</em> is the password to be set in this example, one can enable the authentication system of this web interface. Thereafter, a login is required for most pages (the main page will show a limited amount of statistics). Note that the authentication system may be disabled again, by setting an empty password using the command shown above. The Help center will show more details concerning the authentication system only if it is enabled</p>
    </div>
</div>
<?php if($authenticationsystem) { ?>
<div class="row">
    <div class="col-md-12">
    <h2>Login / Logout</h2>
    <p>Using the Login / Logout function, a user can initiate / terminate a login session. The login page will also always be shown if a user tries to access a protected page directly without having a valid login session</p>
    </div>
</div>
<?php } ?>
<div class="row">
    <div class="col-md-12">
    <h2>Donate</h2>
    Keep in mind that Pi-hole is free. If you like Pi-hole, please consider a small donation to help support its development
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Help (this page)</h2>
    Shows information about what is happening behind the scenes and what can be done with this web user interface (web UI). The Help center will show details concerning the authentication system only if it is enabled
    </div>
</div>
<div class="row">
    <div class="col-md-12">
    <h2>Footer</h2>
    Shows the currently installed Pi-hole and Web Interface version. If an update is available, this will be indicated here
    </div>
</div>

<?php
    require "scripts/pi-hole/php/footer.php";
?>
