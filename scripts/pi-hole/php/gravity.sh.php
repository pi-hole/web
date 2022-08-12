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

ob_end_flush();
ini_set('output_buffering', '0');
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

function echoEvent($datatext)
{
    // Detect ${OVER} and replace it with something we can safely transmit
    $datatext = str_replace("\r[K", '<------', $datatext);
    $pos = strpos($datatext, '<------');
    // Detect if the ${OVER} line is within this line, e.g.
    // "Pending: String to replace${OVER}Done: String has been replaced"
    // If this is the case, we have to remove everything before ${OVER}
    // and return only the text thereafter
    if ($pos !== false && $pos !== 0) {
        $datatext = substr($datatext, $pos);
    }
    echo 'data: '.implode("\ndata: ", explode("\n", $datatext))."\n\n";
}

$proc = popen('sudo pihole -g', 'r');
while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
