<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('func.php');
require_once('authentication.php');

// Start a new PHP session (or continue an existing one)
// Prevents javascript XSS attacks aimed to steal the session ID
ini_set('session.cookie_httponly', 1);
// Prevent Session ID from being passed through  URLs
ini_set('session.use_only_cookies', 1);
session_start();

// If the user wants to log out, we free all session variables currently registered
// and delete any persistent cookie.
if(isset($_GET["logout"]))
{
    session_unset();
    setcookie('persistentlogin', '', 1);
    header('Location: index.php');
    exit();
}

$setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
$authentication = new Authentication($setupVars);
$status = $authentication->authenticate();
$ldapAuth = $status->ldapAuth;
$wrongpassword = $status->wrongPassword;
$auth = $status->authenticated;
$pwhash = $authentication->passwordHash();
$authEnabled = $authentication->isAuthEnabled();

?>
