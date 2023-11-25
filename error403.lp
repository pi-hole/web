<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header.lp','r')
?>
<body class="hold-transition layout-boxed login-page">
    <div class="box login-box">
        <section style="padding: 15px;">
                <h2 class="error-headline text-danger">403</h2>
                <div class="error-content">
                    <h3><i class="fa fa-times-circle text-danger"></i> Oops! Access denied.</h3>
                    <p>
                        You don't have permission to access <code><?=mg.request_info.request_uri?></code> on this server.<br>
                        Did you mean to go to <a href="<?=pihole.webhome()?>">your Pi-hole's dashboard</a> instead?
                    </p>
            </div>
        </section>
    </div>
</body>
</html>
