<?php
if($FTL)
{
	function get_FTL_data($arg)
	{
		global $FTLpid;
		return trim(exec("ps -p ".$FTLpid." -o ".$arg));
	}
	$FTLversion = exec("/usr/bin/pihole-FTL version");
}
?>
		<div class="box box-danger <?php if ($collapse) { ?>collapsed-box<?php } ?>">
			<div class="box-header with-border">
				<h3 class="box-title">Pi-hole FTL (<?php if($FTL){ ?>Running<?php }else{ ?>Not running<?php } ?>)</h3>
                <?php if ($collapse) { ?>
				<div class="box-tools pull-right"><button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-plus"></i></button></div>
                <?php } ?>
			</div>
			<div class="box-body">
				<?php if($FTL){ ?>FTL version: <?php echo $FTLversion; ?><br>
				Process identifier (PID): <?php echo $FTLpid; ?><br>
				Time FTL started: <?php print_r(get_FTL_data("start")); ?><br>
				User / Group: <?php print_r(get_FTL_data("euser")); ?> / <?php print_r(get_FTL_data("egroup")); ?><br>
				Total CPU utilization: <?php print_r(get_FTL_data("%cpu")); ?>%<br>
				Memory utilization: <?php print_r(get_FTL_data("%mem")); ?>%<br>
				<span title="Resident memory is the portion of memory occupied by a process that is held in main memory (RAM). The rest of the occupied memory exists in the swap space or file system.">Used memory: <?php echo formatSizeUnits(1e3*floatval(get_FTL_data("rss"))); ?></span><br>
				<?php } ?>
			</div>
		</div>
