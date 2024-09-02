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
                <h2 class="error-headline text-yellow">404</h2>
                <div class="error-content">
                    <h3><i class="fa fa-warning text-yellow"></i> Oops! Page not found.</h3>
                    <p>
                        We could not find the page you were looking for.<br>
                        Meanwhile, you may want to return to <a href="<?=pihole.webhome()?>">the dashboard</a>.
                    </p>
            </div>
        </section>
    </div>
</body>
</html>
