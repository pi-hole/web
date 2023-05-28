<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
* ]]--
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

    <footer class="main-footer">
        <div class="row row-centered text-center">
            <div class="col-xs-12 col-sm-6">
                <strong><a href="https://pi-hole.net/donate/" rel="noopener" target="_blank"><i class="fa fa-heart text-red"></i> Donate</a></strong> if you found this useful.
            </div>
        </div>

        <div class="row row-centered text-center version-info">
            <div class="col-xs-12 col-sm-12 col-md-10">
                <ul class="list-inline" id="versions"></ul>
                <p style="margin: 15px 0 0;" id="update-hint"></p>
            </div>
        </div>
    </footer>

</div>
<!-- ./wrapper -->
<script src="<?=pihole.fileversion('scripts/pi-hole/js/footer.js')?>"></script>

<div id="advanced-info-data" style="display: none;" data-starttime="<?=starttime?>" data-endtime="<?=mg.time(true)?>" data-client-ip="<?=mg.request_info.remote_addr?>" data-tls="<?=tostring(is_secure)?>"></div>
</body>
</html>
