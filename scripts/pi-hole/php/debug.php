<?php
ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

require "password.php";
require "auth.php";

if(!$auth) {
    die("Unauthorized");
}

check_cors();

$token = isset($_GET["token"]) ? $_GET["token"] : "";
check_csrf($token);

function echoEvent($datatext) {
    $data = htmlspecialchars($datatext);

    if(!isset($_GET["IE"]))
      echo "data: ".implode("\ndata: ", explode("\n", $data))."\n\n";
    else
      echo $data;
}

if(isset($_GET["upload"]))
{
	$proc = popen("sudo pihole -d -a -w", "r");
}
else
{
	$proc = popen("sudo pihole -d -w", "r");
}
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
?>
