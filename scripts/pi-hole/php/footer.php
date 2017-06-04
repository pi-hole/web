<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */ ?>

        </section>
        <!-- /.content -->
    </div>
    <!-- Modal for custom disable time -->
    <div class="modal fade" id="customDisableModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                    <h4 class="modal-title" id="myModalLabel">Custom disable timeout</h4>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-sm-3"><input id="customTimeout" class="form-control" type="number" value="60"></div>
                        <div class="col-sm-9">
                            <div class="btn-group" data-toggle="buttons">
                                <label class="btn btn-default">
                                    <input type="radio"/> Secs
                                </label>
                                <label id="btnMins" class="btn btn-default active">
                                    <input type="radio"  /> Mins
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
                    <button  id="pihole-disable-custom" type="button" class="btn btn-primary" data-dismiss="modal">Submit</button>
                </div>
            </div>
        </div>
    </div>
    <!-- /.content-wrapper -->
    <footer class="main-footer">
	<!-- Version Infos -->
        <div class="pull-right hidden-xs hidden-sm<?php if(isset($core_commit) || isset($web_commit)) { ?> hidden-md<?php } ?>">
            <b>Pi-hole Version </b> <?php
            echo $core_current;
            if(isset($core_commit)) { echo " (".$core_branch.", ".$core_commit.")"; }
            if($core_update){ ?> <a class="alert-link lookatme" href="https://github.com/pi-hole/pi-hole/releases" target="_blank">(Update available!)</a><?php } ?>
            <b>Web Interface Version </b><?php
            echo $web_current;
            if(isset($web_commit)) { echo " (".$web_branch.", ".$web_commit.")"; }
            if($web_update){ ?> <a class="alert-link lookatme" href="https://github.com/pi-hole/AdminLTE/releases" target="_blank">(Update available!)</a><?php } ?>
            <b>FTL Version </b> <?php
            echo $FTL_current;
            if($FTL_update){ ?> <a class="alert-link lookatme" href="https://github.com/pi-hole/FTL/releases" target="_blank">(Update available!)</a><?php } ?>
        </div>
        <div style="display: inline-block"><a href="https://github.com/pi-hole" target="_blank"><i class="fa fa-github"></i></a> <strong><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3J2L3Z4DHW9UY" target="_blank">Donate</a></strong> if you found this useful.</div>
    </footer>
</div>
<!-- ./wrapper -->
<script src="scripts/vendor/jquery.min.js"></script>
<script src="scripts/vendor/jquery-ui.min.js"></script>
<script src="style/vendor/bootstrap/js/bootstrap.min.js"></script>
<script src="scripts/vendor/app.min.js"></script>

<script src="scripts/vendor/jquery.dataTables.min.js"></script>
<script src="scripts/vendor/dataTables.bootstrap.min.js"></script>
<script src="scripts/vendor/Chart.bundle.min.js"></script>

<script src="scripts/pi-hole/js/footer.js"></script>

</body>
</html>
