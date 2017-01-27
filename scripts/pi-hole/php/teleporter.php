<?php
require('func.php');
function process_zip($name)
{
	global $zip;
	$zippointer = $zip->getStream($name);
	if(!$zippointer)
	{
		echo "$name not found in provided ZIP file, skipping...<br>";
		return;
	}
	$contents = "";
	while (!feof($zippointer)) {
		$contents .= fread($zippointer, 4096);
	}
	fclose($zippointer);
	$domains = array_filter(explode("\n",$contents));
	check_domains($domains);
	return $domains;
}

function add_to_zip($path,$name)
{
	global $zip;
	if(file_exists($path.$name))
		$zip->addFile($path.$name,$name);
}

function check_domains($domains)
{
	foreach($domains as $domain)
	{
		if(!is_valid_domain_name($domain)){
			die(htmlspecialchars($domain).' is not a valid domain');
		}
	}
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

	return "";
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
			if(isset($_POST["blacklist"]))
			{
				$blacklist = process_zip("blacklist.txt");
				exec("sudo pihole -b -q ".implode(" ", $blacklist));
			}

			if(isset($_POST["whitelist"]))
			{
				$whitelist = process_zip("whitelist.txt");
				exec("sudo pihole -w -q ".implode(" ", $whitelist));
			}

			if(isset($_POST["wildlist"]))
			{
				$wildlist = process_zip("wildcardblocking.txt");
				exec("sudo pihole -wild -q ".implode(" ", $wildlist));
			}

			echo "OK";

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
	$archive_file_name = "/var/www/html/pi-hole-teleporter_".microtime(true).".zip";
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
	header("Content-Disposition: attachment; filename=pi-hole-teleporter.zip");
	header("Content-length: " . filesize($archive_file_name));
	header("Pragma: no-cache");
	header("Expires: 0");
	ob_end_clean();
	readfile($archive_file_name);
	exit;
}

?>
