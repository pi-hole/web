<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license
*/

$api = true;
require_once 'scripts/pi-hole/php/password.php';
require_once 'scripts/pi-hole/php/FTL.php';
require_once 'scripts/pi-hole/php/database.php';
require_once 'scripts/pi-hole/php/auth.php';
check_cors();

$data = array();

// Common API functions
if (isset($_GET['enable']) && $auth) {
    if (isset($_GET['auth'])) {
        if ($_GET['auth'] !== $pwhash) {
            exit('Not authorized!');
        }
    } else {
        // Skip token validation if explicit auth string is given
        check_csrf($_GET['token']);
    }
    pihole_execute('enable');
    $data = array_merge($data, array('status' => 'enabled'));
    if (file_exists('../custom_disable_timer')) {
        unlink('../custom_disable_timer');
    }
} elseif (isset($_GET['disable']) && $auth) {
    if (isset($_GET['auth'])) {
        if ($_GET['auth'] !== $pwhash) {
            exit('Not authorized!');
        }
    } else {
        // Skip token validation if explicit auth string is given
        check_csrf($_GET['token']);
    }
    $disable = intval($_GET['disable']);
    // intval returns the integer value on success, or 0 on failure
    if ($disable > 0) {
        $timestamp = time();
        pihole_execute('disable '.$disable.'s');
        file_put_contents('../custom_disable_timer', ($timestamp + $disable) * 1000);
    } else {
        pihole_execute('disable');
        if (file_exists('../custom_disable_timer')) {
            unlink('../custom_disable_timer');
        }
    }
    $data = array_merge($data, array('status' => 'disabled'));
} elseif (isset($_GET['versions'])) {
    // Determine if updates are available for Pi-hole
    // using the same script that we use for the footer
    // on the dashboard (update notifications are
    // suppressed if on development branches)
    require 'scripts/pi-hole/php/update_checker.php';
    $updates = array('core_update' => $core_update,
        'web_update' => $web_update,
        'FTL_update' => $FTL_update, );
    $current = array('core_current' => $core_current,
        'web_current' => $web_current,
        'FTL_current' => $FTL_current, );
    $latest = array('core_latest' => $core_latest,
        'web_latest' => $web_latest,
        'FTL_latest' => $FTL_latest, );
    $branches = array('core_branch' => $core_branch,
        'web_branch' => $web_branch,
        'FTL_branch' => $FTL_branch, );
    if (isset($versions['DOCKER_VERSION'])) {
        // Docker info is available only inside containers
        $updates['docker_update'] = $docker_update;
        $current['docker_current'] = $docker_current;
        $latest['docker_latest'] = $docker_latest;
    }

    $data = array_merge($data, $updates);
    $data = array_merge($data, $current);
    $data = array_merge($data, $latest);
    $data = array_merge($data, $branches);
} elseif (isset($_GET['setTempUnit'])) {
    $unit = strtolower($_GET['setTempUnit']);
    if ($unit == 'c' || $unit == 'f' || $unit == 'k') {
        pihole_execute('-a -'.$unit);
        $result = 'success';
    } else {
        // invalid unit
        $result = 'error';
    }

    $data = array_merge($data, array('result' => $result));
} elseif (isset($_GET['list'])) {
    if (!$auth) {
        exit('Not authorized!');
    }

    if (!isset($_GET['list'])) {
        exit('List has not been specified.');
    }

    switch ($_GET['list']) {
        case 'black':
            $_POST['type'] = LISTTYPE_BLACKLIST;

            break;

        case 'regex_black':
            $_POST['type'] = LISTTYPE_REGEX_BLACKLIST;

            break;

        case 'white':
            $_POST['type'] = LISTTYPE_WHITELIST;

            break;

        case 'regex_white':
            $_POST['type'] = LISTTYPE_REGEX_WHITELIST;

            break;

        default:
            exit('Invalid list [supported: black, regex_black, white, regex_white]');
    }

    if (isset($_GET['add'])) {
        // Set POST parameters and invoke script to add domain to list
        $_POST['domain'] = $_GET['add'];
        $_POST['action'] = 'add_domain';
        require 'scripts/pi-hole/php/groups.php';
    } elseif (isset($_GET['sub'])) {
        // Set POST parameters and invoke script to remove domain from list
        $_POST['domain'] = $_GET['sub'];
        $_POST['action'] = 'delete_domain_string';
        require 'scripts/pi-hole/php/groups.php';
    } else {
        // Set POST parameters and invoke script to get all domains
        $_POST['action'] = 'get_domains';
        require 'scripts/pi-hole/php/groups.php';
    }

    return;
} elseif (isset($_GET['customdns']) && $auth) {
    if (isset($_GET['auth'])) {
        if ($_GET['auth'] !== $pwhash) {
            exit('Not authorized!');
        }
    } else {
        // Skip token validation if explicit auth string is given
        check_csrf($_GET['token']);
    }

    switch ($_GET['action']) {
        case 'get':
            $data = echoCustomDNSEntries();

            break;

        case 'add':
            $data = addCustomDNSEntry();

            break;

        case 'delete':
            $data = deleteCustomDNSEntry();

            break;

        default:
            exit('Wrong action');
    }
} elseif (isset($_GET['customcname']) && $auth) {
    if (isset($_GET['auth'])) {
        if ($_GET['auth'] !== $pwhash) {
            exit('Not authorized!');
        }
    } else {
        // Skip token validation if explicit auth string is given
        check_csrf($_GET['token']);
    }

    switch ($_GET['action']) {
        case 'get':
            $data = echoCustomCNAMEEntries();

            break;

        case 'add':
            $data = addCustomCNAMEEntry();

            break;

        case 'delete':
            $data = deleteCustomCNAMEEntry();

            break;

        default:
            exit('Wrong action');
    }
}

// Other API functions
require 'api_FTL.php';

header('Content-type: application/json');
if (isset($_GET['jsonForceObject'])) {
    echo json_encode($data, JSON_FORCE_OBJECT);
} else {
    echo json_encode($data);
}
