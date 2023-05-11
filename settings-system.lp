<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
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
        <div class="box settings-level-2">
            <div class="box-header with-border">
                <h3 class="box-title">DHCP server metrics</h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-lg-12">
                        <table class="table table-striped table-bordered nowrap">
                            <tbody>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPDISCOVER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-discover">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPOFFER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-offer">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPREQUEST:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-request">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPACK:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-ack">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPNAK:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-nak">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPDECLINE:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-decline">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPINFORM:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-inform">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPRELEASE:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-release">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>DHCPNOANSWER:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-noanswer">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span>BOOTP:</span>
                                    </th>
                                    <td id="sysinfo-dhcp-bootp">&nbsp;</td>
                                </tr>
                                <tr>
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
        <div class="box settings-level-1" id="cache-metrics">
            <div class="box-header with-border">
                <h3 class="box-title">DNS cache metrics</h3>
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
                                    <td id="sysinfo-dns-cache-size">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span title="Number of cache insertions">DNS cache insertions:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-inserted">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        <span title="Number of cache entries that had to be removed although they are not expired (increase cache size to reduce this number)" lookatme-text="DNS cache evictions:">DNS cache evictions:</span>
                                    </th>
                                    <td id="sysinfo-dns-cache-evicted">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        DNS cache expiries:
                                    </th>
                                    <td id="sysinfo-dns-cache-expired">&nbsp;</td>
                                </tr>
                                <tr>
                                    <th scope="row">
                                        Immortal DNS cache entries:
                                    </th>
                                    <td id="sysinfo-dns-cache-immortal">&nbsp;</td>
                                </tr>
                            </tbody>
                        </table>
<!--                    <table class="table table-striped table-bordered nowrap settings-level-2">
                            <tbody id="dns-cache-table">
                            </tbody>
                        </table> -->
                    </div>
                    <div class="col-lg-12">
                        <div style="width:50%">
                            <canvas id="cachePieChart" width="280" height="280"></canvas>
                        </div>
                        <div class="chart-legend" style="width:50%" id="cache-legend" ></div>
                            <!-- /.box-body -->
                        See also our <a href="https://docs.pi-hole.net/ftldns/dns-cache/" rel="noopener" target="_blank">DNS cache documentation</a>.
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
                                <tr class="settings-level-2">
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
    <div class="col-md-12 settings-level-1">
        <div class="box box-warning">
            <div class="box-header with-border">
                <h3 class="box-title">Actions&nbsp;&nbsp;<i class="fas fa-wrench" title="This is an advanced-level setting"></i></h3>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-4">
                            <button type="button" id="disableLoggingButton" class="btn btn-warning confirm-disablelogging-noflush btn-block" style="display: none">Disable query logging</button>
                            <button type="button" id="enableLoggingButton" class="btn btn-success btn-block" style="display: none">Enable query logging</button>
                    </div>
                    <p class="hidden-md hidden-lg"></p>
                    <div class="col-md-4">
                        <button type="button" class="btn btn-warning confirm-flusharp btn-block">Flush network table</button>
                    </div>
                    <p class="hidden-md hidden-lg"></p>
                    <div class="col-md-4">
                        <button type="button" class="btn btn-warning confirm-restartdns btn-block">Restart DNS resolver</button>
                    </div>
                    <div class="col-md-4 settings-level-2">
                        <button type="button" class="btn btn-danger confirm-flushlogs btn-block">Flush logs (last 24 hours)</button>
                    </div>
                    <p class="hidden-md hidden-lg"></p>
                    <div class="col-md-4 settings-level-2">
                        <button type="button" class="btn btn-danger confirm-poweroff btn-block">Power off system</button>
                    </div>
                    <p class="hidden-md hidden-lg"></p>
                    <div class="col-md-4 settings-level-2">
                        <button type="button" class="btn btn-danger confirm-reboot btn-block">Restart system</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<script src="<?=pihole.fileversion('scripts/vendor/jquery.confirm.min.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/charts.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings-system.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/settings.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
