<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title -->
<div class="page-header">
    <h1>Find Domains In Lists</h1>
</div>
<div class="row">
    <div class="col-md-12">
        <div class="box">
            <form id="searchForm">
                <div class="box-header">
                    <div id="domain-search-block" class="input-group">
                        <input id="domain" type="text" class="form-control disable-autocorrect" placeholder="Domain to look for (example.com or sub.example.com)" required>
                        <span class="input-group-btn">
                            <button type="submit" id="btnSearch" class="btn btn-default">Search</button>
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
                                <label for="number" class="mr-2">Maximum number of results to be returned:</label>
                                <input class="form-control input-sm disable-autocorrect" type="number" min="0" value="20" id="number" required>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<pre id="output" class="d-none"></pre>

<script defer src="<?=pihole.fileversion('scripts/js/search.js')?>"></script>
<? mg.include('scripts/lua/footer.lp','r')?>
