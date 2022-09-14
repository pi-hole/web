<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/

require_once 'func.php';

// Start a new PHP session (or continue an existing one)
start_php_session();

// Read setupVars.conf file
$setupVars = parse_ini_file('/etc/pihole/setupVars.conf');
// Try to read password hash from setupVars.conf
if (isset($setupVars['WEBPASSWORD'])) {
    $pwhash = $setupVars['WEBPASSWORD'];
} else {
    $pwhash = '';
}

function verifyPassword($pwhash, $use_api = false)
{
    $validpassword = true;

    // Test if password is set
    if (strlen($pwhash) > 0) {
        // Check for and authorize from persistent cookie
        if (isset($_COOKIE['persistentlogin'])) {
            if (hash_equals($pwhash, $_COOKIE['persistentlogin'])) {
                $_SESSION['auth'] = true;
                // Refresh cookie with new expiry
                // setcookie( $name, $value, $expire, $path, $domain, $secure, $httponly )
                setcookie('persistentlogin', $pwhash, time() + 60 * 60 * 24 * 7, null, null, null, true);
            } else {
                // Invalid cookie
                $_SESSION['auth'] = false;
                setcookie('persistentlogin', '', 1);
            }
        } elseif (isset($_POST['pw'])) {
            // Compare doubly hashes password input with saved hash
            $postinput = hash('sha256', hash('sha256', $_POST['pw']));

            if (hash_equals($pwhash, $postinput)) {
                // Save previously accessed page, before clear the session
                $redirect_url = 'index.php';
                if (isset($_SESSION['prev_url'])) {
                    $redirect_url = $_SESSION['prev_url'];
                }

                // Regenerate session ID to prevent session fixation
                session_regenerate_id();

                // Clear the old session
                $_SESSION = array();

                // Set hash in new session
                $_SESSION['hash'] = $pwhash;

                // Set persistent cookie if selected
                if (isset($_POST['persistentlogin'])) {
                    // setcookie( $name, $value, $expire, $path, $domain, $secure, $httponly )
                    setcookie('persistentlogin', $pwhash, time() + 60 * 60 * 24 * 7, null, null, null, true);
                }

                $_SESSION['auth'] = true;

                // Login successful, redirect the user to the original requested page
                if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_SERVER['SCRIPT_NAME'] === '/admin/login.php') {
                    header('Location: '.$redirect_url);
                    exit;
                }
            } else {
                $_SESSION['auth'] = false;
                $validpassword = false;
            }
        } elseif (isset($_SESSION['hash'])) {
            // Compare auth hash with saved hash
            if (hash_equals($pwhash, $_SESSION['hash'])) {
                $_SESSION['auth'] = true;
            }
        } elseif ($use_api && isset($_GET['auth'])) {
            // API can use the hash to get data without logging in via plain-text password
            if (hash_equals($pwhash, $_GET['auth'])) {
                $_SESSION['auth'] = true;
            }
        } else {
            // Password or hash wrong
            $_SESSION['auth'] = false;
        }
    } else {
        // No password set
        $_SESSION['auth'] = true;
    }

    return $validpassword;
}

$wrongpassword = !verifyPassword($pwhash, isset($api));
$auth = $_SESSION['auth'];
