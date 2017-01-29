<div class="mainbox col-md-6 col-md-offset-3 col-sm-6 col-sm-offset-3">
  <div class="panel panel-default">
    <div class="panel-heading">
      <div style="text-align: center;"><img src="img/logo.svg" width="<?php if ($boxedlayout) { ?>50%<?php } else { ?>30%<?php } ?>"></div><br>

      <div class="panel-title text-center"><span class="logo-lg" style="font-size: 25px;"><b>Pi</b>-hole</span></div>
      <p class="login-box-msg">Sign in to start your session</p>
      <div id="cookieInfo" class="panel-title text-center" style="color:#F00; font-size: 150%" hidden>Verify that cookies are allowed for <tt><?php echo $_SERVER['HTTP_HOST']; ?></tt></div>
      <?php if ($wrongpassword) { ?>
        <div class="form-group has-error login-box-msg">
          <label class="control-label"><i class="fa fa-times-circle-o"></i> Wrong password!</label>
        </div>
      <?php } ?>
    </div>

    <div class="panel-body">
      <form action="" id="loginform" method="post">
        <div class="form-group has-feedback <?php if ($wrongpassword) { ?>has-error<?php } ?> ">
          <input type="password" id="loginpw" name="pw" class="form-control" placeholder="Password" autofocus>
          <span class="glyphicon glyphicon-lock form-control-feedback"></span>
        </div>
        <div class="row">
          <div class="col-xs-8">
          <ul>
            <li><tt>Return</tt> &rarr; Log in and go to requested page (<?php echo $scriptname; ?>)</li>
            <li><tt>Ctrl+Return</tt> &rarr; Log in and go to Settings page</li>
          </ul>
          </div>
          <div class="col-xs-4">
            <button type="submit" href="#" class="btn btn-primary pull-right"><i class="glyphicon glyphicon-log-in"></i>&nbsp;&nbsp;&nbsp;Log in</button>
          </div>
        </div>
        <br>
        <div class="row">
          <div class="col-xs-12">
            <div class="box box-<?php if (!$wrongpassword) { ?>info<?php } else { ?>danger<?php }
            if (!$wrongpassword) { ?> collapsed-box<?php } ?> box-solid">
              <div class="box-header with-border">
                <h3 class="box-title">Forgot password</h3>

                <div class="box-tools pull-right">
                  <button type="button" class="btn btn-box-tool" data-widget="collapse"><i
                      class="fa <?php if ($wrongpassword) { ?>fa-minus<?php } else { ?>fa-plus<?php } ?>"></i>
                  </button>
                </div>
              </div>
              <div class="box-body">
                After installing Pi-Hole for the first time, a password is generated and displayed to the user. The
                password cannot be retrived later on, but it is possible to set a new password (or explicitly disable
                the
                password by setting an empty password) using the command
                <pre>sudo pihole -a -p newpassword</pre>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>
