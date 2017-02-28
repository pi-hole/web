<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license */

$api = true;
require("scripts/pi-hole/php/FTL.php");

if(testFTL() && !isset($_GET["PHP"]))
{
	require("api_FTL.php");
}
else
{
	require("api_PHP.php");
}
?>
