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

// Test if domain is set
if(isset($_GET["domain"]))
{
    // Is this a valid domain?
    $url = $_GET["domain"];
    if(!is_valid_domain_name($url))
    {
        echoEvent("Invalid domain!");
        die();
    }
}
else
{
    echoEvent("No domain provided");
    die();
}

$proc = queryAdsForUrl($url);
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
?>
