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

function check_cors($strict=false) {
    // Check CORS
    $AUTHORIZED_HOSTNAMES = array(
        'http://' . $_SERVER['SERVER_ADDR'],
        'http://pi.hole',
        'http://localhost'
    );

    # Allow user set virtual hostnames
    $virtual_host = getenv('VIRTUAL_HOST');
    if (! empty($virtual_host))
        array_push($AUTHORIZED_HOSTNAMES, 'http://' . $virtual_host);

    if(isset($_SERVER['HTTP_HOST'])) {
        if(!in_array('http://'.$_SERVER['HTTP_HOST'], $AUTHORIZED_HOSTNAMES)) {
            log_and_die("Failed CORS: http://" . $_SERVER['HTTP_HOST'] . ' vs ' . join(',', $AUTHORIZED_HOSTNAMES));
        }
        header("Access-Control-Allow-Origin: ${_SERVER['HTTP_HOST']}");
    }
    else if($strict) {
        log_and_die("Failed CORS: Unknown HTTP_HOST (Strict flag enabled)");
    }
    else {
        pi_log("HTTP_HOST check skipped, unknown HTTP_HOST");
    }

    if(isset($_SERVER['HTTP_ORIGIN'])) {
        if(!in_array($_SERVER['HTTP_ORIGIN'], $AUTHORIZED_HOSTNAMES)) {
            log_and_die("Failed CORS: " . $_SERVER['HTTP_ORIGIN'] .' vs '. join(',', $AUTHORIZED_HOSTNAMES));

        }
        header("Access-Control-Allow-Origin: ${_SERVER['HTTP_ORIGIN']}");
    }
    else if($strict) {
        log_and_die("Failed CORS: Unknown HTTP_ORIGIN (Strict flag enabled)");
    }
    else {
        pi_log("CORS skipped, unknown HTTP_ORIGIN");
    }
}

function check_csrf() {
    // Check CSRF token
    session_start();

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

    if(!isset($_SESSION['token'], $_POST['token']) || !hash_equals($_SESSION['token'], $_POST['token'])) {
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
