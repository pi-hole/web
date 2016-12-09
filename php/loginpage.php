<div class="row">
  <div class="col-sm-12 col-sm-offset-0">
  <center>
	<svg width="60%" viewBox="-80 -20 260 181" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <!-- style="border: 1px solid black;" > -->
		<defs>
			<style type="text/css">
				<![CDATA[
					.filtered{
						filter: url(#svgfilter);
					}
				]]>
			</style>
			<filter id="svgfilter">
				<!-- Add blur -->
				<feGaussianBlur in="SourceGraphic" stdDeviation="2,2" />
				<feComponentTransfer> <!-- Make it darker -->
					<feFuncR type="linear" slope="0.5"/>
					<feFuncG type="linear" slope="0.5"/>
					<feFuncB type="linear" slope="0.5"/>
				</feComponentTransfer>
			</filter>
		</defs>
		<g class="filtered">
			<image x="0" y="0" width="100" height="100" xlink:href="img/logo.svg"/>
		</g>

		<!--
		M is moveto

		A is a general elliptical arc command.

		L is lineto
		-->
		<path id="text_path" d="M-48,58 L-25,58 a68,68 0 0 1 150,0 L150,58 L150,150 L-48,150 L-48,58 L-25,58" fill="none" class="path" strokemiterlimit="10" stroke="black" stroke-width="4" />
		<text font-family="Verdana" x="-5" y="130" font-size="18">Protected page</text>
	</svg>
  </center>
  </div>
</div>
<div class="row">
  <div class="col-sm-8 col-sm-offset-2">
    <form action="" method="POST">
        <div class="form-group <?php if($wrongpassword){ ?>has-error<?php } ?> input-lg">
        <?php if($wrongpassword){ ?><label class="control-label" for="inputError"><i class="fa fa-times-circle-o"></i> Wrong password!</label><?php } ?>
        <div class="input-group">
            <input type="password" class="form-control " name="pw" placeholder="Enter password to continue">
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
.path {
	stroke-dasharray: 14.4,14.4;
	animation-name: dash;
	/* Set animation to linear style (no acceleration) */
	animation-duration: 30s; /* Determines spinning speed */
	animation-timing-function: linear; /* Play the animation with the same speed from beginning to end */
	animation-iteration-count: infinite; /* Never stop animation */
	transform-origin: 50% 50%; /* get circle rolling around itself */
}

@keyframes dash {
  to {
    stroke-dashoffset: 1000;
  }
}
</style>


