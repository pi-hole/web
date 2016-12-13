<div class="row">
  <div class="col-sm-8 col-sm-offset-2">
  <center>
    <img src="img/lock.svg" width="60%">
    <div class="page-header">Protected page</div>
    <form action="" method="POST">
        <div class="form-group <?php if($wrongpassword){ ?>has-error<?php } ?> input-group-lg">
        <?php if($wrongpassword){ ?><label class="control-label" for="inputError"><i class="fa fa-times-circle-o"></i> Wrong password!</label><?php } ?>
        <div class="input-group">
            <input type="password" class="form-control" name="pw" placeholder="Enter password to continue">
            <span class="input-group-btn">
              <button type="submit" class="btn btn-info btn-flat <?php if($wrongpassword){ ?>btn-danger<?php } ?>">Submit</button>
          </span>
          </div>
      </div>
  </form>
</center>
</div>
</div>
