<?php

if(isset($_GET["in"]))
{
}
else
{
	$archive_file_name = "/var/www/html/pi-hole-takeout_".microtime(true).".zip";
	$zip = new ZipArchive();
	touch($archive_file_name);
	$res = $zip->open($archive_file_name, ZipArchive::CREATE | ZipArchive::OVERWRITE);

	if ($res !== TRUE) {
	    exit("cannot open/create $archive_file_name<br>Error: ".$zip->getStatusString()."<br>PHP user: ".exec('whoami')."\n");
	}

	function add_to_zip($path,$name)
	{
		global $zip;
		if(file_exists($path.$name))
			$zip->addFile($path.$name,$name);
		else
			// Add empty file with thios filename
			$zip->addFromString($name, "");
	}
	add_to_zip("/etc/pihole","/whitelist.txt");
	add_to_zip("/etc/pihole","/blacklist.txt");
	// $zip->addFile("/etc/pihole/setupVars.conf");
	echo "numfiles: " . $zip->numFiles . "<br>";
	echo "status:" . $zip->status . "<br>";
	echo "statusSys: " . $zip->statusSys . "<br>";
	echo "archive_file_name: " . $zip->archive_file_name . "<br>";
	$zip->close();

	header("Content-type: application/zip");
	header('Content-Transfer-Encoding: binary');
	header("Content-Disposition: attachment; filename=pi-hole-takeout.zip");
	header("Content-length: " . filesize($archive_file_name));
	header("Pragma: no-cache");
	header("Expires: 0");
	ob_end_clean();
	readfile($archive_file_name);
	exit;
}
?>
