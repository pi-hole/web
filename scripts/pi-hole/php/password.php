<?php
    // Start a new PHP session (or continue an existing one)
    session_start();

    // Read setupVars.conf file
    $setupVars = parse_ini_file("/etc/pihole/setupVars.conf");
    // Try to read password hash from setupVars.conf
    if(isset($setupVars['WEBPASSWORD']))
    {
        $pwhash = $setupVars['WEBPASSWORD'];
    }
    else
    {
        $pwhash = "";
    }

    // If the user wants to log out, we free all session variables currently registered
    if(isset($_GET["logout"]))
    {
        session_unset();
    }

    $wrongpassword = false;
    $auth = false;

    // Test if password is set
    if(strlen($pwhash) > 0)
    {
        // Compare doubly hashes password input with saved hash
        if(isset($_POST["pw"]))
        {
            $postinput = hash('sha256',hash('sha256',$_POST["pw"]));
            if($postinput == $pwhash)
            {
                $_SESSION["hash"] = $pwhash;
                $auth = true;
            }
            else
            {
                $wrongpassword = true;
            }
        }
        // Compare auth hash with saved hash
        else if (isset($_SESSION["hash"]))
        {
            if($_SESSION["hash"] == $pwhash)
                $auth = true;
        }
        // API can use the hash to get data without logging in via plain-text password
        else if (isset($api) && isset($_GET["auth"]))
        {
            if($_GET["auth"] == $pwhash)
                $auth = true;
        }
        else
        {
            // Password or hash wrong
            $auth = false;
        }
    }
    else
    {
        // No password set
        $auth = true;
    }
?>
