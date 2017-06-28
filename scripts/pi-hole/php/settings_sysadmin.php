<?php

    // Ensure this script can only be included from settings.php
    if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
    {
        die("Direct access to this script is forbidden!");
    }

?>
        <div class="box box-danger">
            <div class="box-header with-border">
                <h3 class="box-title">System Administration</h3>
            </div>
            <div class="box-body">
                <button type="button" class="btn btn-default confirm-reboot">Restart system</button>
                <button type="button" class="btn btn-default confirm-restartdns">Restart DNS server</button>
                <button type="button" class="btn btn-default confirm-flushlogs">Flush logs</button>

                <form role="form" method="post" id="rebootform">
                    <input type="hidden" name="field" value="reboot">
                    <input type="hidden" name="token" value="<?php echo $token ?>">
                </form>
                <form role="form" method="post" id="restartdnsform">
                    <input type="hidden" name="field" value="restartdns">
                    <input type="hidden" name="token" value="<?php echo $token ?>">
                </form>
                <form role="form" method="post" id="flushlogsform">
                    <input type="hidden" name="field" value="flushlogs">
                    <input type="hidden" name="token" value="<?php echo $token ?>">
                </form>
            </div>
        </div>
