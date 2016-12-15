        </section>
        <!-- /.content -->
    </div>
    <!-- /.content-wrapper -->
    <footer class="main-footer row">
        <i class="fa fa-github"></i> <strong><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3J2L3Z4DHW9UY">Donate</a></strong> if you found this useful.
        <div class="pull-right hidden-xs">
            <?php
            // Check if on a dev branch
            $piholeBranch = exec("cd /etc/.pihole/ && git rev-parse --abbrev-ref HEAD");
            $webBranch = exec("git rev-parse --abbrev-ref HEAD");

            // Use vDev if not on master
            if($piholeBranch !== "master") {
                $piholeVersion = "vDev";
                $piholeCommit = exec("cd /etc/.pihole/ && git describe --long --dirty --tags");
            }
            else {
                $piholeVersion = exec("cd /etc/.pihole/ && git describe --tags --abbrev=0");
            }

            if($webBranch !== "master") {
                $webVersion = "vDev";
                $webCommit = exec("git describe --long --dirty --tags");
            }
            else {
                $webVersion = exec("git describe --tags --abbrev=0");
            }
            ?>
            <b>Pi-hole Version </b> <span id="piholeVersion"><?php echo $piholeVersion; ?></span><?php if(isset($piholeCommit)) { echo " (".$piholeBranch.", ".$piholeCommit.")"; } ?>
            <?php if($piholeBranch !== "master" || $webBranch !== "master") { ?><br/><?php } ?>
            <b>Web Interface Version </b> <span id="webVersion"><?php echo $webVersion; ?></span><?php if(isset($webCommit)) { echo " (".$webBranch.", ".$webCommit.")"; } ?>
        </div>
    </footer>
</div>
<!-- ./wrapper -->
<script src="js/other/jquery.min.js"></script>
<script src="js/other/jquery-ui.min.js"></script>
<script src="bootstrap/js/bootstrap.min.js"></script>
<script src="js/other/app.min.js"></script>

<script src="js/other/jquery.dataTables.min.js"></script>
<script src="js/other/dataTables.bootstrap.min.js"></script>
<script src="js/other/Chart.bundle.min.js"></script>

<script src="js/pihole/footer.js"></script>

</body>
</html>
