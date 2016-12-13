<div class="row">
  <div class="col-sm-6 col-sm-offset-3">
  <center>
	<svg width="100%" viewBox="-60 -5 220 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" style="max-width: 400px;"><!-- " border: 1px solid black;" > -->
		<defs>
			<style type="text/css">
				<![CDATA[
					.bluranddarken{
						filter: url(#bluranddarken);
					}
					.blurslightly{
						filter: url(#blurslightly);
					}
				]]>
			</style>
			<filter id="bluranddarken">
				<!-- Add blur -->
				<feGaussianBlur in="SourceGraphic" stdDeviation="3,3" />
				<feComponentTransfer> <!-- Make it darker -->
					<feFuncR type="linear" slope="0.5"/>
					<feFuncG type="linear" slope="0.5"/>
					<feFuncB type="linear" slope="0.5"/>
				</feComponentTransfer>
			</filter>
			<filter id="blurslightly">
				<feGaussianBlur in="SourceGraphic" stdDeviation="2,2" />
			</filter>
		</defs>
		<g class="bluranddarken">
			<image x="0" y="0" width="100" height="100" xlink:href="img/logo.svg"/>
		</g>
		<g class="blurslightly">
			<text font-family="Verdana" x="-18" y="130" font-size="24" class="protected">Protected area</text>
		</g>

		<!--
		M is moveto

		A is a general elliptical arc command.

		L is lineto
		-->
	</svg>
  </center>
  </div>
</div>
<div class="row">
  <div class="col-sm-6 col-sm-offset-3">
    <form action="" method="POST">
        <div class="form-group <?php if($wrongpassword){ ?>has-error<?php } ?> input-group-lg">
        <?php if($wrongpassword){ ?><center><label class="control-label" for="inputError"><i class="fa fa-times-circle-o"></i> Wrong password!</label></center><?php } ?>
        <div class="input-group">
            <input type="password" class="form-control " name="pw" placeholder="Enter password to unlock">
            <span class="input-group-btn">
              <button type="submit" class="btn btn-info btn-flat <?php if($wrongpassword){ ?>btn-danger<?php } ?>">Submit</button>
            </span>
          </div>
      </div>
  </form>
</center>
</div>
</div>

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


