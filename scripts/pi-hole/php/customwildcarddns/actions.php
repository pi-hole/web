<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
*/
/* author DjoSmer */

require_once '../auth.php';
require_once 'CustomWildcardDNS.php';

// Authentication checks
if (!isset($api)) {
    if (isset($_POST['token'])) {
        check_cors();
        check_csrf($_POST['token']);
    } else {
        log_and_die('Not allowed (login session invalid or expired, please relogin on the Pi-hole dashboard)!');
    }
}

function echoCustomWildcardDNSEntries()
{
    $customWildcardDNS = Custom\WildcardDNS::getInstance();
    $entries = $customWildcardDNS->getEntries();

    $data = array();
    foreach ($entries as $entry) {
        $data[] = (array)$entry;
    }

    return array('data' => $data);
}

function addCustomWildcardDNSEntry()
{
    $name = isset($_REQUEST['name']) ? $_REQUEST['name'] : '';
    $domain = isset($_REQUEST['domain']) ? $_REQUEST['domain'] : '';
    $ip = isset($_REQUEST['ip']) ? $_REQUEST['ip'] : '';
    $reload = isset($_REQUEST['reload']) ? $_REQUEST['reload'] : true;

    $customWildcardDNS = Custom\WildcardDNS::getInstance();
    return $customWildcardDNS->addEntry($name, $domain, $ip, $reload);
}

function deleteCustomWildcardDNSEntry()
{
    $name = isset($_REQUEST['name']) ? $_REQUEST['name'] : '';
    $domain = isset($_REQUEST['domain']) ? $_REQUEST['domain'] : '';

    $customWildcardDNS = Custom\WildcardDNS::getInstance();
    return $customWildcardDNS->deleteEntry($name, $domain);
}

function updateCustomWildcardDNSEntry()
{
    $name = isset($_REQUEST['name']) ? $_REQUEST['name'] : '';
    $domain = isset($_REQUEST['domain']) ? $_REQUEST['domain'] : '';
    $ip = isset($_REQUEST['ip']) ? $_REQUEST['ip'] : '';
    $enabled = isset($_REQUEST['enabled']) ? $_REQUEST['enabled'] : '';

    $customWildcardDNS = Custom\WildcardDNS::getInstance();
    return $customWildcardDNS->updateEntry($name, $domain, $ip, $enabled);
}

switch ($_POST['action']) {
    case 'get':
        echo json_encode(echoCustomWildcardDNSEntries());
        break;

    case 'add':
        echo json_encode(addCustomWildcardDNSEntry());
        break;

    case 'delete':
        echo json_encode(deleteCustomWildcardDNSEntry());
        break;

    case 'update':
        echo json_encode(updateCustomWildcardDNSEntry());
        break;

    default:
        exit('Wrong action');
}
