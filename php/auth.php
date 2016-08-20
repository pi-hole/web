<?php
require('func.php');
$ERRORLOG = getenv('PHP_ERROR_LOG');
if (empty($ERRORLOG)) {
    $ERRORLOG = '/var/log/lighttpd/error.log';
}

function pi_log($message) {
    error_log(date('Y-m-d H:i:s') . ': ' . $message . "\n", 3, $GLOBALS['ERRORLOG']);
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
    'http://pi.hole',
    'http://localhost'
];

# Allow user set virtual hostnames
$virtual_host = getenv('VIRTUAL_HOST');
if (! empty($virtual_host))
    array_push($AUTHORIZED_HOSTNAMES, 'http://' . $virtual_host);

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
    //pi_log("CORS allowed: " . join(',', $AUTHORIZED_HOSTNAMES));
}

// Otherwise probably same origin... out of the scope of CORS
session_start();

// Check CSRF token
if(!isset($_SESSION['token'], $_POST['token']) || !hash_equals($_SESSION['token'], $_POST['token'])) {
    log_and_die("Wrong token");
}

if(isset($_POST['domain'])){
    $validDomain = is_valid_domain_name($_POST['domain']);
    if(!$validDomain){
        log_and_die($_POST['domain']. ' is not a valid domain');
    }
}

?>
