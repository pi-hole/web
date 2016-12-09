<div class="row">
  <div class="col-sm-12 col-sm-offset-0">
  <center>
	<svg width="60%" viewBox="-80 -20 260 140" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"> <!-- style="border: 1px solid black;" > -->
		<defs>
			<style type="text/css">
				<![CDATA[
					.filtered{
						filter: url(#svgfilter);
					}
				]]>
			</style>
			<filter id="svgfilter">
				<feGaussianBlur in="SourceGraphic" stdDeviation="2,2" />
				<feComponentTransfer>
					<feFuncR type="linear" slope="0.5"/>
					<feFuncG type="linear" slope="0.5"/>
					<feFuncB type="linear" slope="0.5"/>
				</feComponentTransfer>
			</filter>
		</defs>
		<g class="filtered">
			<image x="0" y="0" width="100" height="100" xlink:href="img/logo.svg"/>
		</g>
		<circle cx="50" cy="50" r="68" class="path" strokemiterlimit="10" stroke="black" stroke-width="4" fill="none" />
		</svg>
    <div class="page-header">Protected page</div>
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
	stroke-dasharray: 14.2,14.2;
	animation-name: ckw;
	/* Set animation to linear style (no acceleration) */
	animation-duration: 18s; /* Determines spinning speed */
	animation-timing-function: linear; /* Play the animation with the same speed from beginning to end */
	animation-iteration-count: infinite; /* Never stop animation */
	transform-origin: 50% 50%; /* get circle rolling around itself */
}

@keyframes ckw {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>


