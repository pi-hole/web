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
PageTitle = "System Settings"
mg.include('scripts/pi-hole/lua/settings_header.lp','r')
?>
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
                                    <th scope="row">RAM:</th>
                                    <td><span id="sysinfo-memory-ram"></span> <span id="sysinfo-ram-ftl"></span</td>
                                </tr>
                                <tr>
                                    <th scope="row">Swap:</th>
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
                                <tr>
                                    <th scope="row">FTL:</th>
                                    <td>PID <span id="sysinfo-pid-ftl">?</span>, last restart was on <span id="sysinfo-uptime-ftl"></span></td>
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
        <div class="box settings-level-expert">
            <div class="box-header with-border">
                <h3 class="box-title">DHCP server metrics</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <table class="table table-striped table-bordered nowrap">
                            <tbody>
                                <tr title="Client broadcast to locate available servers">
                                    <th scope="row">
                                        <span>DHCPDISCOVER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-discover">&nbsp;</td>
                                </tr>
                                <tr title="Server to client in response to DHCPDISCOVER with offer of configuration parameters">
                                    <th scope="row">
                                        <span>DHCPOFFER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-offer">&nbsp;</td>
                                </tr>
                                <tr title="Client message to servers either &#010;  (a) requesting offered parameters from one server and implicitly declining offers from all others, &#010;  (b) confirming correctness of previously allocated address after, e.g., system reboot, or &#010;  (c) extending the lease on a particular network address">
                                    <th scope="row">
                                        <span>DHCPREQUEST:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-request">&nbsp;</td>
                                </tr>
                                <tr title="Server to client with configuration parameters, including committed network address">
                                    <th scope="row">
                                        <span>DHCPACK:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-ack">&nbsp;</td>
                                </tr>
                                <tr title="Server to client indicating client's notion of network address is incorrect (e.g., client has moved to new subnet) or client's lease as expired">
                                    <th scope="row">
                                        <span>DHCPNAK:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-nak">&nbsp;</td>
                                </tr>
                                <tr title="Client to server indicating network address is already in use">
                                    <th scope="row">
                                        <span>DHCPDECLINE:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-decline">&nbsp;</td>
                                </tr>
                                <tr title="Client to server, asking only for local configuration parameters; client already has externally configured network address">
                                    <th scope="row">
                                        <span>DHCPINFORM:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-inform">&nbsp;</td>
                                </tr>
                                <tr title="Client to server relinquishing network address and cancelling remaining lease">
                                    <th scope="row">
                                        <span>DHCPRELEASE:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-release">&nbsp;</td>
                                </tr>
                                <tr title="Could not provide an answer, e.g., because there are no leases left, the client wants to renew a lease that is outside of our range, or the explicitly requested address is already in use">
                                    <th scope="row">
                                        <span>DHCPNOANSWER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-noanswer">&nbsp;</td>
                                </tr>
                                <tr title="Processed BOOTP packets">
                                    <th scope="row">
                                        <span>BOOTP:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-bootp">&nbsp;</td>
                                </tr>
                                <tr title="Processed PXE packets">
                                    <th scope="row">
                                        <span>PXE:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-pxe">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>Allocated / pruned IPv4 leases:</span>
                                    </th>
                                    <td><span id="sysinfo-dhcp-leases-allocated_4">&nbsp;</span> /
                                        <span id="sysinfo-dhcp-leases-pruned_4">&nbsp;</span>
                                    </td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>Allocated / pruned IPv6 leases:</span>
                                    </th>
                                    <td><span id="sysinfo-dhcp-leases-allocated_6">&nbsp;</span> /
                                        <span id="sysinfo-dhcp-leases-pruned_6">&nbsp;</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="overlay" id="sysinfo-metrics-overlay-3">
                <i class="fa fa-sync fa-spin"></i>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="box settings-level-expert" id="cache-metrics">
            <div class="box-header with-border">
                <h3 class="box-title">DNS cache metrics</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <table class="table table-striped table-bordered nowrap">
                            <tbody>
                                <tr title="Total size of the DNS cache">
                                    <th scope="row">
                                        <span>DNS cache size:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-size">&nbsp;</td>
                                </tr>
                                <tr title="Share of the allocated cache that is currently in use (this includes stale/expired entries). If the percentage value is very low, it is advisable to reduce the DNS cache size to optimize performance">
                                    <th scope="row">
                                        <span>Active cache records:</span>
                                    </th>
                                    <td id="cache-utilization">&nbsp;</td>
                                </tr>
                                <tr title="Number of cache insertions, this number will grow continuously as expiring records naturally make space for new records">
                                    <th scope="row">
                                        <span>Total cache insertions:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-inserted">&nbsp;</td>
                                </tr>
                                <tr title="Number of cache entries that had to be removed although they are not expired. When this number if larger than zero, you should consider increasing your total cache size" lookatme-text="DNS cache evictions:">
                                    <th scope="row">
                                        <span>DNS cache evictions:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-evicted">&nbsp;</td>
                                </tr>
                                <tr title="Number of expired cache entries (they can still be used by the cache optimizer). These entries will only be freed when space is really needed (for efficiency reasons)">
                                    <th scope="row">
                                        <span>Expired DNS cache entries:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-expired">&nbsp;</td>
                                </tr>
                                <tr title="Number of immortal cache entries that will never expire (e.g. from /etc/hosts or local configuration)">
                                    <th scope="row">
                                        <span>Immortal DNS cache entries:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-immortal">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
<!--                    <table class="table table-striped table-bordered nowrap settings-level-expert">
                            <tbody id="dns-cache-table">
                            </tbody>
                        </table> -->
                    </div>
                    <div class="col-lg-12">
                        See also our <a href="https://docs.pi-hole.net/ftldns/dns-cache/" rel="noopener" target="_blank">DNS cache documentation</a>.<br>&nbsp;
                    </div>
                    <div class="col-lg-12" id="cache-metrics-chart">
                        <div style="width:50%">
                            <canvas id="cachePieChart" width="280" height="280"></canvas>
                        </div>
                        <div class="chart-legend" style="width:50%" id="cache-legend" ></div>
                    </div>
                </div>
            </div>
            <div class="overlay" id="sysinfo-metrics-overlay-1">
                <i class="fa fa-sync fa-spin"></i>
            </div>
        </div>
        <div class="box">
            <div class="box-header with-border">
                <h3 class="box-title">DNS reply metrics</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <table class="table table-striped table-bordered nowrap">
                            <tbody>
                                <tr>
                                    <th scope="row">
                                        <span>Local/cache replies:</span>
                                    </th>
                                    <td id="sysinfo-dns-replies-local">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        Forwarded queries:
                                    </th>
                                    <td id="sysinfo-dns-replies-forwarded">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>Cache optimizer replies:</span>
                                    </th>
                                    <td id="sysinfo-dns-replies-optimized">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        Unanswered queries:
                                    </th>
                                    <td id="sysinfo-dns-replies-unanswered">&nbsp;</td>
                                </tr>
                                <tr class="settings-level-expert">
                                    <th scope="row">
                                        <span>Authoritative replies:</span>
                                    </th>
                                    <td id="sysinfo-dns-replies-auth">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <div class="overlay" id="sysinfo-metrics-overlay-2">
                <i class="fa fa-sync fa-spin"></i>
            </div>
        </div>
    </div>
    <div class="col-md-12 settings-level-expert">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Actions<span id="actions-title"></span></h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-xs-12 col-md-6 col-lg-3">
                        <button type="button" id="loggingButton" class="btn btn-block button-pad btn-primary"><i class="fa fa-spinner fa-pulse"></i></button>
                    </div>
                    <div class="col-xs-12 col-md-6 col-lg-3">
                        <button type="button" class="btn btn-warning confirm-restartdns btn-block button-pad destructive_action" disabled="true">Restart DNS resolver</button>
                    </div>
                    <div class="col-xs-12 col-md-6 col-lg-3">
                        <button type="button" class="btn btn-danger confirm-flusharp btn-block button-pad destructive_action" disabled="true">Flush network table</button>
                    </div>
                    <div class="col-xs-12 col-md-6 col-lg-3 settings-level-expert">
                        <button type="button" class="btn btn-danger confirm-flushlogs btn-block button-pad destructive_action" disabled="true">Flush logs (last 24 hours)</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/bootstrap-toggle.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/vendor/jquery.confirm.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/charts.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-system.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
