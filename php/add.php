<?php
function pi_log($message) {
    error_log($message . "\n", 3, '/var/log/lighttpd/pihole_php.log');
}

function log_and_die($message) {
    pi_log($message);
    die($message);
}

if(!isset($_POST['domain'], $_POST['list'], $_POST['token'])) {
    log_and_die("Missing POST variables");
}

$AUTHORIZED_HOSTNAMES = [
    'http://' . $_SERVER['SERVER_ADDR'],
    'http://' . 'pi.hole',
    'http://' . 'localhost'
];

// Check CORS
$CORS_ALLOW_ORIGIN = false;
if(in_array($_SERVER['HTTP_ORIGIN'], $AUTHORIZED_HOSTNAMES)) {
    $CORS_ALLOW_ORIGIN = $_SERVER['HTTP_ORIGIN'];
}

if (!$CORS_ALLOW_ORIGIN) {
    log_and_die("Failed CORS");
}

header("Access-Control-Allow-Origin: $CORS_ALLOW_ORIGIN");

session_start();
// Otherwise probably same origin... out of the scope of CORS

// Check CSRF token
if(!hash_equals($_SESSION['token'], $_POST['token'])) {
    log_and_die("Wrong token");
}


switch($_POST['list']) {
    case "white":
        echo exec("sudo pihole -w -q ${_POST['domain']}");
        break;
    case "black":
        echo exec("sudo pihole -b -q ${_POST['domain']}");
        break;
}

?>
