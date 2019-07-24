<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require "password.php";
require "auth.php"; // Also imports func.php
require "database.php";

if (php_sapi_name() !== "cli") {
	if(!$auth) die("Not authorized");
	check_csrf(isset($_POST["token"]) ? $_POST["token"] : "");
}

$db = SQLite3_connect(getGravityDBFilename(), SQLITE3_OPEN_READWRITE);

function archive_add_file($path,$name,$subdir="")
{
	global $archive;
	if(file_exists($path.$name))
		$archive[$subdir.$name] = file_get_contents($path.$name);
}

/**
 * Add the contents of a table to the archive
 *
 * @param $name string The name of the file in the archive to save the table to
 * @param $table string The table to export
 */
function archive_add_table($name, $table)
{
	global $archive, $db;

	$results = $db->query("SELECT * FROM $table");

	// Return early without creating a file if th
	// requested table cannot be accessed
	if(is_null($results))
		return;

	$content = array();
	while ($row = $results->fetchArray(SQLITE3_ASSOC))
	{
		array_push($content, $row);
	}

	$archive[$name] = json_encode($content);
}

/**
 * Restore the contents of a table from an uploaded archive
 *
 * @param $file object The file of the file in the archive to restore the table from
 * @param $table string The table to import
 * @param $flush boolean Whether to flush the table before importing the archived data
 */
function archive_restore_table($file, $table, $flush=false)
{
	global $db;

	$json_string = file_get_contents($file);
	// Return early if we cannot extract the JSON string
	if(is_null($json_string))
		return 0;

	$contents = json_decode($json_string, true);
	// Return early if we cannot decode the JSON string
	if(is_null($contents))
		return 0;

	// Flush table if requested
	if($flush)
		$db->exec("DELETE FROM ".$table);

	// Prepare field name for domain/address depending on the table we restore to
	if($table === "adlist")
	{
		$sql  = "INSERT OR IGNORE INTO adlist";
		$sql  .= " (id,address,enabled,date_added,comment)";
		$sql  .= " VALUES (:id,:address,:enabled,:date_added,:comment);";
	}
	elseif($table === "domain_audit")
	{
		$sql  = "INSERT OR IGNORE INTO domain_audit";
		$sql  .= " (id,domain,date_added)";
		$sql  .= " VALUES (:id,:domain,:date_added);";
	}
	else
	{
		$sql  = "INSERT OR IGNORE INTO ".$table;
		$sql  .= " (id,domain,enabled,date_added,comment)";
		$sql  .= " VALUES (:id,:domain,:enabled,:date_added,:comment);";
	}

	// Prepare SQLite statememt
	$stmt = $db->prepare($sql);

	// Return early if we prepare the SQLite statement
	if(!$stmt)
	{
		echo "Failed to prepare statement for ".$table." table.";
		echo $sql;
		return 0;
	}

	// Loop over rows and inject the lines into the database
	$num = 0;
	foreach($contents as $row)
	{
		$stmt->bindValue(":id", $row["id"], SQLITE3_INTEGER);
		$stmt->bindValue(":date_added", $row["date_added"], SQLITE3_INTEGER);

		if($table === "adlist")
			$stmt->bindValue(":address", $row["address"], SQLITE3_TEXT);
		else
			$stmt->bindValue(":domain", $row["domain"], SQLITE3_TEXT);

		if($table !== "domain_audit")
		{
			$stmt->bindValue(":enabled", $row["enabled"], SQLITE3_INTEGER);
			if(is_null($row["comment"]))
				$type = SQLITE3_NULL;
			else
				$type = SQLITE3_TEXT;
			$stmt->bindValue(":comment", $row["comment"], $type);
		}

		if($stmt->execute() && $stmt->reset() && $stmt->clear())
			$num++;
		else
		{
			$stmt->close();
			return $num;
		}
	}

	// Close database connection and return number or processed rows
	$stmt->close();
	return $num;
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

		$flushtables = isset($_POST["flushtables"]);

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
				$regexlist = process_file(file_get_contents($file),false);
				echo "Processing regex.list (".count($regexlist)." entries)<br>\n";

				$escapedRegexlist = array_map("escapeshellcmd", $regexlist);
				exec("sudo pihole --regex -nr --nuke");
				exec("sudo pihole --regex -q -nr ".implode(" ", $escapedRegexlist));
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

			if(isset($_POST["auditlog"]) && $file->getFilename() === "auditlog.list")
			{
				$auditlog = process_file(file_get_contents($file));
				echo "Processing auditlog.list (".count($auditlog)." entries)<br>\n";
				exec("sudo pihole -a clearaudit");
				exec("sudo pihole -a audit ".implode(" ",$auditlog));
			}

			if(isset($_POST["blacklist"]) && $file->getFilename() === "blacklist.exact.json")
			{
				$num = archive_restore_table($file, "blacklist", $flushtables);
				echo "Processed blacklist (exact) (".$num." entries)<br>\n";
				$importedsomething = true;
			}

			if(isset($_POST["regexlist"]) && $file->getFilename() === "blacklist.regex.json")
			{
				$num = archive_restore_table($file, "regex_blacklist", $flushtables);
				echo "Processed blacklist (regex) (".$num." entries)<br>\n";
				$importedsomething = true;
			}

			if(isset($_POST["whitelist"]) && $file->getFilename() === "whitelist.exact.json")
			{
				$num = archive_restore_table($file, "whitelist", $flushtables);
				echo "Processed whitelist (exact) (".$num." entries)<br>\n";
				$importedsomething = true;
			}

			if(isset($_POST["regex_whitelist"]) && $file->getFilename() === "whitelist.regex.json")
			{
				$num = archive_restore_table($file, "regex_whitelist", $flushtables);
				echo "Processed whitelist (regex) (".$num." entries)<br>\n";
				$importedsomething = true;
			}

			if(isset($_POST["adlist"]) && $file->getFilename() === "adlist.json")
			{
				$num = archive_restore_table($file, "adlist", $flushtables);
				echo "Processed adlist (".$num." entries)<br>\n";
				$importedsomething = true;
			}

			if(isset($_POST["auditlog"]) && $file->getFilename() === "domain_audit.json")
			{
				$num = archive_restore_table($file, "domain_audit", $flushtables);
				echo "Processed domain_audit (".$num." entries)<br>\n";
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

	archive_add_table("whitelist.exact.json", "whitelist");
	archive_add_table("whitelist.regex.json", "regex_whitelist");
	archive_add_table("blacklist.exact.json", "blacklist");
	archive_add_table("blacklist.regex.json", "regex_blacklist");
	archive_add_table("adlists.json", "adlist");
	archive_add_table("domain_audit.json", "domain_audit");
	archive_add_file("/etc/pihole/","setupVars.conf");
	archive_add_directory("/etc/dnsmasq.d/","dnsmasq.d/");

	$archive->compress(Phar::GZ); // Creates a gziped copy
	unlink($archive_file_name); // Unlink original tar file as it is not needed anymore
	$archive_file_name .= ".gz"; // Append ".gz" extension to ".tar"

	header("Content-type: application/gzip");
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
