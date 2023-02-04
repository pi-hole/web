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

if (isset($_GET['tab']) && in_array($_GET['tab'], array('sysadmin', 'dns', 'piholedhcp', 'api', 'privacy', 'teleporter'))) {
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
            </div>
        </div>
    </div>
</div>

<script src="<?php echo fileversion('scripts/vendor/jquery.confirm.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/settings.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
