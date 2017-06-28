<?php

    // Ensure this script can only be included from settings.php
    if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
    {
        die("Direct access to this script is forbidden!");
    }

    // Query logging
    if(isset($setupVars["QUERY_LOGGING"]))
    {
        if($setupVars["QUERY_LOGGING"] == 1)
        {
            $piHoleLogging = true;
        }
        else
        {
            $piHoleLogging = false;
        }
    } else {
        $piHoleLogging = true;
    }
?>
        <div class="box box-primary">
            <div class="box-header with-border">
                <h3 class="box-title">Query Logging<?php if($piHoleLogging) { ?> (size of log <?php echo formatSizeUnits(filesize("/var/log/pihole.log")); ?>)<?php } ?></h3>
            </div>
            <div class="box-body">
                <p>Current status:
                <?php if($piHoleLogging) { ?>
                    Enabled (recommended)
                <?php }else{ ?>
                    Disabled
                <?php } ?></p>
                <?php if($piHoleLogging) { ?>
                    <p>Note that disabling will render graphs on the web user interface useless</p>
                <?php } ?>
            </div>
            <div class="box-footer">
                <form role="form" method="post">
                <button type="button" class="btn btn-default confirm-flushlogs">Flush logs</button>
                <input type="hidden" name="field" value="Logging">
                <input type="hidden" name="token" value="<?php echo $token ?>">
                <?php if($piHoleLogging) { ?>
                    <input type="hidden" name="action" value="Disable">
                    <button type="submit" class="btn btn-primary pull-right">Disable query logging</button>
                <?php } else { ?>
                    <input type="hidden" name="action" value="Enable">
                    <button type="submit" class="btn btn-primary pull-right">Enable query logging</button>
                <?php } ?>
                </form>
            </div>
        </div>
