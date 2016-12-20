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

function check_cors() {
    $setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
    $ipv4 = isset($setupVars["IPV4_ADDRESS"]) ? explode("/", $setupVars["IPV4_ADDRESS"])[0] : $_SERVER['SERVER_ADDR'];

    // Check CORS
    $AUTHORIZED_HOSTNAMES = array(
        'http://' . $ipv4,
        'http://' . $_SERVER['SERVER_NAME'],
        'http://pi.hole',
        'http://localhost'
    );

    # Allow user set virtual hostnames
    $virtual_host = getenv('VIRTUAL_HOST');
    if (! empty($virtual_host))
        array_push($AUTHORIZED_HOSTNAMES, 'http://' . $virtual_host);

    // Since the Host header is easily manipulated, we can only check if it's wrong and can't use it
    // to validate that the client is authorized, only unauthorized.
    if(isset($_SERVER['HTTP_HOST']) && !in_array("http://".$_SERVER['HTTP_HOST'], $AUTHORIZED_HOSTNAMES)) {
        log_and_die("Failed Host Check: " . $_SERVER['HTTP_HOST'] .' vs '. join(', ', $AUTHORIZED_HOSTNAMES));
    }

    if(isset($_SERVER['HTTP_ORIGIN'])) {
        if(!in_array($_SERVER['HTTP_ORIGIN'], $AUTHORIZED_HOSTNAMES)) {
            log_and_die("Failed CORS: " . $_SERVER['HTTP_ORIGIN'] .' vs '. join(', ', $AUTHORIZED_HOSTNAMES));
        }
        header("Access-Control-Allow-Origin: ${_SERVER['HTTP_ORIGIN']}");
    }
    // If there's no HTTP_ORIGIN, CORS should not be used
}

function check_csrf($token) {
    // Check CSRF token
    $session_started = function_exists("session_status") ?
        session_status() == PHP_SESSION_ACTIVE :
        session_id() == "";

    if(!$session_started) {
        session_start();
    }

    // Credit: http://php.net/manual/en/function.hash-equals.php#119576
    if(!function_exists('hash_equals')) {
        function hash_equals($known_string, $user_string) {
            $ret = 0;

            if (strlen($known_string) !== strlen($user_string)) {
                $user_string = $known_string;
                $ret = 1;
            }

            $res = $known_string ^ $user_string;

            for ($i = strlen($res) - 1; $i >= 0; --$i) {
                $ret |= ord($res[$i]);
            }

            return !$ret;
        }
    }

    if(!isset($_SESSION['token']) || empty($token) || !hash_equals($_SESSION['token'], $token)) {
        log_and_die("Wrong token");
    }
}

function check_domain() {
    if(isset($_POST['domain'])){
        $validDomain = is_valid_domain_name($_POST['domain']);
        if(!$validDomain){
            log_and_die($_POST['domain']. ' is not a valid domain');
        }
    }
}
?>
