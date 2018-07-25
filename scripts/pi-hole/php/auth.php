<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('func.php');
$ERRORLOG = getenv('PHP_ERROR_LOG');
if (empty($ERRORLOG)) {
    $ERRORLOG = '/var/log/lighttpd/error.log';
}
$regexfile = "/etc/pihole/regex.list";

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
    $ipv6 = isset($setupVars["IPV6_ADDRESS"]) ? explode("/", $setupVars["IPV6_ADDRESS"])[0] : $_SERVER['SERVER_ADDR'];

    // Check CORS
    $AUTHORIZED_HOSTNAMES = array(
        $ipv4,
        $ipv6,
        str_replace(array("[","]"), array("",""), $_SERVER["SERVER_NAME"]),
        "pi.hole",
        "localhost"
    );

    # Allow user set virtual hostnames
    $virtual_host = getenv('VIRTUAL_HOST');
    if (! empty($virtual_host))
        array_push($AUTHORIZED_HOSTNAMES, $virtual_host);

    // Since the Host header is easily manipulated, we can only check if it's wrong and can't use it
    // to validate that the client is authorized, only unauthorized.
    $server_host = $_SERVER['HTTP_HOST'];

    // Use parse_url if HTTP_HOST contains a colon (:) to get the host name
    // e.g.
    // https://pi.hole
    // pi.hole:8080
    // However, we don't use parse_url(...) if there is no colon, since it will fail for e.g. "pi.hole"

    // Don't use parse_url for IPv6 addresses, since it does not support them
    // see PHP bug report: https://bugs.php.net/bug.php?id=72811
    if(strpos($server_host, ":") && !strpos($server_host, "[") && !strpos($server_host, "]"))
    {
        $server_host = parse_url($_SERVER['HTTP_HOST'], PHP_URL_HOST);
    }
    // Remove "[" ... "]"
    $server_host = str_replace(array("[","]"), array("",""), $server_host);

    if(isset($_SERVER['HTTP_HOST']) && !in_array($server_host, $AUTHORIZED_HOSTNAMES)) {
        log_and_die("Failed Host Check: " . $server_host .' vs '. join(', ', $AUTHORIZED_HOSTNAMES));
    }

    if(isset($_SERVER['HTTP_ORIGIN'])) {
        $server_origin = $_SERVER['HTTP_ORIGIN'];

        // Detect colon in $_SERVER['HTTP_ORIGIN'] (see comment above)
        if(strpos($server_origin, ":") && !strpos($server_origin, "[") && !strpos($server_origin, "]"))
        {
            $server_origin = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
        }
        // Remove "[", "]","http://", and "https://"
        $server_origin = str_replace(array("[","]","http://","https://"), array("","","",""), $server_origin);

        if(!in_array($server_origin, $AUTHORIZED_HOSTNAMES)) {
            log_and_die("Failed CORS: " . $server_origin .' vs '. join(', ', $AUTHORIZED_HOSTNAMES));
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

    if(!isset($_SESSION['token']) || empty($token) || !hash_equals($_SESSION['token'], $token)) {
        log_and_die("Wrong token");
    }
}

function check_domain() {
    if(isset($_POST['domain'])){
        $domains = preg_split('/\s+/', $_POST['domain']);
        foreach($domains as $domain)
        {
            $validDomain = is_valid_domain_name($domain);
            if(!$validDomain){
                log_and_die(htmlspecialchars($domain. ' is not a valid domain'));
            }
        }
    }
}

function list_verify($type) {
    global $pwhash, $wrongpassword, $auth;
    if(!isset($_POST['domain']) || !isset($_POST['list']) || !(isset($_POST['pw']) || isset($_POST['token']))) {
        log_and_die("Missing POST variables");
    }

    if(isset($_POST['token']))
    {
        check_cors();
        check_csrf($_POST['token']);
    }
    elseif(isset($_POST['pw']))
    {
        require("password.php");
        if($wrongpassword || !$auth)
        {
            log_and_die("Wrong password - ".htmlspecialchars($type)."listing of ".htmlspecialchars($_POST['domain'])." not permitted");
        }
    }
    else
    {
        log_and_die("Not allowed!");
    }

    // Don't check if the added item is a
    // valid domain for regex expressions
    // Regex filters are validated by FTL
    // on import and skipped if invalid
    if($_POST['list'] !== "regex")
    {
        check_domain();
    }
}
?>
