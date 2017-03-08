<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

// Credit: http://stackoverflow.com/a/4694816/2087442
function is_valid_domain_name($domain_name)
{
    return (preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $domain_name) &&  //valid chars check
        preg_match("/^.{1,253}$/", $domain_name) && //overall length check
        preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)); //length of each label
}

function checkfile($filename)
{
    if (is_readable($filename)) {
        return $filename;
    } else {
        // substitute dummy file
        return "/dev/null";
    }
}

function echoEvent($datatext)
{
    if (!isset($_GET["IE"]))
        echo "data: " . implode("\ndata: ", explode("\n", $datatext)) . "\n\n";
    else
        echo $datatext;
}

/**
 * Outputs a json response
 *
 * @param string|array|mixed $msg    Message to output
 * @param bool               $status Response status
 */
function outputJSON($msg, $status = false)
{
    if (!$status && is_string($msg)) {
        pi_log($msg);
    }

    header('Content-Type: application/json');
    echo json_encode([
        'status' => $status,
        'data'   => $msg,
    ]);
    exit;
}

/**
 * This function transforms the php.ini notation for numbers (like '2M') to
 *  an integer (2*1024*1024 in this case)
 *
 * @see http://stackoverflow.com/a/22500394
 *
 * @param $sSize
 * @return int|string
 */
function convertPHPSizeToBytes($sSize)
{
    if (is_numeric($sSize)) {
        return $sSize;
    }
    $sSuffix = substr($sSize, -1);
    $iValue = substr($sSize, 0, -1);
    switch (strtoupper($sSuffix)) {
        case 'P':
            $iValue *= 1024;
        case 'T':
            $iValue *= 1024;
        case 'G':
            $iValue *= 1024;
        case 'M':
            $iValue *= 1024;
        case 'K':
            $iValue *= 1024;
            break;
    }

    return $iValue;
}

/**
 * Returns the server max upload size
 *
 * @return integer
 */
function getMaximumFileUploadSize()
{
    return min(convertPHPSizeToBytes(ini_get('post_max_size')), convertPHPSizeToBytes(ini_get('upload_max_filesize')));
}