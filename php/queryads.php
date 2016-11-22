<?php
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
    // Remove illegal characters
    $url = filter_var($_GET["domain"], FILTER_SANITIZE_URL);
    // Is this a valid domain?
    if(!filter_var(gethostbyname($url), FILTER_VALIDATE_IP))
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

$proc = popen("sudo pihole -q ".$url, 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
?>
