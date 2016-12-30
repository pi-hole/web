<?php
require('auth.php');

if(!isset($_POST['domain'], $_POST['list']) && !(isset($_POST['pw']) || isset($_POST['token']))) {
	log_and_die("Missing POST variables");
}

if(isset($_POST['token']))
{
	check_cors();
	check_csrf($_POST['token']);
}
elseif(isset($_POST['pw']) && $_POST['list'] == "white")
{
	require("password.php");
	if(strlen($pwhash) == 0)
	{
		log_and_die("No password set - whitelisting with password not supported");
	}
	elseif($wrongpassword)
	{
		log_and_die("Wrong password - whitelisting of ${_POST['domain']} not permitted");
	}
}
else
{
	log_and_die("Not allowed!");
}
check_domain();


switch($_POST['list']) {
	case "white":
		echo exec("sudo pihole -w -q ${_POST['domain']}");
		break;
	case "black":
		echo exec("sudo pihole -b -q ${_POST['domain']}");
		break;
}

?>
