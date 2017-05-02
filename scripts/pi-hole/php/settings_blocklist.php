        <div class="box box-danger <?php if ($collapse) { ?>collapsed-box<?php } ?>">
            <div class="box-header with-border">
                <h3 class="box-title">Pi-Hole's Block Lists</h3>
                <?php if ($collapse) { ?>
                <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
                <?php } ?>
            </div>
            <form role="form" method="post">
                <div class="box-body">
                    <div class="col-lg-12">
                        <label>Lists used to generate Pi-hole's Gravity</label>
                        <?php foreach ($adlist as $key => $value) { ?>
                            <div class="form-group">
                                <div class="checkbox">
                                    <label style="word-break: break-word;">
                                        <input type="checkbox" name="adlist-enable-<?php echo $key; ?>" <?php if($value[0]){ ?>checked<?php } ?>>
                                        <a href="<?php echo htmlentities ($value[1]); ?>" target="_new"><?php echo htmlentities($value[1]); ?></a>
                                        <input type="checkbox" name="adlist-del-<?php echo $key; ?>" hidden>
                                        <br>
                                        <button class="btn btn-danger btn-xs" id="adlist-btn-<?php echo $key; ?>">
                                            <span class="glyphicon glyphicon-trash"></span>
                                        </button>
                                    </label>
                                </div>
                            </div>
                        <?php } ?>
                        <div class="form-group">
                            <textarea name="newuserlists" class="form-control" rows="1" placeholder="Enter one URL per line to add new ad lists"></textarea>
                        </div>
                    </div>
                </div>
                <div class="box-footer">
                    <input type="hidden" name="field" value="adlists">
                    <input type="hidden" name="token" value="<?php echo $token ?>">
                    <button type="submit" class="btn btn-primary" name="submit" value="save">Save</button>
                    <button type="submit" class="btn btn-primary pull-right" name="submit" value="saveupdate">Save and Update</button>
                </div>
            </form>
        </div>
