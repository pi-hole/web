<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
?>
<!-- Title -->
<div class="page-header">
    <h1>Find Domains In Lists</h1>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <div class="box-header">
                <div id="domain-search-block" class="input-group">
                    <input id="domain" type="url" class="form-control" placeholder="Domain to look for (example.com or sub.example.com)" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">
                    <input id="quiet" type="hidden" value="no">
                    <span class="input-group-btn">
                        <button type="button" id="btnSearch" class="btn btn-default">Search</button>
                    </span>
                </div>
            </div>
            <div class="box-body">
                <div class="row">
                    <div class="col-md-4">
                        <div>
                            <input type="checkbox" id="partialMatch" data-key="partialMatch">
                            <label for="partialMatch"><strong>Use partial matching</strong></label>
                        </div>
                    </div>
                    <br class="hidden-md hidden-lg">
                    <div class="col-md-8">
                        <div id="domain-limitbox-block" class="form-inline">
                            <label for="number">Maximum number of results to be returned:&nbsp;</label>
                            <input class="form-control input-sm" type="number" min="0" value="20" id="number">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<pre id="output" style="width: 100%; height: 100%;" hidden></pre>

<script src="<?=pihole.fileversion('scripts/pi-hole/js/search.js')?>"></script>
<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
