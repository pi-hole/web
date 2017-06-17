<?php
    // Ensure this script can only be included from settings.php
    if(basename($_SERVER['SCRIPT_FILENAME']) !== "settings.php")
    {
        die("Direct access to this script is forbidden!");
    }

    // Excluded domains in API Query Log call
    if(isset($setupVars["API_EXCLUDE_DOMAINS"]))
    {
        $excludedDomains = explode(",", $setupVars["API_EXCLUDE_DOMAINS"]);
    } else {
        $excludedDomains = [];
    }

    // Exluded clients in API Query Log call
    if(isset($setupVars["API_EXCLUDE_CLIENTS"]))
    {
        $excludedClients = explode(",", $setupVars["API_EXCLUDE_CLIENTS"]);
    } else {
        $excludedClients = [];
    }

    // Exluded clients
    if(isset($setupVars["API_QUERY_LOG_SHOW"]))
    {
        $queryLog = $setupVars["API_QUERY_LOG_SHOW"];
    } else {
        $queryLog = "all";
    }

    // Privacy Mode
    if(isset($setupVars["API_PRIVACY_MODE"]))
    {
        $privacyMode = $setupVars["API_PRIVACY_MODE"];
    } else {
        $privacyMode = false;
    }

?>
        <div class="box box-success">
            <div class="box-header with-border">
                <h3 class="box-title">API</h3>
            </div>
            <form role="form" method="post">
            <div class="box-body">
                <h4>Top Lists</h4>
                <p>Exclude the following domains from being shown in</p>
                <div class="col-lg-6">
                    <div class="form-group">
                    <label>Top Domains / Top Advertisers</label>
                    <textarea name="domains" class="form-control" rows="4" placeholder="Enter one domain per line"><?php foreach ($excludedDomains as $domain) { echo $domain."\n"; } ?></textarea>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-group">
                    <label>Top Clients</label>
                    <textarea name="clients" class="form-control" rows="4" placeholder="Enter one IP address or host name per line"><?php foreach ($excludedClients as $client) { echo $client."\n"; } ?></textarea>
                    </div>
                </div>
                <h4>Privacy settings (Statistics / Query Log)</h4>
                <div class="col-lg-6">
                    <div class="form-group">
                        <div class="checkbox"><label><input type="checkbox" name="querylog-permitted" <?php if($queryLog === "permittedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show permitted domain entries</label></div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="form-group">
                        <div class="checkbox"><label><input type="checkbox" name="querylog-blocked" <?php if($queryLog === "blockedonly" || $queryLog === "all"){ ?>checked<?php } ?>> Show blocked domain entries</label></div>
                    </div>
                </div>
                <h4>Privacy mode</h4>
                <div class="col-lg-12">
                    <div class="form-group">
                        <div class="checkbox"><label><input type="checkbox" name="privacyMode" <?php if($privacyMode){ ?>checked<?php } ?>> Don't show origin of DNS requests in query log</label></div>
                    </div>
                </div>
            </div>
            <div class="box-footer">
                <input type="hidden" name="field" value="API">
                <input type="hidden" name="token" value="<?php echo $token ?>">
                <button type="button" class="btn btn-primary api-token">Show API token</button>
                <button type="submit" class="btn btn-primary pull-right">Save</button>
            </div>
            </form>
        </div>
