<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/
?>

        </section>
        <!-- /.content -->
    </div>
    <!-- Modal for custom disable time -->
    <div class="modal fade" id="customDisableModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog modal-sm" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="myModalLabel">Custom disable timeout</h4>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input id="customTimeout" class="form-control" type="number" value="60">
                        <div class="input-group-btn" data-toggle="buttons">
                            <label class="btn btn-default">
                                <input id="selSec" type="radio"> Secs
                            </label>
                            <label id="btnMins" class="btn btn-default active">
                                <input id="selMin" type="radio"> Mins
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button type="button" id="pihole-disable-custom" class="btn btn-primary" data-dismiss="modal">Submit</button>
                </div>
            </div>
        </div>
    </div> <!-- /.content-wrapper -->

<?php
// Flushes the system write buffers of PHP. This attempts to push everything we have so far all the way to the client's browser.
flush();

// Run update checker
//  - determines local branch each time,
//  - determines local and remote version every 30 minutes
require 'scripts/pi-hole/php/update_checker.php';

if (isset($core_commit) || isset($web_commit) || isset($FTL_commit)) {
    $list_class = 'list-unstyled';
} else {
    $list_class = 'list-inline';
}
?>
    <footer class="main-footer">
        <div class="row row-centered text-center">
            <div class="col-xs-12 col-sm-6">
                <strong><a href="https://pi-hole.net/donate/" rel="noopener" target="_blank"><i class="fa fa-heart text-red"></i> Donate</a></strong> if you found this useful.
            </div>
        </div>

        <div class="row row-centered text-center version-info">
            <div class="col-xs-12 col-sm-12 col-md-10">
                <ul class="<?php echo $list_class; ?>">
                    <?php if ($dockerVersionStr) { ?>
                    <li>
                        <strong>Docker Tag</strong>
                        <?php echo $dockerVersionStr; ?>
                        <?php if ($docker_update) { ?> &middot; <a class="lookatme" lookatme-text="Update available!" href="<?php echo $dockerUrl.'/latest'; ?>" rel="noopener" target="_blank">Update available!</a><?php } ?>
                    </li>
                    <?php } ?>
                    <li>
                        <strong>Pi-hole</strong>
                        <?php echo $coreVersionStr; ?>
                        <?php if ($core_update) { ?> &middot; <a class="lookatme" lookatme-text="Update available!" href="<?php echo $coreUrl.'/latest'; ?>" rel="noopener" target="_blank">Update available!</a><?php } ?>
                    </li>
                    <li>
                        <strong>FTL</strong>
                        <?php echo $ftlVersionStr; ?>
                        <?php if ($FTL_update) { ?> &middot; <a class="lookatme" lookatme-text="Update available!" href="<?php echo $ftlUrl.'/latest'; ?>" rel="noopener" target="_blank">Update available!</a><?php } ?>
                    </li>
                    <li>
                        <strong>Web Interface</strong>
                        <?php echo $webVersionStr; ?>
                        <?php if ($web_update) { ?> &middot; <a class="lookatme" lookatme-text="Update available!" href="<?php echo $webUrl.'/latest'; ?>" rel="noopener" target="_blank">Update available!</a><?php } ?>
                    </li>
                </ul>

                <p style="margin: 15px 0 0;">
                    <?php if ($docker_update) { ?>
                        To install updates, <a href="https://github.com/pi-hole/docker-pi-hole#upgrading-persistence-and-customizations" rel="noopener" target="_blank">replace this old container with a fresh upgraded image</a>.
                    <?php } elseif ($core_update || $web_update || $FTL_update) { ?>
                        To install updates, run <code><a href="https://docs.pi-hole.net/main/update/" rel="noopener" target="_blank">pihole -up</a></code>.
                    <?php } ?>
                </p>
            </div>
        </div>
    </footer>

</div>
<!-- ./wrapper -->
<script src="<?php echo fileversion('scripts/pi-hole/js/footer.js'); ?>"></script>
</body>
</html>
