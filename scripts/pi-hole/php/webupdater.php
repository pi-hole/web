<?php
if(isset($_GET["getlog"]))
{
    echo(file_get_contents("/etc/pihole/webupdate.log"));
}
else if(isset($_GET["startupdate"]))
{
    exec("sudo pihole -up -webbased");
}
?>
