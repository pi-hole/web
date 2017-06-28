<?php

    // Ensure this script can only be included from settings.php
    if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
    {
        die("Direct access to this script is forbidden!");
    }

    // CPU temperature unit
    if(isset($setupVars["TEMPERATUREUNIT"]))
    {
        $temperatureunit = $setupVars["TEMPERATUREUNIT"];
    }
    else
    {
        $temperatureunit = "C";
    }
    // Use $boxedlayout value determined in header.php
?>
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">Web User Interface</h3>
            </div>
            <form role="form" method="post">
            <div class="box-body">
<?php /*
                <h4>Query Log Page</h4>
                <div class="col-lg-6">
                    <div class="form-group">
                        <label>Default value for <em>Show XX entries</em></label>
                        <select class="form-control" disabled>
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                            <option>100</option>
                            <option>All</option>
                        </select>
                    </div>
                </div>
*/ ?>
                <h4>Interface appearance</h4>
                <div class="form-group">
                    <div class="checkbox"><label><input type="checkbox" name="boxedlayout" value="yes" <?php if($boxedlayout){ ?>checked<?php } ?> >Use boxed layout (helpful when working on large screens)</label></div>
                </div>
                <h4>CPU Temperature Unit</h4>
                <div class="form-group">
                    <div class="radio"><label><input type="radio" name="tempunit" value="C" <?php if($temperatureunit === "C"){ ?>checked<?php } ?> >Celsius</label></div>
                    <div class="radio"><label><input type="radio" name="tempunit" value="K" <?php if($temperatureunit === "K"){ ?>checked<?php } ?> >Kelvin</label></div>
                    <div class="radio"><label><input type="radio" name="tempunit" value="F" <?php if($temperatureunit === "F"){ ?>checked<?php } ?> >Fahrenheit</label></div>
                </div>
            </div>
            <div class="box-footer">
                <input type="hidden" name="field" value="webUI">
                <input type="hidden" name="token" value="<?php echo $token ?>">
                <button type="submit" class="btn btn-primary pull-right">Save</button>
            </div>
            </form>
        </div>
