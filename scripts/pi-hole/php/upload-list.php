<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once 'auth.php';

if (!in_array($_POST['list'], ['black', 'white'])) {
    outputJSON('List type not supported.');
}

$listFilePath = '/etc/pihole/' . $_POST['list'] . 'list.txt';

// All of the verification for list editing
check_cors();
check_csrf($_POST['token']);

// File validations
if (!isset($_FILES['file']) || $_FILES['file']['error'] > 0) {
    outputJSON('An error ocurred when uploading.');
}

if ($_FILES['file']['size'] > getMaximumFileUploadSize()) {
    outputJSON('File uploaded exceeds maximum upload size.');
}

$totals = [
    'added_domains'      => 0,
    'ignored_domains'    => 0,
    'duplicated_domains' => 0,
];

$fileContent = file_get_contents($listFilePath);
$listOfDomains = array_flip(explode(PHP_EOL, $fileContent));

$handle = fopen($_FILES['file']['tmp_name'], "r");
if ($handle) {
    while (($line = fgets($handle)) !== false) {
        $line = explode(' ', trim($line));
        $url = end($line);

        if (strpos($url, 'http://') !== 0 && strpos($url, 'https://') !== 0) {
            $url = 'http://' . $url;
        }

        $parse = parse_url($url);
        $domain = $parse['host'];

        if (!is_valid_domain_name($domain)) {
            $totals['ignored_domains']++;
            pi_log(htmlspecialchars($domain . ' is not a valid domain'));
            continue;
        }

        if (isset($listOfDomains[$domain])) {
            $totals['duplicated_domains']++;
            continue;
        }

        $listOfDomains[$domain] = true;
        $totals['added_domains']++;
    }

    fclose($handle);

    if (isset($listOfDomains['http'])) {
        unset($listOfDomains['http']);
    }
    $listOfDomains = array_keys($listOfDomains);

    $fileLocation = tempnam(sys_get_temp_dir(), 'pihole.import.') . '.sh';
    $fileContent = '';
    foreach ($listOfDomains as $domain) {
        switch ($_POST['list']) {
            case "white":
                $fileContent .= "sudo pihole -w -q $domain;" . PHP_EOL;
                break;
            case "black":
                $fileContent .= "sudo pihole -b -q $domain;" . PHP_EOL;
                break;
        }
    }

    if (file_put_contents($fileLocation, $fileContent)) {
        exec("nohup sh $fileLocation > /dev/null &");

        outputJSON(sprintf(
            "File uploaded! %d domains added, %d duplicated domains and %d domains ignored. \n\nThe file is being processed and soon you will see the domains below.",
            $totals['added_domains'], $totals['duplicated_domains'], $totals['ignored_domains']
        ), true);
    }

    outputJSON('An error ocurred while executing the commands to add the domain list.');
} else {
    outputJSON('An error ocurred while reading the file.');
}
