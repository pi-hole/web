<?php
ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

function echoEvent($datatext) {
    if(!isset($_GET["IE"]))
      echo "data: ".implode("\ndata: ", explode("\n", $datatext))."\n\n";
    else
      echo $datatext;
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
