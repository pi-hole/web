<?php /*
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2020 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license. */
    require "scripts/pi-hole/php/header.php";
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
                        <th>Time</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Data1</th>
                        <th>Data2</th>
                        <th>Data3</th>
                        <th>Data4</th>
                        <th>Data5</th>
                    </tr>
                    </thead>
                </table>
            </div>
            <!-- /.box-body -->
        </div>
        <!-- /.box -->
    </div>
</div>

<script src="scripts/pi-hole/js/utils.js"></script>
<script src="scripts/pi-hole/js/messages.js"></script>

<?php
    require "scripts/pi-hole/php/footer.php";
?>
