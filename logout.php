<?php

require_once 'scripts/pi-hole/php/persistentlogin_token.php';

// If the user wants to log out, we free all session variables currently registered
// and delete any persistent cookie.
session_start();
session_unset();

if (isset($_COOKIE['persistentlogin'])) {
    logoutPersistentLoginToken($_COOKIE['persistentlogin']);
}

header('Location: login.php');
exit;
