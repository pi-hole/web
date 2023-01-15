<?php
/*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/

require 'scripts/pi-hole/php/header_authenticated.php';
?>

<!-- Title -->
<div class="page-header">
    <h1>Domain management</h1>
</div>

<!-- Domain Input -->
<div class="row">
    <div class="col-md-12">
        <div class="box" id="add-group">
            <div class="box-header with-border">
                <h3 class="box-title">
                    Add a new domain or regex filter
                </h3>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <div class="nav-tabs-custom">
                    <ul class="nav nav-tabs" role="tablist">
                        <li class="active" role="presentation">
                            <a href="#tab_domain" aria-controls="tab_domain" aria-expanded="true" role="tab" data-toggle="tab">Domain</a>
                        </li>
                        <li role="presentation">
                            <a href="#tab_regex" aria-controls="tab_regex" aria-expanded="false" role="tab" data-toggle="tab">RegEx filter</a>
                        </li>
                    </ul>
                    <div class="tab-content">
                        <!-- Domain tab -->
                        <div id="tab_domain" class="tab-pane active fade in">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-group">
                                        <label for="new_domain">Domain:</label>
                                        <input id="new_domain" type="url" class="form-control active" placeholder="Domain to be added" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                                        <div id="suggest_domains" class="table-responsive no-border"></div>
                                    </div>
                                </div>
                                <div class="col-md-6 form-group">
                                    <label for="new_domain_comment">Comment:</label>
                                    <input id="new_domain_comment" type="text" class="form-control" placeholder="Description (optional)">
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-12">
                                    <div>
                                        <input type="checkbox" id="wildcard_checkbox">
                                        <label for="wildcard_checkbox"><strong>Add domain as wildcard</strong></label>
                                        <p>Check this box if you want to involve all subdomains. The entered domain will be converted to a RegEx filter while adding.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- RegEx tab -->
                        <div id="tab_regex" class="tab-pane fade">
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
                <div>
                    <p><strong>Note:</strong><br>
                        The domain or regex filter will be automatically assigned to the Default Group.<br>
                        Other groups can optionally be assigned in the list below (using <b>Group assignment</b>).
                    </p>
                </div>
                <div class="btn-toolbar pull-right" role="toolbar" aria-label="Toolbar with buttons">
                    <div class="btn-group" role="group" aria-label="Third group">
                        <button type="button" class="btn btn-primary" id="add2black">Add to Blacklist</button>
                    </div>
                    <div class="btn-group" role="group" aria-label="Third group">
                        <button type="button" class="btn btn-primary" id="add2white">Add to Whitelist</button>
                    </div>
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
                    List of domains
                </h3>
                <div class="filter_types">
                    <div class="line">
                        <span><input type="checkbox" name="typ" value="0" id="typ0" checked><label for="typ0">Exact whitelist</label></span>
                        <span><input type="checkbox" name="typ" value="2" id="typ2" checked><label for="typ2">Regex whitelist</label></span>
                    </div>
                    <div class="line">
                        <span><input type="checkbox" name="typ" value="1" id="typ1" checked><label for="typ1">Exact blacklist</label></span>
                        <span><input type="checkbox" name="typ" value="3" id="typ3" checked><label for="typ3">Regex blacklist</label></span>
                    </div>
                </div>
            </div>
            <!-- /.box-header -->
            <div class="box-body">
                <table id="domainsTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th></th>
                            <th>Domain/RegEx</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Comment</th>
                            <th>Group assignment</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                </table>
                <button type="button" id="resetButton" class="btn btn-default btn-sm text-red hidden">Reset sorting</button>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="<?php echo fileversion('scripts/vendor/bootstrap-select.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/vendor/bootstrap-toggle.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/groups-domains.js'); ?>"></script>

<?php
require 'scripts/pi-hole/php/footer.php';
?>
