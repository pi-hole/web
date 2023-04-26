<? --[[
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/ ]]--

mg.include('scripts/pi-hole/lua/header_authenticated.lp','r')
?>

<!-- Title -->
<div class="page-header">
    <h1>Pi-hole diagnosis</h1>
    <small>On this page, you can see messages from your Pi-hole concerning possible issues.</small>
</div>

<div class="row">
    <div class="col-md-12">
        <div class="box" id="messages-list">
            <!-- /.box-header -->
            <div class="box-body">
                <table id="messagesTable" class="table table-striped table-bordered" width="100%">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>&nbsp;</th>
                            <th>Time</th>
                            <th>Type</th>
                            <th>Message</th>
                            <th>&nbsp;</th>
                        </tr>
                    </thead>
                </table>
                <p>Note: If errors are shown, you generate a debug log (use <code>pihole -d</code>), which will do a thorough Pi-hole evaluation.</p>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/pi-hole/js/messages.js')?>"></script>

<? mg.include('scripts/pi-hole/lua/footer.lp','r')?>
