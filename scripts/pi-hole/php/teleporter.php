<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require "password.php";
require "auth.php"; // Also imports func.php

if (php_sapi_name() !== "cli") {
	if(!$auth) die("Not authorized");
	check_csrf(isset($_POST["token"]) ? $_POST["token"] : "");
}

function archive_add_file($path,$name,$subdir="")
{
	global $archive;
	if(file_exists($path.$name))
		$archive[$subdir.$name] = file_get_contents($path.$name);
}

function archive_add_directory($path,$subdir="")
{
	if($dir = opendir($path))
	{
		while(false !== ($entry = readdir($dir)))
		{
			if($entry !== "." && $entry !== "..")
			{
				archive_add_file($path,$entry,$subdir);
			}
		}
		closedir($dir);
	}
}

function limit_length(&$item, $key)
{
	// limit max length for a domain entry to 253 chars
	// return only a part of the string if it is longer
	$item = substr($item, 0, 253);
}

function process_file($contents,$check=True)
{
	$domains = array_filter(explode("\n",$contents));

	// Walk array and apply a max string length
	// function to every member of the array of domains
	array_walk($domains, "limit_length");

	// Check validity of domains (don't do it for regex filters)
	if($check)
	{
		check_domains($domains);
	}

	return $domains;
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

if(isset($_POST["action"]))
{
	if($_FILES["zip_file"]["name"] && $_POST["action"] == "in")
	{
		$filename = $_FILES["zip_file"]["name"];
		$source = $_FILES["zip_file"]["tmp_name"];
		$type = mime_content_type($source);

		$name = explode(".", $filename);
		$accepted_types = array('application/gzip', 'application/tar', 'application/x-compressed', 'application/x-gzip');
		$okay = false;
		foreach($accepted_types as $mime_type) {
			if($mime_type == $type) {
				$okay = true;
				break;
			}
		}

		$continue = strtolower($name[1]) == 'tar' && strtolower($name[2]) == 'gz' ? true : false;
		if(!$continue || !$okay) {
			die("The file you are trying to upload is not a .tar.gz file (filename: ".htmlentities($filename).", type: ".htmlentities($type)."). Please try again.");
		}

		$fullfilename = sys_get_temp_dir()."/".$filename;
		if(!move_uploaded_file($source, $fullfilename))
		{
			die("Failed moving ".htmlentities($source)." to ".htmlentities($fullfilename));
		}

		$archive = new PharData($fullfilename);

		$importedsomething = false;

		foreach($archive as $file)
		{
			if(isset($_POST["blacklist"]) && $file->getFilename() === "blacklist.txt")
			{
				$blacklist = process_file(file_get_contents($file));
				echo "Processing blacklist.txt (".count($blacklist)." entries)<br>\n";
				exec("sudo pihole -b -nr --nuke");
				exec("sudo pihole -b -q -nr ".implode(" ", $blacklist));
				$importedsomething = true;
			}

			if(isset($_POST["whitelist"]) && $file->getFilename() === "whitelist.txt")
			{
				$whitelist = process_file(file_get_contents($file));
				echo "Processing whitelist.txt (".count($whitelist)." entries)<br>\n";
				exec("sudo pihole -w -nr --nuke");
				exec("sudo pihole -w -q -nr ".implode(" ", $whitelist));
				$importedsomething = true;
			}

			if(isset($_POST["regexlist"]) && $file->getFilename() === "regex.list")
			{
				$regexraw = file_get_contents($file);
				$regexlist = process_file($regexraw,false);
				echo "Processing regex.list (".count($regexlist)." entries)<br>\n";
				// NULL = overwrite (or create) the regex filter file
				add_regex($regexraw, NULL,"");
				$importedsomething = true;
			}

			// Also try to import legacy wildcard list if found
			if(isset($_POST["regexlist"]) && $file->getFilename() === "wildcardblocking.txt")
			{
				$wildlist = process_file(file_get_contents($file));
				echo "Processing wildcardblocking.txt (".count($wildlist)." entries)<br>\n";
				exec("sudo pihole --wild -nr --nuke");
				exec("sudo pihole --wild -q -nr ".implode(" ", $wildlist));
				$importedsomething = true;
			}

			if($importedsomething)
			{
				exec("sudo pihole restartdns");
			}
		}

		unlink($fullfilename);
		echo "OK";
	}
	else
	{
		die("No file transmitted or parameter error.");
	}
}
else
{
	$tarname = "pi-hole-teleporter_".date("Y-m-d_h-i-s").".tar";
	$filename = $tarname.".gz";
	$archive_file_name = sys_get_temp_dir() ."/". $tarname;
	$archive = new PharData($archive_file_name);

	if ($archive->isWritable() !== TRUE) {
		exit("cannot open/create ".htmlentities($archive_file_name)."<br>\nPHP user: ".exec('whoami')."\n");
	}

	archive_add_file("/etc/pihole/","whitelist.txt");
	archive_add_file("/etc/pihole/","blacklist.txt");
	archive_add_file("/etc/pihole/","adlists.list");
	archive_add_file("/etc/pihole/","setupVars.conf");
	archive_add_file("/etc/pihole/","auditlog.list");
	archive_add_file("/etc/pihole/","regex.list");
	archive_add_directory("/etc/dnsmasq.d/","dnsmasq.d/");

	$archive->compress(Phar::GZ); // Creates a gziped copy
	unlink($archive_file_name); // Unlink original tar file as it is not needed anymore
	$archive_file_name .= ".gz"; // Append ".gz" extension to ".tar"

	header("Content-type: application/zip");
	header('Content-Transfer-Encoding: binary');
	header("Content-Disposition: attachment; filename=".$filename);
	header("Content-length: " . filesize($archive_file_name));
	header("Pragma: no-cache");
	header("Expires: 0");
	if(ob_get_length() > 0) ob_end_clean();
	readfile($archive_file_name);
	ignore_user_abort(true);
	unlink($archive_file_name);
	exit;
}

?>
