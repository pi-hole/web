<?php $LOG = '/var/log/lighttpd/error.log';
if (isset($_ENV['piphplog'])) {
    $LOG = getenv('piphplog');
}

function pi_log($message) {
    error_log(date('Y-m-d H:i:s') . ': ' . $message . "\n", 3, $GLOBALS['LOG']);
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

if (isset($_ENV['VIRTUAL_HOST'])) {
    array_push($AUTHORIZED_HOSTNAMES, 'http://' . $_ENV['VIRTUAL_HOST']);
}

// Check CORS
if(isset($_SERVER['HTTP_ORIGIN'])) {
    if(in_array($_SERVER['HTTP_ORIGIN'], $AUTHORIZED_HOSTNAMES)) {
        $CORS_ALLOW_ORIGIN = $_SERVER['HTTP_ORIGIN'];
    } else {
        log_and_die("Failed CORS: " . $_SERVER['HTTP_ORIGIN'] .' vs '. join(',', $AUTHORIZED_HOSTNAMES));
    }
    header("Access-Control-Allow-Origin: $CORS_ALLOW_ORIGIN");
} else {
    pi_log("CORS skipped, unknown HTTP_ORIGIN");
}


// Otherwise probably same origin... out of the scope of CORS
session_start();

// Check CSRF token
if(!isset($_SESSION['token'], $_POST['token']) || !hash_equals($_SESSION['token'], $_POST['token'])) {
    log_and_die("Wrong token");
}
?>
