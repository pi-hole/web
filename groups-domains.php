<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
    $type = "all";
    $pagetitle = "Domain";
    $adjective = "";
    if (isset($_GET['type']) && ($_GET['type'] === "white" || $_GET['type'] === "black")) {
        $type = $_GET['type'];
        $pagetitle = ucfirst($type)."list";
        $adjective = $type."listed";
    }
?>

<!-- Title -->
<div class="page-header">
    <h1><?php echo $pagetitle; ?> management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new <?php echo $adjective; ?> domain or regex filter
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="nav-tabs-custom">
                    <ul class="nav nav-tabs">
                        <li class="active"><a aria-expanded="true" href="#tab_domain" data-toggle="tab">Domain</a></li>
                        <li class=""><a aria-expanded="false" href="#tab_regex" data-toggle="tab">RegEx filter</a></li>
                    </ul>        
                    <div class="tab-content">
                        <!-- Domain tab -->
                        <div id="tab_domain" class="tab-pane active in">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="new_domain">Domain:</label>
                                        <div class="input-group">
                                            <input id="new_domain" type="text" class="form-control active" placeholder="Domain to be added">
                                            <span class="input-group-addon">
                                                <input type="checkbox" id="wildcard_checkbox">
                                                wildcard</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <strong><i class="fa fa-question-circle"></i> Checkbox "wildcard":</span></strong> Check this box if you want to involve
                                        all subdomains. The entered domain will be converted to a RegEx filter while adding.
                                    </div>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label for="new_domain_comment">Comment:</label>
                                    <input id="new_domain_comment" type="text" class="form-control" placeholder="Description (optional)">
                                </div>
                            </div>
                        </div>
                        <!-- RegEx tab -->
                        <div id="tab_regex" class="tab-pane">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="new_regex">Regular Expression:</label>
                                        <input id="new_regex" type="text" class="form-control active" placeholder="RegEx to be added">
                                    </div>
                                    <div class="form-group">
                                        <strong>Hint:</strong> Need help to write a proper RegEx rule? Have a look at our online
                                        <a href="https://docs.pi-hole.net/ftldns/regex/tutorial" rel="noopener" target="_blank">
                                            regular expressions tutorial</a>.
                                    </div>
                                </div>
                                <div class="form-group col-md-6">
                                        <label for="new_regex_comment">Comment:</label>
                                        <input id="new_regex_comment" type="text" class="form-control" placeholder="Description (optional)">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="btn-toolbar pull-right" role="toolbar" aria-label="Toolbar with buttons">
                    <?php if ( $type !== "white" ) { ?>
                    <div class="btn-group" role="group" aria-label="Third group">
                        <button type="button" class="btn btn-primary" id="add2black">Add to Blacklist</button>
                    </div>
                    <?php } if ( $type !== "black" ) { ?>
                    <div class="btn-group" role="group" aria-label="Third group">
                        <button type="button" class="btn btn-primary" id="add2white">Add to Whitelist</button>
                    </div>
                    <?php } ?>
                </div>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<!-- Domain List -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="domains-list">
            <div class="box-header with-border">
                <h3 class="box-title">
                    List of <?php echo $adjective; ?> entries
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="domainsTable" class="display table table-striped table-bordered" cellspacing="0" width="100%">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Domain/RegEx</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Comment</th>
                        <th>Group assignment</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" hidden="true">Reset sorting</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/groups-common.js"></script>
<script src="scripts/pi-hole/js/groups-domains.js"></script>

<?php
require "scripts/pi-hole/php/footer.php";
?>
