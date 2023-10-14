<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/pi-hole/lua/header.lp','r')
?>
<body class="hold-transition layout-boxed login-page">
<div class="box login-box" id="login-box">
    <section style="padding: 15px;">
<div class="text-center"> <h1 class="error-headline text-yellow"> Yellow Alert</h2> 
        <div class="login-logo">
            
                <img src="<?=pihole.webhome()?>img/logo.svg" alt="Pi-hole logo" class="loginpage-logo">
            
            <div class="panel-title text-center"><span class="logo-lg" style="font-size: 25px;"><b>Pi-hole</b></span></div>
        </div>
        <!-- /.login-logo -->

                <div class="error-content">
                    <h3> You have stumbled into the Neutral Zone </h3> </div>
                    <p>
                       <h5> Return to <a href="<?=pihole.webhome()?>">the admin dashboard</a> before a Romulan Warbird arrives!
</p>
<!-- 
If you want to redirect automatically, replace/comment out the Romulan Warbird comment with the following:

    <h5> <p> Plot heading to <a href="<?=pihole.webhome()?>">the admin dashboard</a> and make it so in five seconds</a> 
</p>
     <meta http-equiv="Refresh" content="5; url='<?=pihole.webhome()?>'" /> 

-->
                            

</div>

</body>

