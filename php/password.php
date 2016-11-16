<?php
    $pwhash =  parse_ini_file("/etc/pihole/setupVars.conf")['WEBPASSWORD'];

    // Test if password is set
    if(strlen($pwhash) > 0)
    {
        // Password set compare with double hash
        if(hash('sha256',hash('sha256',$_POST["pw"])) == $pwhash || $_GET["auth"] == $pwhash)
        {
            // Password (POST) correct or hash (GET) correct
            $auth = true;
            $pwstring = "auth=".$pwhash;
        }
        else
        {
            // Password or hash wrong
            $auth = false;
            $pwstring = "";
        }
    }
    else
    {
        // No password set
        $auth = true;
        $pwstring = "";
    }
?>
