<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')

-- Page title and level selector
PageTitle = "DHCP Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
<div class="row">
    <!-- DHCP Settings Box -->
    <div class="col-md-6 settings-level-basic">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title" data-configkeys="dhcp.active dhcp.start dhcp.end dhcp.router dhcp.ipv6">DHCP Settings</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <div>
                            <input type="checkbox" id="dhcp.active" data-key="dhcp.active"><label for="dhcp.active"><strong>DHCP server enabled</strong></label>
                            <p class="help-block" id="dhcpnotice" lookatme-text="Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!">Make sure your router's DHCP server is disabled when using the Pi-hole DHCP server!</p>
                        </div>
                    </div>
                    <div class="col-xs-12">
                        <label style="margin-top: 10px">Range of IP addresses to hand out</label>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon">Start</div>
                                <input type="text" class="form-control DHCPgroup" id="dhcp.start" data-key="dhcp.start"
                                    autocomplete="off" spellcheck="false" autocapitalize="none"
                                    autocorrect="off" value="">
                            </div>
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon">End</div>
                                <input type="text" class="form-control DHCPgroup" id="dhcp.end" data-key="dhcp.end"
                                    autocomplete="off" spellcheck="false" autocapitalize="none"
                                    autocorrect="off" value="">
                            </div>
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                        <label>Router (gateway) IP address</label>
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon">Router</div>
                                <input type="text" class="form-control DHCPgroup" id="dhcp.router" data-key="dhcp.router"
                                    autocomplete="off" spellcheck="false" autocapitalize="none"
                                    autocorrect="off" value="">
                            </div>
                        </div>
                    </div>
                    <div class="col-xs-12 col-sm-6 col-md-12 col-lg-6">
                        <label>Netmask</label>
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon">Netmask</div>
                                <input type="text" class="form-control DHCPgroup" id="dhcp.netmask" data-key="dhcp.netmask"
                                    autocomplete="off" spellcheck="false" autocapitalize="none"
                                    autocorrect="off" value="" placeholder="automatic">
                            </div>
                        </div>
                    </div>
                    <div class="col-md-12">
                        <p>Leave the netmask field empty to have Pi-hole infer it from the configured IP address of your device. If you want to specify a netmask, you can use the format <code>255.255.255.0</code>.</p>
                    </div>
                    <div class="col-md-12">
                        <div>
                            <input type="checkbox" id="dhcp.ipv6" data-key="dhcp.ipv6" class="DHCPgroup">&nbsp;<label for="dhcp.ipv6"><strong>Enable additional IPv6 support (SLAAC + RA)</strong></label>
                            <p class="help-block">Enable this option to enable IPv6 support for the Pi-hole DHCP server. This will allow the Pi-hole to hand out IPv6 addresses to clients and also provide IPv6 router advertisements (RA) to clients. This option is only useful if the Pi-hole is configured with an IPv6 address.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6 settings-level-expert">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title" data-configkeys="dhcp.leaseTime dhcp.rapidCommit dhcp.multiDNS">Advanced DHCP Settings</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-12">
                        <label>DHCP lease time</label>
                        <div class="form-group">
                            <div class="input-group">
                                <div class="input-group-addon">Lease time</div>
                                <input type="text" class="form-control DHCPgroup"
                                    autocomplete="off" spellcheck="false" autocapitalize="none"
                                    autocorrect="off" id="dhcp.leaseTime" data-key="dhcp.leaseTime" value="">
                            </div>
                        </div>
                        <p>The lease time can be in seconds, minutes (e.g., "45m"), hours (e.g., "1h"), days (like "2d"), or even weeks ("1w"). If no lease time is specified (empty), <code>dnsmasq</code>'s default lease time is one hour for IPv4 and one day for IPv6. You may also use "infinite" as string but be aware of the drawbacks: assigned addresses are will only be made available again after the lease time has passed or when leases are manually deleted below.</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-sm-12">
                        <div>
                            <input type="checkbox" id="dhcp.rapidCommit" data-key="dhcp.rapidCommit" class="DHCPgroup">&nbsp;<label for="dhcp.rapidCommit"><strong>Enable DHCPv4 rapid commit (fast address assignment)</strong></label>
                            <p class="help-block">The DHCPv4 rapid commit option allows the Pi-hole DHCP server to assign an IP address to a client right away. This can notably speed up the address assignment process and you will notice, e.g., faster WiFi joins in your network. This option should only be enabled if the Pi-hole DHCP server is the only DHCP server in your network.</p>
                        </div>
                    </div>
                    <div class="col-sm-12">
                        <div>
                            <input type="checkbox" id="dhcp.multiDNS" data-key="dhcp.multiDNS" class="DHCPgroup">&nbsp;<label for="dhcp.multiDNS"><strong>Advertise DNS server multiple times</strong></label>
                            <p class="help-block">Advertise DNS server multiple times to clients. Some devices will add their own proprietary DNS servers to the list of DNS servers, which can cause issues with Pi-hole. This option will advertise the Pi-hole DNS server multiple times to clients, which should prevent this from happening.</p>
                        </div>
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
    <div class="col-md-12 settings-level-expert">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title" data-configkeys="dhcp.hosts">Static DHCP configuration</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-xs-12 col-md-6">
                        <p>Specify per host parameters for the DHCP server. This allows a machine with a particular hardware address to be always allocated the same hostname, IP address and lease time. A hostname specified like this overrides any supplied by the DHCP client on the machine. It is also allowable to omit the hardware address and include the hostname, in which case the IP address and lease times will apply to any machine claiming that name.</p>
                        <textarea class="form-control field-sizing-content" id="dhcp-hosts" data-key="dhcp.hosts" style="resize: vertical;"></textarea><br>&nbsp;
                        <p>Each entry should be on a separate line, and should be of the form:</p>
                        <pre>[&lt;hwaddr&gt;][,id:&lt;client_id&gt;|*][,set:&lt;tag&gt;][,tag:&lt;tag&gt;][,&lt;ipaddr&gt;][,&lt;hostname&gt;][,&lt;lease_time&gt;][,ignore]</pre>
                        <p>Only one entry per MAC address is allowed.</p>
                    </div>
                    <div class="col-xs-12 col-md-6">
                        <p>Examples:
                            <ul>
                                <li><pre>00:20:e0:3b:13:af,192.168.0.123</pre> tells Pi-hole to give the machine with hardware address <code>00:20:e0:3b:13:af</code> the address <code>192.168.0.123</code><br>&nbsp;</li>
                                <li><pre>00:20:e0:3b:13:af,laptop</pre>tells Pi-hole to give the machine with hardware address <code>00:20:e0:3b:13:af</code> the name <code>laptop</code><br>&nbsp;</li>
                                <li><pre>00:20:e0:3b:13:af,192.168.0.123,laptop,infinite</pre> tells Pi-hole to give the machine with hardware address <code>00:20:e0:3b:13:af</code> the address <code>192.168.0.123</code>, the name <code>laptop</code>, and an infinite DHCP lease<br>&nbsp;</li>
                            </ul>
                        </p>
                    </div>
                    <div class="col-xs-12">
                        <div class="box box-success collapsed-box">
                            <div class="box-header with-border pointer no-user-select" data-widget="collapse">
                                <h3 class="box-title">Advanced description</h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool">
                                        <i class="fa fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="box-body">
                                <ul>
                                    <li> Addresses allocated like this are not constrained to be in the DHCP range specified above but they must be in the same subnet. For subnets which don't need a pool of dynamically allocated addresses, you can set a one-address range above and specify only static leases here.</li>
                                    <li> It is allowed to use client identifiers (called client DUID in IPv6-land) rather than hardware addresses to identify hosts by prefixing with <code>id:</code>. Thus lines like <code>id:01:02:03:04,.....</code> refer to the host with client identifier <code>01:02:03:04</code>. It is also allowed to specify the client ID as text, like this: <code>id:clientidastext,.....</code></li>
                                    <li> A single line may contain an IPv4 address or one or more IPv6 addresses, or both. IPv6 addresses must be bracketed by square brackets thus: <code>laptop,[1234::56]</code> IPv6 addresses may contain only the host-identifier part: <code>laptop,[::56]</code> in which case they act as wildcards in constructed DHCP ranges, with the appropriate network part inserted. For IPv6, an address may include a prefix length: <code>laptop,[1234:50/126]</code> which (in this case) specifies four addresses, <code>1234::50</code> to <code>1234::53</code>. This (an the ability to specify multiple addresses) is useful when a host presents either a consistent name or hardware-ID, but varying DUIDs, since it allows dnsmasq to honour the static address allocation but assign a different address for each DUID. This typically occurs when chain netbooting, as each stage of the chain gets in turn allocates an address.</li>
                                    <!--<li> Note that in IPv6 DHCP, the hardware address may not be available, though it normally is for direct-connected clients, or clients using DHCP relays which support RFC 6939.</li>-->
                                    <li> For DHCPv4, the special option <code>id:*</code> means "ignore any client-id and use MAC addresses only." This is useful when a client presents a client-id sometimes but not others.</li>
                                    <li> If a name appears in <code>/etc/hosts</code>, the associated address can be allocated to a DHCP lease, but only if a separate line specifying the name also exists. Only one hostname can be given per line, but aliases are possible by using CNAMEs. Note that <code>/etc/hosts</code> is NOT used when the DNS server side of dnsmasq is disabled by setting the DNS server port to zero.</li>
                                    <li> More than one line can be associated (by name, hardware address or UID) with a host. Which one is used (and therefore which address is allocated by DHCP and appears in the DNS) depends on the subnet on which the host last obtained a DHCP lease: the line with an address within the subnet is used. If more than one address is within the subnet, the result is undefined. <strong>A corollary to this is that the name associated with a host defined here does not appear in the DNS until the host obtains a DHCP lease.</strong></li>
                                    <li> The special keyword <code>ignore</code> tells Pi-hole to never offer a DHCP lease to a machine. The machine can be specified by hardware address, client ID or hostname, for instance <code>00:20:e0:3b:13:af,ignore</code>. This is useful when there is another DHCP server on the network which should be used by some machines.</li>
                                    <li> The <code>set:&lt;tag&gt;</code> construct sets the tag whenever this line is in use. This can be used to selectively send DHCP options just for this host. More than one tag can be set per line directive (but not in other places where "set:&lt;tag&gt;" is allowed). When a host matches any directive (or one implied by <code>/etc/ethers</code>) then the special tag "<code>known</code>"" is set. This allows Pi-hole to be configured to ignore requests from unknown machines using a custom config option <code>dhcp-ignore=tag:!known</code> in your own config file. If the host matches only a directive which cannot be used because it specifies an address on different subnet, the tag "<code>known-othernet</code>" is set.</li>
                                    <li> The <code>tag:&lt;tag&gt;</code> construct filters which directives are used; more than one can be provided, in this case the request must match all of them. Tagged directives are used in preference to untagged ones. Note that one of <code>&lt;hwaddr&gt</code>;, <code>&lt;client_id&gt</code>; or <code>&lt;hostname&gt</code>; still needs to be specified (can be a wildcard).</li>
                                    <li> Ethernet addresses (but not client-ids) may have wildcard bytes, so for example <code>00:20:e0:3b:13:*,ignore</code> will cause Pi-hole to ignore a range of hardware addresses.</li>
                                    <li> Hardware addresses normally match any network (ARP) type, but it is possible to restrict them to a single ARP type by preceding them with the ARP-type (in HEX) and "<code>-</code>". so the line <code>06-00:20:e0:3b:13:af,1.2.3.4</code> will only match a Token-Ring hardware address, since the ARP-address type for token ring is <code>6</code>.</li>
                                    <li> As a special case, in DHCPv4, it is possible to include more than one hardware address. eg: <code>11:22:33:44:55:66,12:34:56:78:90:12,192.168.0.2</code>. This allows an IP address to be associated with multiple hardware addresses, and gives Pi-hole permission to abandon a DHCP lease to one of the hardware addresses when another one asks for a lease. Beware that this is a dangerous thing to do, it will only work reliably if only one of the hardware addresses is active at any time and there is no way for dnsmasq to enforce this. It is, for instance, useful to allocate a stable IP address to a laptop which has both wired and wireless interfaces.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-12 settings-level-basic save-button-container">
        <button type="button" class="btn btn-primary save-button"><i class="fa-solid fa-fw fa-floppy-disk"></i>&nbsp;Save & Apply</button>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-dhcp.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/ip-address-sorting.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
