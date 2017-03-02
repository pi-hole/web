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

require "func.php";

switch ($listtype) {
	case "white":
		$list = getListContent("white");
		break;

	case "black":
		$list = array_merge(getListContent("black"),getWildcardListContent());
		break;

	default:
		die("Invalid list parameter");
		break;
}


function getListContent($type) {
    $rawList = file_get_contents(checkfile("/etc/pihole/".$type."list.txt"));
    $list = explode("\n", $rawList);

    // Get rid of empty lines
    for($i = sizeof($list)-1; $i >= 0; $i--) {
        if($list[$i] == "")
            unset($list[$i]);
    }

    return $list;

}

function getWildcardListContent() {
    $rawList = file_get_contents(checkfile("/etc/dnsmasq.d/03-pihole-wildcard.conf"));
    $wclist = explode("\n", $rawList);
    $list = [];

    foreach ($wclist as $entry) {
        $expl = explode("/", $entry);
        if(count($expl) == 3)
        {
            array_push($list,"*${expl[1]}");
        }
    }

    return array_unique($list);

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
