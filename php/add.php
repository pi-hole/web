<?php
if(!isset($_POST['domain'], $_POST['list'], $_POST['token']))
    die("Missing POST variables");

// Check CORS
if(isset($_SERVER['HTTP_ORIGIN'])) {
    if ($_SERVER['HTTP_ORIGIN'] == "http://pi.hole" ||
        $_SERVER['HTTP_ORIGIN'] == "http://${_SERVER['SERVER_ADDR']}" ||
        $_SERVER['HTTP_ORIGIN'] == "http://localhost"
    )
        header("Access-Control-Allow-Origin: ${_SERVER['HTTP_ORIGIN']}");
    else
        die("Failed CORS");
}
// Otherwise probably same origin... out of the scope of CORS

// Check CSRF token
session_start();
if(!hash_equals($_SESSION['token'], $_POST['token']))
    die("Wrong token");

switch($_POST['list']) {
    case "white":
        echo exec("sudo pihole -w -q ${_POST['domain']}");
        break;
    case "black":
        echo exec("sudo pihole -b -q ${_POST['domain']}");
        break;
}
