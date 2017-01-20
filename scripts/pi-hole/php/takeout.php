<?php
function process_zip($name)
{
	global $zip;
	$fp = $zip->getStream($name);
	if(!$fp)
	{
		echo "$name not found in provided ZIP file, skipping...<br>";
		return;
	}
	while (!feof($fp)) {
		$contents .= fread($fp, 2);
	}
	fclose($fp);
	return $contents;
}

function add_to_zip($path,$name)
{
	global $zip;
	if(file_exists($path.$name))
		$zip->addFile($path.$name,$name);
}

function getWildcardListContent() {
	if(file_exists("/etc/dnsmasq.d/03-pihole-wildcard.conf"))
	{
		$rawList = file_get_contents("/etc/dnsmasq.d/03-pihole-wildcard.conf");
		$wclist = explode("\n", $rawList);
		$list = [];

		foreach ($wclist as $entry) {
			$expl = explode("/", $entry);
			if(count($expl) == 3)
			{
				array_push($list,$expl[1]);
			}
		}

		return implode("\n",array_unique($list));
	}
	else
	{
		return "";
	}
}

if($_POST["action"] == "in")
{
	if($_FILES["zip_file"]["name"])
	{
		$filename = $_FILES["zip_file"]["name"];
		$source = $_FILES["zip_file"]["tmp_name"];
		$type = $_FILES["zip_file"]["type"];

		$name = explode(".", $filename);
		$accepted_types = array('application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/x-compressed');
		$okay = false;
		foreach($accepted_types as $mime_type) {
			if($mime_type == $type) {
				$okay = true;
				break;
			}
		}

		$continue = strtolower($name[1]) == 'zip' ? true : false;
		if(!$continue || !$okay) {
			die("The file you are trying to upload is not a .zip file. Please try again.");
		}

		$zip = new ZipArchive();
		$x = $zip->open($source);
		if ($x === true) {
			echo process_zip("blacklist.txt");
			echo process_zip("whitelist.txt");
			$zip->close();
		}
		else
		{
			die("Error opening uploaded archive!");
		}
	}
	else
	{
		die("No file transmitted.");
	}
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

	add_to_zip("/etc/pihole/","whitelist.txt");
	add_to_zip("/etc/pihole/","blacklist.txt");
	add_to_zip("/etc/pihole/","adlists.list");
	add_to_zip("/etc/pihole/","setupVars.conf");

	$zip->addFromString("wildcardblocking.txt", getWildcardListContent());
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
