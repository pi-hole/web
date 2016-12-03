<?php
require('system.php');
require('auth.php');

modifyList($_POST['list'], "delete", $_POST['domain']);

?>
