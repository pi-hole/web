<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

function genPersistentLoginToken()
{
    return bin2hex(openssl_random_pseudo_bytes(16));
}

function checkSafetyPersistentLoginToken($token)
{
    // return true only if the token is and alphanumeric string of 32 chars, else return false
    if (ctype_alnum($token) and strlen($token) == 32) {
        return true;
    }
    error_log('Security alert: presented "persistentlogin" token did not pass safety check!', 0);

    return false;
}

function getPathPersistentLoginToken($token)
{
    // safely return the path of the persistentlogin token file, if token is not safe return false
    $session_path = session_save_path();

    if ($session_path and checkSafetyPersistentLoginToken($token)) {
        $token_file = $session_path.'/ph_plt_'.$token.'.txt';

        return $token_file;
    }

    return false;
}

function checkValidityPersistentLoginToken($token)
{
    // return true if persistentlogin token is safe, valid and not expired
    $token_file = getPathPersistentLoginToken($token);

    if ($token_file and file_exists($token_file) and is_readable($token_file)) {
        $t_file = fopen($token_file, 'r');
        if ($t_file) {
            $time = fread($t_file, filesize($token_file));
            fclose($t_file);
            // make sure that token is not expired
            if ($time && intval($time) >= time()) {
                return true;
            }
        }
    }

    return false;
}

function writePersistentLoginToken($token, $time)
{
    $token_file = getPathPersistentLoginToken($token);

    if ($token_file and !file_exists($token_file)) {
        $t_file = fopen($token_file, 'w');
        if ($t_file) {
            // make sure persistent login token file is not readable by other users
            chmod($token_file, 0600);

            fwrite($t_file, $time);
            fclose($t_file);

            return true;
        }
    }

    return false;
}

function logoutPersistentLoginToken($token)
{
    setcookie('persistentlogin', '', 1);

    $token_file = getPathPersistentLoginToken($token);
    if ($token_file and file_exists($token_file) and is_writable($token_file)) {
        unlink($token_file);
    }
}
