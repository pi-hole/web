<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require 'password.php';
if (!$auth) {
    exit('Not authorized');
}

while (ob_get_level() > 0) {
    ob_end_flush();
}

require_once 'func.php';
ini_set('output_buffering', '0');
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

function echoEvent($datatext, $url = '')
{
    if (!isset($_GET['IE'])) {
        $txt = 'data:'.implode("\ndata:", explode("\n", $datatext))."\n\n";
    } else {
        $txt = $datatext;
    }

    $txt = str_replace('This can be overridden using the -all option', 'Select the checkbox to remove the limitation', $txt);
    $txt = str_replace($url, '<strong class="text-blue">'.$url.'</strong>', $txt);

    echo $txt;
}

// Test if domain is set
if (isset($_GET['domain'])) {
    // Is this a valid domain?
    // Convert domain name to IDNA ASCII form for international domains
    $url = convertUnicodeToIDNA($_GET['domain']);
    if (!validDomain($url)) {
        echoEvent(htmlentities($url).' is an invalid domain!', $url);

        exit;
    }
} else {
    echoEvent('No domain provided');

    exit;
}

$options = '';
if (isset($_GET['exact'])) {
    $options .= ' -exact';
}

if (isset($_GET['showall'])) {
    $options .= ' -all';
}

$proc = popen('sudo pihole -q '.$url.$options, 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096), $url);
}
