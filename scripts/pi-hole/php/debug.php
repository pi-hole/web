<?php

ob_end_flush();
ini_set('output_buffering', '0');
ob_implicit_flush(true);
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

require 'password.php';
require 'auth.php';

if (!$auth) {
    exit('Unauthorized');
}

check_cors();

$token = isset($_GET['token']) ? $_GET['token'] : '';
check_csrf($token);

function echoEvent($datatext)
{
    $ANSIcolors = array(
        chr(27).'[1;91m' => '<span class="log-red">',
        chr(27).'[1;32m' => '<span class="log-green">',
        chr(27).'[1;33m' => '<span class="log-yellow">',
        chr(27).'[1;34m' => '<span class="log-blue">',
        chr(27).'[1;35m' => '<span class="log-purple">',
        chr(27).'[1;36m' => '<span class="log-cyan">',

        chr(27).'[90m' => '<span class="log-gray">',
        chr(27).'[91m' => '<span class="log-red">',
        chr(27).'[32m' => '<span class="log-green">',
        chr(27).'[33m' => '<span class="log-yellow">',
        chr(27).'[94m' => '<span class="log-blue">',
        chr(27).'[95m' => '<span class="log-purple">',
        chr(27).'[96m' => '<span class="log-cyan">',

        chr(27).'[1m' => '<span class="text-bold">',
        chr(27).'[4m' => '<span class="text-underline">',

        chr(27).'[0m' => '</span>',
    );

    $data = str_replace(array_keys($ANSIcolors), $ANSIcolors, htmlspecialchars($datatext));

    if (!isset($_GET['IE'])) {
        echo 'data: '.implode("\ndata: ", explode("\n", $data))."\n\n";
    } else {
        echo $data;
    }
}

// Execute "pihole" using Web option
$command = 'export TERM=dumb && sudo pihole -d -w';

// Add auto-upload option
if (isset($_GET['upload'])) {
    $command .= ' -a';
}

// Execute database integrity_check
if (isset($_GET['dbcheck'])) {
    $command .= ' -c';
}

$proc = popen($command, 'r');

while (!feof($proc)) {
    echoEvent(fread($proc, 4096));
}
