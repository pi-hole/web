<?php
if(!isset($_GET['list']))
    die();

$type = $_GET['list'];

if($type !== "white" && $type !== "black")
    die("Invalid list parameter");

require "func.php";

$rawList = file_get_contents(checkfile("/etc/pihole/${type}list.txt"));
$list = explode("\n", $rawList);

// Get rid of empty lines
for($i = sizeof($list)-1; $i >= 0; $i--) {
    if($list[$i] == "")
        unset($list[$i]);
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
