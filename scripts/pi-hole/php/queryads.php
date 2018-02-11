<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

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

// Credit: http://stackoverflow.com/a/4694816/2087442
ini_set("pcre.recursion_limit", 1500);
function is_valid_domain_name($domain_name)
{
    return (preg_match("/^((-|_)*[a-z\d]((-|_)*[a-z\d])*(-|_)*)(\.(-|_)*([a-z\d]((-|_)*[a-z\d])*))*$/i", $domain_name) // Valid chars check
            && preg_match("/^.{1,253}$/", $domain_name) // Overall length check
            && preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)   ); // Length of each label
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

if(isset($_GET["exact"]))
{
    $exact = "-exact";
}
elseif(isset($_GET["bp"]))
{
    $exact = "-bp";
}
else
{
    $exact = "";
}

$proc = popen("sudo pihole -q -adlist ".$url." ".$exact, 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
?>
