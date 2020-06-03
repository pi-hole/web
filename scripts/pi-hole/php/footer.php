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
                                    <input type="radio"> Secs
                                </label>
                                <label id="btnMins" class="btn btn-default active">
                                    <input type="radio"> Mins
                                </label>
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
<?php
  // Flushes the system write buffers of PHP. This attempts to push everything we have so far all the way to the client's browser.
  flush();
  // Run update checker
  //  - determines local branch each time,
  //  - determines local and remote version every 30 minutes
  require "scripts/pi-hole/php/update_checker.php";
?>
    <!-- /.content-wrapper -->
    <footer class="main-footer">
      <!-- Version Infos -->
      <div class="row">
        <div class="col-12">
          <div class="footer-content">
            <p class="m-0 py-5">Copyrighted&#169; Lazarus Network Firewall 2020 &nbsp;</p>
          </div>
        </div>
      </div>
    </footer>
</div>
<!-- ./wrapper -->
<script src="scripts/pi-hole/js/footer.js"></script>
</body>
</html>
