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
        <div class="login-logo">
            <div class="text-center">
                <img src="<?=pihole.webhome()?>img/logo.svg" alt="Pi-hole logo" class="loginpage-logo">
            </div>
            <div class="panel-title text-center"><span class="logo-lg" style="font-size: 25px;">Pi-<b>hole</b></span></div>
        </div>
        <!-- /.login-logo -->

        <div class="card">
            <div class="card-body login-card-body">
                <div id="cookieInfo" class="panel-title text-center text-red" style="font-size: 150%" hidden>Verify that cookies are allowed</div>
                <div class="text-center form-group has-error" id="dns-failure-label" style="display: none;">
                    <label>DNS Server failure detected, log in to see Pi-hole diagnosis messages</label>
                </div>
                <div class="text-center form-group has-error" id="insecure-box" style="display: none;">
                    <div class="box box-danger">
                        <div class="box-header with-border pointer no-user-select">
                            <h3 class="box-title has-error control-label"><i class="fa fa-fw fa-triangle-exclamation"></i>&nbsp;&nbsp;Insecure network connection&nbsp;&nbsp;<i class="fa fa-fw fa-triangle-exclamation"></i></h3>
                        </div>
                        <div class="box-body">
                            <p>Consider upgrading to <a href="#" id="https-link">HTTPS</a> (end-to-end encryption)</p>
                        </div>
                    </div>
                </div>
                <div class="form-group has-error login-box-msg" id="error-label" style="display: none;">
                    <label class="control-label"><i class="fa fa-times-circle"></i> <span id="error-message"></span><br><span id="error-hint" style="display: none;"></span></label>
                </div>

                <form id="loginform">
                    <div class="login-options has-feedback" id="pw-field">
                        <input type="text" id="username" value="pi.hole" autocomplete="username" hidden>
                        <div class="input-group pwd-field form-group">
                            <!-- hidden username input field to help password managers to autfill the password -->
                            <input type="password" class="form-control" placeholder="Password" value="" spellcheck="false" autocomplete="current-password" id="current-password" autofocus required>
                            <span class="input-group-btn">
                                <button class="btn btn-default" id="toggle-password" type="button" title="Show password as plain text. Warning: this will display your password on the screen.">
                                    <span class="fa fa-fw fa-eye field-icon"></span>
                                </button>
                            </span>
                        </div>
                    </div>
                    <div class="form-group has-feedback hidden" id="totp_input">
                        <input type="text" id="totp" size="6" maxlen="6" class="form-control totp_token" placeholder="123456" value="" spellcheck="false" autofocus autocomplete="off">
                        <span class="fa fa-clock-rotate-left pwd-field form-control-feedback"></span>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn btn-primary form-control"><i class="fas fa-sign-in-alt"></i>&nbsp;&nbsp;&nbsp;Log in (uses cookie)</button>
                    </div>
                </form>
                <br>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="box box-danger hidden" id="invalid2fa-box">
                            <div class="box-header with-border pointer no-user-select" data-widget="collapse">
                                <h3 class="box-title">Wrong 2FA token</h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool">
                                        <i class="fa fa-minus"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="box-body">
                                <p>Your Pi-hole has two-factor authentication enabled. You have to
                                    enter a valid <a href="https://en.wikipedia.org/wiki/Time-based_One-time_Password_algorithm" target="_blank">TOTP</a>
                                    token in addition to your password. You see this message because your
                                    token was incorrect or has already expired.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row">
                    <div class="col-xs-12">
                        <div class="box box-info collapsed-box" id="forgot-pw-box">
                            <div class="box-header with-border pointer no-user-select" data-widget="collapse">
                                <h3 class="box-title">Forgot password?</h3>
                                <div class="box-tools pull-right">
                                    <button type="button" class="btn btn-box-tool">
                                        <i class="fa fa-plus" id="forgot-pw-toggle-icon"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="box-body">
                                <p>After installing Pi-hole for the first time, a password is generated and displayed
                                    to the user. The password cannot be retrieved later on, but it is possible to set
                                    a new password (or explicitly disable the password by setting an empty password)
                                    using the command
                                </p>
                                <pre>sudo pihole setpassword</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- /.login-card-body -->
            <div class="login-footer" style="margin-top: 15px; display: flex; justify-content: space-between;">
                <a class="btn btn-default btn-sm" role="button" href="https://docs.pi-hole.net/" target="_blank"><i class="fas fa-question-circle"></i> Documentation</a>
                <a class="btn btn-default btn-sm" role="button" href="https://github.com/pi-hole/" target="_blank"><i class="fab fa-github"></i> GitHub</a>
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
<script src="<?=pihole.fileversion('scripts/pi-hole/js/login.js')?>"></script>
<script src="<?=pihole.fileversion('scripts/pi-hole/js/footer.js')?>"></script>
</body>
</html>
