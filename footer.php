        </section>
        <!-- /.content -->
    </div>
    <!-- /.content-wrapper -->
    <footer class="main-footer">
        <div class="pull-right hidden-xs">
            <?php
            // Check if on a dev branch
            $piholeVersion = exec("cd /etc/.pihole/ && git rev-parse --abbrev-ref HEAD");
            $webVersion = exec("git rev-parse --abbrev-ref HEAD");

            // Use vDev if not on master
            if($piholeVersion !== "master")
                $piholeVersion = "vDev";
            else
                $piholeVersion = exec("cd /etc/.pihole/ && git describe --tags --abbrev=0");

            if($webVersion !== "master")
                $webVersion = "vDev";
            else
                $webVersion = exec("git describe --tags --abbrev=0");
            ?>
            <b>Pi-hole Version </b> <span id="piholeVersion"><?php echo $piholeVersion; ?></span>
            <b>Web Interface Version </b> <span id="webVersion"><?php echo $webVersion; ?></span>
        </div>
        <i class="fa fa-github"></i> <strong><a href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&amp;hosted_button_id=3J2L3Z4DHW9UY">Donate</a></strong> if you found this useful.
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
