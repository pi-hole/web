<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */ ?>

<?php
if(!isset($_GET['list']))
    die("Missing parameter");

$listtype = $_GET['list'];

$basedir = "/etc/pihole/";

require "func.php";

switch ($listtype) {
    case "white":
        $list = array(getListContent("whitelist.txt"));
        break;

    case "black":
        $exact = getListContent("blacklist.txt");
        $regex = getListContent("regex.list");
        $list = array($exact, $regex);
        break;

    default:
        die("Invalid list parameter");
        break;
}


function getListContent($listname) {
    global $basedir;
    $rawList = file_get_contents(checkfile($basedir.$listname));
    $list = explode("\n", $rawList);

    // Get rid of empty lines
    for($i = sizeof($list)-1; $i >= 0; $i--) {
        if(strlen($list[$i]) < 1)
            unset($list[$i]);
    }

    // Re-index list after possible unset() activity
    $newlist = array_values($list);

    return $newlist;

}

function filterArray(&$inArray) {
    $outArray = array();
    foreach ($inArray as $key=>$value) {
        if (is_array($value)) {
            $outArray[htmlspecialchars($key)] = filterArray($value);
        } else {
            $outArray[htmlspecialchars($key)] = htmlspecialchars($value);
        }
    }
    return $outArray;
}

// Protect against XSS attacks
$list = filterArray($list);
echo json_encode(array_values($list));
