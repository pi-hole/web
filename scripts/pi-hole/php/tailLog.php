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

function formatLine($line)
{
    $txt = preg_replace('/ dnsmasq\\[[0-9]*\\]/', '', htmlspecialchars($line));

    if (strpos($line, 'blacklisted') || strpos($line, 'gravity blocked')) {
        $txt = '<b class="log-red">'.$txt.'</b>';
    } elseif (strpos($line, 'query[A') || strpos($line, 'query[DHCP')) {
        $txt = '<b>'.$txt.'</b>';
    } else {
        $txt = '<span class="text-muted">'.$txt.'</span>';
    }

    return $txt;
}

// Not using SplFileObject here, since direct
// usage of f-streams will be much faster for
// files as large as the pihole.log
if (isset($_GET['FTL'])) {
    $file = fopen('/var/log/pihole/FTL.log', 'r');
} else {
    $file = fopen('/var/log/pihole/pihole.log', 'r');
}

if (!$file) {
    exit(json_encode(array('offset' => 0, 'lines' => array("Failed to open log file. Check permissions!\n"))));
}

if (isset($_GET['offset'])) {
    $offset = intval($_GET['offset']);
    if ($offset > 0) {
        // If offset is grater then current file end it means the file was truncated (log rotation)
        fseek($file, 0, SEEK_END);
        if ($offset > ftell($file)) {
            $offset = 0;
        }

        // Seeks on the file pointer where we want to continue reading is known
        fseek($file, $offset);

        $lines = array();
        while (!feof($file)) {
            array_push($lines, formatLine(fgets($file)));
        }

        exit(json_encode(array('offset' => ftell($file), 'lines' => $lines)));
    }
}

// Locate the current position of the file read/write pointer
fseek($file, -1, SEEK_END);

// Add one to skip the very last "\n" in the log file
exit(json_encode(array('offset' => ftell($file) + 1)));
