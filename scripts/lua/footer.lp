<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
* ]]--

-- Iterate over the array mg.request_info.http_headers and check if there is an 'X-Forwarded-For' header
x_forwarded_for = ""
for k,v in pairs(mg.request_info.http_headers) do
    if k:lower() == "x-forwarded-for" then
        x_forwarded_for = mg.base64_encode(v)
        break
    end
end
?>

    </main><!-- /.app-main -->

    <!-- Modal for custom disable time -->
    <div class="modal fade" id="customDisableModal" tabindex="-1" role="dialog" aria-labelledby="customDisableModalLabel">
        <div class="modal-dialog modal-sm" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h4 class="modal-title" id="customDisableModalLabel">Custom disable timeout</h4>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <input id="customTimeout" class="form-control" type="number" value="60">
                        <input type="radio" class="btn-check" id="selSec" autocomplete="off">
                        <label class="btn btn-outline-secondary" for="selSec">Secs</label>
                        <input type="radio" class="btn-check" id="selMin" autocomplete="off" checked>
                        <label id="btnMins" class="btn btn-outline-secondary" for="selMin">Mins</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    <button type="button" id="pihole-disable-custom" class="btn btn-primary" data-bs-dismiss="modal">Submit</button>
                </div>
            </div>
        </div>
    </div>

    <footer class="app-footer">
        <div class="row">
            <div class="col-12 text-center">
                <strong><a href="https://pi-hole.net/donate/" rel="noopener noreferrer" target="_blank"><i class="fa fa-heart text-red"></i> Donate</a></strong> if you found this useful.
            </div>
        </div>

        <div class="row version-info">
            <div class="col-12 text-center d-flex justify-content-center flex-wrap">
                <ul class="list-inline small m-0" id="versions"></ul>
                <p class="mt-3 mb-0" id="update-hint"></p>
            </div>
        </div>
    </footer>

</div>
<!-- ./app-wrapper -->
<script src="<?=pihole.fileversion('scripts/js/footer.js')?>"></script>

<div id="advanced-info-data" style="display: none;" data-starttime="<?=starttime?>" data-endtime="<?=mg.time(true)?>" data-client-ip="<?=mg.request_info.remote_addr?>" data-xff="<?=x_forwarded_for?>"></div>
</body>
</html>
