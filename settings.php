<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';

if (isset($_GET['tab']) && in_array($_GET['tab'], array('sysadmin', 'dns', 'dhcp', 'api', 'privacy', 'advanced', 'teleporter'))) {
    $tab = $_GET['tab'];
} else {
    $tab = 'sysadmin';
}
?>
<div class="row">
    <div class="col-md-12">
        <div class="nav-tabs-custom">
            <ul class="nav nav-tabs" role="tablist">
                <li role="presentation"<?php if ($tab === 'sysadmin') { ?> class="active"<?php } ?>>
                    <a href="#sysadmin" aria-controls="sysadmin" aria-expanded="<?php echo $tab === 'sysadmin' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">System</a>
                </li>
                <li role="presentation"<?php if ($tab === 'dns') { ?> class="active"<?php } ?>>
                    <a href="#dns" aria-controls="dns" aria-expanded="<?php echo $tab === 'dns' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">DNS</a>
                </li>
                <li role="presentation"<?php if ($tab === 'dhcp') { ?> class="active"<?php } ?>>
                    <a href="#dhcp" aria-controls="dhcp" aria-expanded="<?php echo $tab === 'dhcp' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">DHCP</a>
                </li>
                <li role="presentation"<?php if ($tab === 'api') { ?> class="active"<?php } ?>>
                    <a href="#api" aria-controls="api" aria-expanded="<?php echo $tab === 'api' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">API / Web interface</a>
                </li>
                <li role="presentation"<?php if ($tab === 'privacy') { ?> class="active"<?php } ?>>
                    <a href="#privacy" aria-controls="privacy" aria-expanded="<?php echo $tab === 'privacy' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">Privacy</a>
                </li>
                <li role="presentation"<?php if ($tab === 'advanced') { ?> class="active"<?php } ?>>
                    <a href="#advanced" aria-controls="advanced" aria-expanded="<?php echo $tab === 'advanced' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">Advanced</a>
                </li>
                <li role="presentation"<?php if ($tab === 'teleporter') { ?> class="active"<?php } ?>>
                    <a href="#teleporter" aria-controls="teleporter" aria-expanded="<?php echo $tab === 'teleporter' ? 'true' : 'false'; ?>" role="tab" data-toggle="tab">Teleporter</a>
                </li>
            </ul>
            <div class="tab-content">
                <!-- ######################################################### System admin ######################################################### -->
                <div id="sysadmin" class="tab-pane fade<?php if ($tab === 'sysadmin') { ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="box">
                                <div class="box-header with-border">
                                    <h3 class="box-title">System Information</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <table class="table table-striped table-bordered nowrap">
                                                <tbody>
                                                    <tr>
                                                        <th scope="row">Hostname:</th>
                                                        <td><span id="sysinfo-hostname"></span></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">CPU:</th>
                                                        <td><span id="sysinfo-cpu"></span> <span id="sysinfo-cpu-ftl"></span></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Used memory:</th>
                                                        <td><span id="sysinfo-memory-ram"></span> <span id="sysinfo-ram-ftl"></span</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Used swap:</th>
                                                        <td><span id="sysinfo-memory-swap"></span></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Kernel:</th>
                                                        <td><span id="sysinfo-kernel"></span></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Uptime:</th>
                                                        <td><span id="sysinfo-uptime"></span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="overlay" id="sysinfo-system-overlay">
                                    <i class="fa fa-sync fa-spin"></i>
                                </div>
                            </div>
                            <div class="box">
                                <div class="box-header with-border">
                                    <h3 class="box-title">FTL Information</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <table class="table table-striped table-bordered nowrap">
                                                <tbody>
                                                    <tr>
                                                        <th scope="row">FTL's PID:</th>
                                                        <td><span id="sysinfo-pid-ftl"></span></td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">Privacy level:</th>
                                                        <td><span id="sysinfo-privacy_level"></span></td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                <div class="overlay" id="sysinfo-ftl-overlay">
                                    <i class="fa fa-sync fa-spin"></i>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="box">
                                <div class="box-header with-border">
                                    <h3 class="box-title">DNS Information</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <table class="table table-striped table-bordered nowrap">
                                                <tbody>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Size of the DNS domain cache">DNS cache size:</span>
                                                        </th>
                                                        <td id="sysinfo-cache-size">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Number of cache insertions">DNS cache insertions:</span>
                                                        </th>
                                                        <td id="sysinfo-cache-inserted">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            <span title="Number of cache entries that had to be removed although they are not expired (increase cache size to reduce this number)" lookatme-text="DNS cache evictions:">DNS cache evictions:</span>
                                                        </th>
                                                        <td id="sysinfo-cache-evicted">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid A records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-a">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid AAAA records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-aaaa">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid CNAME records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-cname">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid SRV records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-srv">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid DS records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-ds">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Valid DNSKEY records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-dnskey">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Other valid records in cache:
                                                        </th>
                                                        <td id="sysinfo-cache-valid-other">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            DNS cache expiries:
                                                        </th>
                                                        <td id="sysinfo-cache-expired">&nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <th scope="row">
                                                            Immortal DNS cache entries:
                                                        </th>
                                                        <td id="sysinfo-cache-immortal">&nbsp;</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            See also our <a href="https://docs.pi-hole.net/ftldns/dns-cache/" rel="noopener" target="_blank">DNS cache documentation</a>.
                                        </div>
                                    </div>
                                </div>
                                <div class="overlay" id="sysinfo-cache-overlay">
                                    <i class="fa fa-sync fa-spin"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="box box-warning">
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-4">
                                            <?php if ($piHoleLogging) { ?>
                                                <button type="button" class="btn btn-warning confirm-disablelogging-noflush btn-block">Disable query logging</button>
                                            <?php } else { ?>
                                                <form role="form" method="post">
                                                    <input type="hidden" name="action" value="Enable">
                                                    <input type="hidden" name="field" value="Logging">
                                                    <input type="hidden" name="token" value="<?php echo $token; ?>">
                                                    <button type="submit" class="btn btn-success btn-block">Enable query logging</button>
                                                </form>
                                            <?php } ?>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-warning confirm-flusharp btn-block">Flush network table</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-warning confirm-restartdns btn-block">Restart DNS resolver</button>
                                        </div>
                                    </div>
                                    <br/>
                                    <div class="row">
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-flushlogs btn-block">Flush logs (last 24 hours)</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-poweroff btn-block">Power off system</button>
                                        </div>
                                        <p class="hidden-md hidden-lg"></p>
                                        <div class="col-md-4">
                                            <button type="button" class="btn btn-danger confirm-reboot btn-block">Restart system</button>
                                        </div>
                                    </div>

                                    <form role="form" method="post" id="flushlogsform">
                                        <input type="hidden" name="field" value="flushlogs">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                    <form role="form" method="post" id="flusharpform">
                                        <input type="hidden" name="field" value="flusharp">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                    <form role="form" method="post" id="disablelogsform-noflush">
                                        <input type="hidden" name="field" value="Logging">
                                        <input type="hidden" name="action" value="Disable-noflush">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                    <form role="form" method="post" id="poweroffform">
                                        <input type="hidden" name="field" value="poweroff">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                    <form role="form" method="post" id="rebootform">
                                        <input type="hidden" name="field" value="reboot">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                    <form role="form" method="post" id="restartdnsform">
                                        <input type="hidden" name="field" value="restartdns">
                                        <input type="hidden" name="token" value="<?php echo $token; ?>">
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### DNS ################################################################## -->
                <div id="dns" class="tab-pane fade<?php if ($tab === 'dns') { ?> in active<?php } ?>">
                    <div class="row">
                        <div class="col-lg-6">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h1 class="box-title">Upstream DNS Servers</h1>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-sm-12">
                                            <table class="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th colspan="2">IPv4</th>
                                                        <th colspan="2">IPv6</th>
                                                        <th>Name</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="DNSupstreamsTable">
                                                </tbody>
                                            </table>
                                            <p>ECS (Extended Client Subnet) defines a mechanism for recursive resolvers to send partial client IP address information to authoritative DNS name servers. Content Delivery Networks (CDNs) and latency-sensitive services use this to give geo-located responses when responding to name lookups coming through public DNS resolvers. <em>Note that ECS may result in reduced privacy.</em></p>
                                        </div>
                                        <div class="col-sm-12">
                                            <div class="box collapsed-box">
                                                <div class="box-header with-border pointer no-user-select" data-widget="collapse">
                                                    <h3 class="box-title">Custom DNS servers <span id="custom-servers-title"></span></h3>
                                                    <div class="box-tools pull-right">
                                                        <button type="button" class="btn btn-box-tool">
                                                            <i class="fa fa-plus"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="box-body">
                                                    <p>The following list contains all DNS servers selected above. Furthermore, you can add your own custom DNS servers here. The expected format is one server per line in form of <code>IP#port</code>, where the <code>port</code> is optional. If given, it has to be separated by a hash <code>#</code> from the address (e.g. <code>127.0.0.1#5335</code> for a local <code>unbound</code> istance running on port <code>5335</code>). The port defaults to 53 if omitted.</p>
                                                    <textarea class="form-control" rows="3" id="DNSupstreamsTextfield" placeholder="Enter upstream DNS servers, one per line" style="resize: vertical;"></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-lg-6">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h1 class="box-title">Interface settings</h1>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div class="form-group">
                                                <div class="no-danger-area">
                                                    <h4>Recommended setting</h4>
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="dns.listeningMode-LOCAL">
                                                        <label for="dns.listeningMode-LOCAL"><strong>Allow only local requests</strong><br>Allows only queries from devices that are at most one hop away (local devices)</label>
                                                    </div>
                                                </div>
                                                <div class="danger-area">
                                                    <h4>Potentially dangerous options</h4>Make sure your Pi-hole is properly firewalled!
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="dns.listeningMode-SINGLE">
                                                        <label for="dns.listeningMode-SINGLE"><strong>Respond only on interface <span id="interface-name-1"></span></strong></label>
                                                    </div>
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="dns.listeningMode-BIND">
                                                        <label for="dns.listeningMode-BIND"><strong>Bind only to interface <span id="interface-name-2"></span></strong></label>
                                                    </div>
                                                    <div>
                                                        <input type="radio" name="DNSinterface" id="dns.listeningMode-ALL">
                                                        <label for="dns.listeningMode-ALL"><strong>Permit all origins</strong></label>
                                                    </div>
                                                    <p>These options are dangerous on devices
                                                        directly connected to the Internet such as cloud instances and are only safe if your
                                                        Pi-hole is properly firewalled. In a typical at-home setup where your Pi-hole is
                                                        located within your local network (and you have <strong>not</strong> forwarded port 53
                                                        in your router!) they are safe to use.</p>
                                                </div>
                                            </div>
                                            <p>See <a href="https://docs.pi-hole.net/ftldns/interfaces/" target="_blank">our documentation</a> for further technical details.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-lg-12">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Advanced DNS settings</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-lg-12">
                                            <div>
                                                <input type="checkbox" id="dns.domainNeeded" title="domain-needed">
                                                <label for="dns.domainNeeded"><strong>Never forward non-FQDN <code>A</code> and <code>AAAA</code> queries</strong></label>
                                                <p>Tells Pi-hole to never forward A or AAAA queries for plain
                                                    names, without dots or domain parts, to upstream nameservers. If
                                                    the name is not known from <code>/etc/hosts</code> or DHCP then a "not found"
                                                    answer is returned.<br>
                                                    If Conditional Forwarding is enabled, unticking this box may cause a partial
                                                    DNS loop under certain circumstances (e.g. if a client would send TLD DNSSEC queries).</p>
                                            </div>
                                            <div>
                                                <input type="checkbox" id="dns.bogusPriv" title="bogus-priv">
                                                <label for="dns.bogusPriv"><strong>Never forward reverse lookups for private IP ranges</strong></label>
                                                <p>All reverse lookups for private IP ranges (i.e., <code>192.168.0.x/24</code>, etc.)
                                                    which are not found in <code>/etc/hosts</code> or the DHCP leases are answered
                                                    with "no such domain" rather than being forwarded upstream. The set
                                                    of prefixes affected is the list given in <a href="https://tools.ietf.org/html/rfc6303">RFC6303</a>.</p>
                                                    <p><strong>Important</strong>: Enabling these two options may increase your privacy,
                                                    but may also prevent you from being able to access
                                                    local hostnames if the Pi-hole is not used as DHCP server.</p>
                                            </div>
                                            <br>
                                            <div>
                                                <input type="checkbox" id="dns.dnssec">
                                                <label for="dns.dnssec"><strong>Use DNSSEC</strong></label>
                                                <p>Validate DNS replies and cache DNSSEC data. When forwarding DNS
                                                    queries, Pi-hole requests the DNSSEC records needed to validate
                                                    the replies. If a domain fails validation or the upstream does not
                                                    support DNSSEC, this setting can cause issues resolving domains.
                                                    Use an upstream DNS server which supports DNSSEC when activating DNSSEC. Note that
                                                    the size of your log might increase significantly
                                                    when enabling DNSSEC. A DNSSEC resolver test can be found
                                                    <a href="https://dnssec.vs.uni-due.de/" rel="noopener" target="_blank">here</a>.</p>
                                            </div>
                                            <br>
                                            <h4>Rate-limiting</h4>
                                            <p>Block clients making more than <input type="number" id="dns.rateLimit.count" value="" min="0" step="10" style="width: 5em;"> queries within
                                                <input type="number" id="dns.rateLimit.interval" value="" min="0" step="10" style="width: 4em;"> seconds.</p>
                                                <p>When a client makes too many queries in too short time, it
                                                gets rate-limited. Rate-limited queries are answered with a
                                                <code>REFUSED</code> reply and not further processed by FTL
                                                and prevent Pi-holes getting overwhelmed by rogue clients.
                                                It is important to note that rate-limiting is happening on a
                                                per-client basis. Other clients can continue to use FTL while
                                                rate-limited clients are short-circuited at the same time.</p>
                                            <p>Rate-limiting may be disabled altogether by setting both
                                                values to zero. See
                                                <a href="https://docs.pi-hole.net/ftldns/configfile/#rate_limit" target="_blank">our documentation</a>
                                                for further details.</p>
                                            <br>
                                            <h4>Conditional forwarding</h4>
                                            <p>If not configured as your DHCP server, Pi-hole typically won't be able to
                                                determine the names of devices on your local network.  As a
                                                result, tables such as Top Clients will only show IP addresses.</p>
                                            <p>One solution for this is to configure Pi-hole to forward these
                                                requests to your DHCP server (most likely your router), but only for devices on your
                                                home network.  To configure this we will need to know the IP
                                                address of your DHCP server and which addresses belong to your local network.
                                                Exemplary input is given below as placeholder in the text boxes (if empty).</p>
                                            <p>If your local network spans 192.168.0.1 - 192.168.0.255, then you will have to input
                                                <code>192.168.0.0/24</code>. If your local network is 192.168.47.1 - 192.168.47.255, it will
                                                be <code>192.168.47.0/24</code> and similar. If your network is larger, the CIDR has to be
                                                different, for instance a range of 10.8.0.1 - 10.8.255.255 results in <code>10.8.0.0/16</code>,
                                                whereas an even wider network of 10.0.0.1 - 10.255.255.255 results in <code>10.0.0.0/8</code>.
                                                Setting up IPv6 ranges is exactly similar to setting up IPv4 here and fully supported.
                                                Feel free to reach out to us on our
                                                <a href="https://discourse.pi-hole.net" rel="noopener" target="_blank">Discourse forum</a>
                                                in case you need any assistance setting up local host name resolution for your particular system.</p>
                                            <p>You can also specify a local domain name (like <code>fritz.box</code>) to ensure queries to
                                                devices ending in your local domain name will not leave your network, however, this is optional.
                                                The local domain name must match the domain name specified
                                                in your DHCP server for this to work. You can likely find it within the DHCP settings.</p>
                                            <p>Enabling Conditional Forwarding will also forward all hostnames (i.e., non-FQDNs) to the router
                                                when "Never forward non-FQDNs" is <em>not</em> enabled.</p>
                                            <div class="form-group">
                                                <div>
                                                    <input type="checkbox" id="dns.revServer.active">
                                                    <label for="dns.revServer.active"><strong>Use Conditional Forwarding</strong></label>
                                                </div>
                                                <div class="input-group">
                                                    <table class="table table-bordered">
                                                        <thead>
                                                            <tr>
                                                                <th>Local network in <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing" target="_blank">CIDR notation</a></th>
                                                                <th>IP address of your DHCP server (router)</th>
                                                                <th>Local domain name (optional)</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>
                                                                    <input type="text" id="dns.revServer.cidr" placeholder="192.168.0.0/16" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off" value="">
                                                                </td>
                                                                <td>
                                                                    <input type="text" id="dns.revServer.target" placeholder="192.168.0.1" class="form-control" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off" value="">
                                                                </td>
                                                                <td>
                                                                    <input type="text" id="dns.revServer.domain" placeholder="local" class="form-control" data-mask autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off" value="">
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary pull-right">Save</button>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### DHCP ################################################################# -->
                <div id="dhcp" class="tab-pane fade<?php if ($tab === 'dhcp') { ?> in active<?php } ?>">
                    <div class="row">
                        <!-- DHCP Settings Box -->
                        <div class="col-md-6">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">DHCP Settings</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div><input type="checkbox" id="dhcp.active"><label for="dhcp.active"><strong>DHCP server enabled</strong></label></div><br>
                                            <p id="dhcpnotice" lookatme-text="Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!">Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!</p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-xs-12">
                                            <label>Range of IP addresses to hand out</label>
                                        </div>
                                        <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                            <div class="form-group">
                                                <div class="input-group">
                                                    <div class="input-group-addon">From</div>
                                                    <input type="text" class="form-control DHCPgroup" id="dhcp.start"
                                                        autocomplete="off" spellcheck="false" autocapitalize="none"
                                                        autocorrect="off" value="">
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                            <div class="form-group">
                                                <div class="input-group">
                                                    <div class="input-group-addon">To</div>
                                                    <input type="text" class="form-control DHCPgroup" id="dhcp.end"
                                                        autocomplete="off" spellcheck="false" autocapitalize="none"
                                                        autocorrect="off" value="">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                                            <label>Router (gateway) IP address</label>
                                            <div class="form-group">
                                                <div class="input-group">
                                                    <div class="input-group-addon">Router</div>
                                                    <input type="text" class="form-control DHCPgroup" id="dhcp.router"
                                                        autocomplete="off" spellcheck="false" autocapitalize="none"
                                                        autocorrect="off" value="">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Advanced DHCP Settings Box -->
                        <div class="col-md-6">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Advanced DHCP settings</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <label>Pi-hole domain name</label>
                                            <div class="form-group">
                                                <div class="input-group">
                                                    <div class="input-group-addon">Domain</div>
                                                    <input type="text" class="form-control DHCPgroup" id="dns.domain"
                                                        value="">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12">
                                            <label>DHCP lease time</label>
                                            <div class="form-group">
                                                <div class="input-group">
                                                    <div class="input-group-addon">Lease time</div>
                                                    <input type="text" class="form-control DHCPgroup"
                                                        autocomplete="off" spellcheck="false" autocapitalize="none"
                                                        autocorrect="off" id="dhcp.leaseTime" value="">
                                                </div>
                                            </div>
                                            <p>The lease time can be in seconds, or minutes (e.g., "45m") or hours (e.g., "1h") or days (like "2d") or even weeks ("1w"). You may also use "infinite" as string but be aware of the drawbacks (assigned addresses are will only be made available again after the lease time has passed).</p>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12">
                                            <div><input type="checkbox" id="dhcp.rapidCommit" class="DHCPgroup">&nbsp;<label for="dhcp.rapidCommit"><strong>Enable DHCPv4 rapid commit (fast address assignment)</strong></label></div>
                                            <div><input type="checkbox" id="dhcp.ipv6" class="DHCPgroup">&nbsp;<label for="dhcp.ipv6"><strong>Enable IPv6 support (SLAAC + RA)</strong></label></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- DHCP Leases Box -->
                    <div class="row">
                        <div class="col-md-12">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Currently active DHCP leases</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <table id="DHCPLeasesTable" class="table table-striped table-bordered nowrap" width="100%">
                                                <thead>
                                                    <tr>
                                                        <td></td>
                                                        <th>IP address</th>
                                                        <th>Hostname</th>
                                                        <th>MAC address</th>
                                                        <th>Expiration</th>
                                                        <th>Client ID</th>
                                                        <td></td>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-12">
                            <div class="box box-warning">
                                <div class="box-header with-border">
                                    <h3 class="box-title">Static DHCP leases configuration</h3>
                                </div>
                                <div class="box-body">
                                    <div class="row">
                                        <div class="col-md-12">
                                            <table id="DHCPStaticLeasesTable" class="table table-striped table-bordered nowrap" width="100%">
                                                <thead>
                                                <tr>
                                                    <th>MAC address</th>
                                                    <th>IP address</th>
                                                    <th>Hostname</th>
                                                    <td></td>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                    <?php foreach ($dhcp_static_leases as $lease) { ?>
                                                    <tr>
                                                        <td><?php echo $lease['hwaddr']; ?></td>
                                                        <td data-order="<?php echo bin2hex(inet_pton($lease['IP'])); ?>"><?php echo $lease['IP']; ?></td>
                                                        <td><?php echo htmlentities($lease['host']); ?></td>
                                                        <td><?php if (strlen($lease['hwaddr']) > 0) { ?>
                                                            <button type="submit" class="btn btn-danger btn-xs" name="removestatic"
                                                                    value="<?php echo $lease['hwaddr']; ?>">
                                                                <span class="far fa-trash-alt"></span>
                                                            </button>
                                                            <?php } ?>
                                                        </td>
                                                    </tr>
                                                    <?php } ?>
                                                </tbody>
                                                <tfoot style="display: table-row-group">
                                                    <tr>
                                                        <td><input type="text" class="form-group" name="AddMAC" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                        <td><input type="text" class="form-group" name="AddIP" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                        <td><input type="text" class="form-group" name="AddHostname" value="" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off"></td>
                                                        <td>
                                                            <button type="submit" class="btn btn-success btn-xs" name="addstatic">
                                                                <span class="fas fa-plus"></span>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                            <p>Specifying the MAC address is mandatory and only one entry per MAC
                                                address is allowed. If the IP address is omitted and a host name is
                                                given, the IP address will still be generated dynamically and the
                                                specified host name will be used. If the host name is omitted, only
                                                a static lease will be added.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <input type="hidden" name="field" value="DHCP">
                            <input type="hidden" name="token" value="<?php echo $token; ?>">
                            <button type="submit" class="btn btn-primary pull-right">Save</button>
                        </div>
                    </div>
                </div>
                <!-- ######################################################### API ################################################################## -->
                <div id="api" class="tab-pane fade<?php if ($tab === 'api') { ?> in active<?php } ?>">
                </div>
                <!-- ######################################################### Privacy ############################################################## -->
                <div id="privacy" class="tab-pane fade<?php if ($tab === 'privacy') { ?> in active<?php } ?>">
                </div>
                <!-- ######################################################### Advanced ############################################################# -->
                <div id="advanced" class="tab-pane fade<?php if ($tab === 'advanced') { ?> in active<?php } ?>">
                <div class="row" id="advanced-content">
                    <!-- dynamically filled with content -->
                    <div class="overlay" id="advanced-overlay">
                        <i class="fa fa-sync fa-spin"></i>
                    </div>
                </div>
                </div>
                <!-- ######################################################### Teleporter ########################################################### -->
                <div id="teleporter" class="tab-pane fade<?php if ($tab === 'teleporter') { ?> in active<?php } ?>">
                </div>
            </div>
        </div>
    </div>
</div>

<script src="<?php echo fileversion('scripts/pi-hole/js/ip-address-sorting.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/vendor/jquery.confirm.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings-system.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings-dns.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings-dhcp.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings-advanced.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
