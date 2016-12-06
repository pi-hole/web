<?php
require "password.php";
if(!$auth) die("Not authorized");

ob_end_flush();
ini_set("output_buffering", "0");
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

function echoEvent($datatext) {
    echo "data: ".implode("\ndata: ", explode("\n", $datatext))."\n\n";
}

// echoEvent("***START***");

$proc = popen("sudo pihole -g", 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}

// echoEvent("***END***");
?>
