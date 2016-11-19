<?php
    $pwhash =  parse_ini_file("/etc/pihole/setupVars.conf")['WEBPASSWORD'];

    // Test if password is set
    if(strlen($pwhash) > 0)
    {
        // Compare doubly hashes password input with saved hash
        if(isset($_POST["pw"]))
        {
            $postinput = hash('sha256',hash('sha256',$_POST["pw"]));
            if($postinput == $pwhash)
                $auth = true;
        }
        // Compare auth hash with saved hash
        else if (isset($_GET["auth"]))
        {
            if($_GET["auth"] == $pwhash)
                $auth = true;
        }
        else
        {
            // Password or hash wrong
            $auth = false;
            $pwstring = "";
        }
        // If authorized, then set the hash that will be
        // passed through using GET
        if($auth)
            $pwstring = "auth=".$pwhash;
    }
    else
    {
        // No password set
        $auth = true;
        $pwstring = "";
    }
?>
