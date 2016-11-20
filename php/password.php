<?php
    // Start a new PHP session (or continue an existing one)
    session_start();
    $pwhash =  parse_ini_file("/etc/pihole/setupVars.conf")['WEBPASSWORD'];

    if(isset($_GET["logout"]))
        unset($_SESSION["hash"]);

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
        }
        // Compare auth hash with saved hash
        else if (isset($_SESSION["hash"]))
        {
            if($_SESSION["hash"] == $pwhash)
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
