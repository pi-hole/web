<?php

// If the user wants to log out, we free all session variables currently registered
// and delete any persistent cookie.
session_start();
session_unset();
setcookie('persistentlogin', '', 1);
header('Location: login.php');
exit;
