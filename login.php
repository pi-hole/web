<?php
/*
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

$wrongpassword = false;
require 'scripts/pi-hole/php/header.php';

?>
<body class="hold-transition layout-boxed login-page">
<div class="box login-box">
    <section style="padding: 15px;">
        <div class="login-logo">
            <div class="text-center">
                <img src="img/logo.svg" alt="Pi-hole logo" class="loginpage-logo">
            </div>
            <div class="panel-title text-center"><span class="logo-lg" style="font-size: 25px;">Pi-<b>hole</b></span></div>
        </div>
        <!-- /.login-logo -->

        <div class="card">
            <div class="card-body login-card-body">
                <div id="cookieInfo" class="panel-title text-center text-red" style="font-size: 150%" hidden>Verify that cookies are allowed</div>
                <?php if ($wrongpassword) { ?>
                <div class="form-group has-error login-box-msg">
                    <label class="control-label"><i class="fa fa-times-circle"></i> Wrong password!</label>
                </div>
                <?php } ?>

                <form id="loginform">
                    <div class="login-options has-feedback<?php if ($wrongpassword) { ?> has-error<?php } ?>">
                        <input type="text" id="username" value="pi.hole" autocomplete="username" hidden>
                        <div class="pwd-field form-group">
                            <!-- hidden username input field to help password managers to autfill the password -->
                            <input type="password" id="loginpw" name="pw" class="form-control" placeholder="Password" spellcheck="false" autocomplete="current-password" autofocus>
                        </div>
                        <div class="form-group">
                            <input type="numeric" id="totp" name="totp" class="form-control hidden" placeholder="2FA token like 01234567" spellcheck="false" autocomplete="current-password" autofocus>
                        </div>
                        <span class="fa fa-key pwd-field form-control-feedback"></span>
                    </div>
                    <!--
                    <div class="form-group" title="Pi-hole has to set a cookie for the login session to be successful. The cookie will not contain your password nor is it used anywhere outside of you local Pi-hole.">
                        <input type="checkbox" id="logincookie" checked>
                        <label for="logincookie">Keep me logged in (uses cookie)</label>
                    </div> -->
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary form-control"><i class="fas fa-sign-in-alt"></i>&nbsp;&nbsp;&nbsp;Log in (uses cookie)</button>
                    </div>
                </form>
                <br>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="box box-<?php if (!$wrongpassword) { ?>info collapsed-box<?php } else { ?>danger<?php }?>">
                            <div class="box-header with-border pointer no-user-select" data-widget="collapse">
                                <h3 class="box-title">Forgot password?</h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool">
                                        <i class="fa <?php if ($wrongpassword) { ?>fa-minus<?php } else { ?>fa-plus<?php } ?>"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="box-body">
                                <p>After installing Pi-hole for the first time, a password is generated and displayed
                                    to the user. The password cannot be retrieved later on, but it is possible to set
                                    a new password (or explicitly disable the password by setting an empty password)
                                    using the command
                                </p>
                                <pre>sudo pihole -a -p</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /.login-card-body -->
            <div class="login-footer" style="margin-top: 15px; display: flex; justify-content: space-between;">
                <a class="btn btn-default btn-sm" role="button" href="https://docs.pi-hole.net/" target="_blank"><i class="fas fa-question-circle"></i> Documentation</a>
                <a class="btn btn-default btn-sm" role="button" href="https://github.com/pi-hole/" target="_blank"><i class="fab fa-github"></i> Github</a>
                <a class="btn btn-default btn-sm" role="button" href="https://discourse.pi-hole.net/" target="_blank"><i class="fab fa-discourse"></i> Pi-hole Discourse</a>
            </div>
        </div>
    </section>
</div>

<div class="login-donate">
    <div class="text-center" style="font-size:125%">
        <strong><a href="https://pi-hole.net/donate/" rel="noopener" target="_blank"><i class="fa fa-heart text-red"></i> Donate</a></strong> if you found this useful.
    </div>
</div>
<script src="<?php echo fileversion('scripts/pi-hole/js/login.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/vendor/geraintluff-sha256.min.js'); ?>"></script>
<script src="<?php echo fileversion('scripts/pi-hole/js/footer.js'); ?>"></script>
</body>
</html>
