<div class="row">
    <div class="col-sm-12">
        <center><img src="img/logo.svg" width="20%"></center>
    </div>
    <div class="col-sm-12">
        <center><span class="logo-lg" style="font-size: 25px;"><b>Pi</b>-hole</span></center>
    </div>
</div>
<div class="login-box">
  <div class="login-box-body">
    <p class="login-box-msg">Sign in to start your session</p>
      <?php if($wrongpassword){ ?>
          <div class="form-group has-error login-box-msg">
              <label class="control-label"><i class="fa fa-times-circle-o"></i> Wrong password!</label>
          </div>
      <?php } ?>

    <form action="" method="post">
      <div class="form-group has-feedback <?php if($wrongpassword){ ?>has-error<?php } ?> ">
        <input type="password" name="pw" class="form-control" placeholder="Password">
        <span class="glyphicon glyphicon-lock form-control-feedback"></span>
      </div>
      <div class="row">
        <div class="col-xs-4 col-xs-offset-8">
          <button type="submit" class="btn btn-primary btn-block btn-flat">Log In</button>
        </div>
      </div>
      <br>
      <div class="row">
        <div class="col-xs-12">
            <div class="box box-info <?php if(!$wrongpassword){ ?>collapsed-box<?php } ?> box-solid">
                <div class="box-header with-border">
                    <h3 class="box-title">Forgot password</h3>

                    <div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa <?php if($wrongpassword){ ?>fa-minus<?php }else{ ?>fa-plus<?php } ?>"></i></button></div>
                </div>
                <div class="box-body">
                    After installing Pi-Hole for the first time, a password is generated and displayed to the user. The password cannot be retrived later on, but it is possible to set a new password (or explicitly disable the password) using the command <pre>sudo pihole -a -p newpassword</pre>
                </div>
            </div>
        </div>
      </div>
    </form>
</div>
<br>

<style type="text/css">
.protected {
<?php if($wrongpassword){ ?>
	animation-name: color;
	animation-duration: 2s;
	animation-timing-function: linear;
	animation-iteration-count: infinite;
<?php } ?>
}

@keyframes color {
  0% {
    stroke: #000;
  }
  50% {
    stroke: #C00;
  }
  100% {
    stroke: #000;
  }
}
</style>


