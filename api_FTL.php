<?php
/*   Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license
*/

if (!isset($api)) {
    exit('Direct call to api_FTL.php is not allowed!');
}

if (isset($_GET['type'])) {
    $data['type'] = 'FTL';
}

if (isset($_GET['version'])) {
    $data['version'] = 3;
}

if (isset($_GET['status'])) {
    $return = callFTLAPI('stats');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        if (in_array('status enabled', $return)) {
            $data = array_merge($data, array('status' => 'enabled'));
        } else {
            $data = array_merge($data, array('status' => 'disabled'));
        }
    }
}

if (isset($_GET['summary']) || isset($_GET['summaryRaw']) || !count($_GET)) {
    require_once 'scripts/pi-hole/php/gravity.php';

    $return = callFTLAPI('stats');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $stats = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);

            if ($tmp[0] === 'domains_being_blocked' && !is_numeric($tmp[1]) || $tmp[0] === 'status') {
                // Expect string response
                $stats[$tmp[0]] = $tmp[1];
            } elseif (isset($_GET['summary'])) {
                // "summary" expects a formmated string response
                if ($tmp[0] !== 'ads_percentage_today') {
                    $stats[$tmp[0]] = number_format($tmp[1]);
                } else {
                    $stats[$tmp[0]] = number_format($tmp[1], 1, '.', '');
                }
            } else {
                // Expect float response
                $stats[$tmp[0]] = floatval($tmp[1]);
            }
        }
        $stats['gravity_last_updated'] = gravity_last_update(true);
        $data = array_merge($data, $stats);
    }
}

if (isset($_GET['getMaxlogage']) && $auth) {
    $return = callFTLAPI('maxlogage');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        // Convert seconds to hours and rounds to one decimal place.
        $ret = round(intval($return[0]) / 3600, 1);
        // Return 24h if value is 0, empty, null or non numeric.
        $ret = $ret ?: 24;

        $data = array_merge($data, array('maxlogage' => $ret));
    }
}

if (isset($_GET['overTimeData10mins'])) {
    $return = callFTLAPI('overTime');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $domains_over_time = array();
        $ads_over_time = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $domains_over_time[intval($tmp[0])] = intval($tmp[1]);
            $ads_over_time[intval($tmp[0])] = intval($tmp[2]);
        }

        $result = array(
            'domains_over_time' => $domains_over_time,
            'ads_over_time' => $ads_over_time,
        );

        $data = array_merge($data, $result);
    }
}

if (isset($_GET['topItems']) && $auth) {
    if ($_GET['topItems'] === 'audit') {
        $return = callFTLAPI('top-domains for audit');
    } elseif (is_numeric($_GET['topItems'])) {
        $return = callFTLAPI('top-domains ('.$_GET['topItems'].')');
    } else {
        $return = callFTLAPI('top-domains');
    }

    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $top_queries = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            if (count($tmp) == 2) {
                $tmp[2] = '';
            }
            $domain = utf8_encode($tmp[2]);
            $top_queries[$domain] = intval($tmp[1]);
        }
    }

    if ($_GET['topItems'] === 'audit') {
        $return = callFTLAPI('top-ads for audit');
    } elseif (is_numeric($_GET['topItems'])) {
        $return = callFTLAPI('top-ads ('.$_GET['topItems'].')');
    } else {
        $return = callFTLAPI('top-ads');
    }

    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $top_ads = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $domain = utf8_encode($tmp[2]);
            if (count($tmp) > 3) {
                $top_ads[$domain.' ('.$tmp[3].')'] = intval($tmp[1]);
            } else {
                $top_ads[$domain] = intval($tmp[1]);
            }
        }

        $result = array(
            'top_queries' => $top_queries,
            'top_ads' => $top_ads,
        );

        $data = array_merge($data, $result);
    }
}

if ((isset($_GET['topClients']) || isset($_GET['getQuerySources'])) && $auth) {
    if (isset($_GET['topClients'])) {
        $number = $_GET['topClients'];
    } elseif (isset($_GET['getQuerySources'])) {
        $number = $_GET['getQuerySources'];
    }

    if (is_numeric($number)) {
        $return = callFTLAPI('top-clients ('.$number.')');
    } else {
        $return = callFTLAPI('top-clients');
    }
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $top_clients = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $clientip = utf8_encode($tmp[2]);
            if (count($tmp) > 3 && strlen($tmp[3]) > 0) {
                $clientname = utf8_encode($tmp[3]);
                $top_clients[$clientname.'|'.$clientip] = intval($tmp[1]);
            } else {
                $top_clients[$clientip] = intval($tmp[1]);
            }
        }

        $result = array('top_sources' => $top_clients);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['topClientsBlocked']) && $auth) {
    if (isset($_GET['topClientsBlocked'])) {
        $number = $_GET['topClientsBlocked'];
    }

    if (is_numeric($number)) {
        $return = callFTLAPI('top-clients blocked ('.$number.')');
    } else {
        $return = callFTLAPI('top-clients blocked');
    }
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $top_clients = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $clientip = utf8_encode($tmp[2]);
            if (count($tmp) > 3 && strlen($tmp[3]) > 0) {
                $clientname = utf8_encode($tmp[3]);
                $top_clients[$clientname.'|'.$clientip] = intval($tmp[1]);
            } else {
                $top_clients[$clientip] = intval($tmp[1]);
            }
        }

        $result = array('top_sources_blocked' => $top_clients);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['getForwardDestinations']) && $auth) {
    if ($_GET['getForwardDestinations'] === 'unsorted') {
        $return = callFTLAPI('forward-dest unsorted');
    } else {
        $return = callFTLAPI('forward-dest');
    }
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $forward_dest = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $forwardip = utf8_encode($tmp[2]);
            if (count($tmp) > 3 && strlen($tmp[3]) > 0) {
                $forwardname = utf8_encode($tmp[3]);
                $forward_dest[$forwardname.'|'.$forwardip] = floatval($tmp[1]);
            } else {
                $forward_dest[$forwardip] = floatval($tmp[1]);
            }
        }

        $result = array('forward_destinations' => $forward_dest);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['getQueryTypes']) && $auth) {
    $return = callFTLAPI('querytypes');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $querytypes = array();
        foreach ($return as $ret) {
            $tmp = explode(': ', $ret);
            // Reply cannot contain non-ASCII characters
            $querytypes[$tmp[0]] = floatval($tmp[1]);
        }

        $result = array('querytypes' => $querytypes);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['getCacheInfo']) && $auth) {
    $return = callFTLAPI('cacheinfo');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $cacheinfo = array();
        foreach ($return as $ret) {
            $tmp = explode(': ', $ret);
            // Reply cannot contain non-ASCII characters
            $cacheinfo[$tmp[0]] = floatval($tmp[1]);
        }

        $result = array('cacheinfo' => $cacheinfo);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['getAllQueries']) && $auth) {
    if (isset($_GET['from'], $_GET['until'])) {
        // Get limited time interval
        $return = callFTLAPI('getallqueries-time '.$_GET['from'].' '.$_GET['until']);
    } elseif (isset($_GET['domain'])) {
        // Get specific domain only
        $return = callFTLAPI('getallqueries-domain '.$_GET['domain']);
    } elseif (isset($_GET['client']) && (isset($_GET['type']) && $_GET['type'] === 'blocked')) {
        // Get specific client only
        $return = callFTLAPI('getallqueries-client-blocked '.$_GET['client']);
    } elseif (isset($_GET['client'])) {
        // Get specific client only
        $return = callFTLAPI('getallqueries-client '.$_GET['client']);
    } elseif (isset($_GET['querytype'])) {
        // Get specific query type only
        $return = callFTLAPI('getallqueries-qtype '.$_GET['querytype']);
    } elseif (isset($_GET['forwarddest'])) {
        // Get specific forward destination only
        $return = callFTLAPI('getallqueries-forward '.$_GET['forwarddest']);
    } elseif (is_numeric($_GET['getAllQueries'])) {
        $return = callFTLAPI('getallqueries ('.$_GET['getAllQueries'].')');
    } else {
        // Get all queries
        $return = callFTLAPI('getallqueries');
    }

    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        // Set the header
        header('Content-type: application/json');

        // Start the JSON string
        echo '{"data":[';
        $first = true;

        foreach ($return as $line) {
            // Insert a comma before the next record (except on the first one)
            if (!$first) {
                echo ',';
            } else {
                $first = false;
            }

            $row = str_getcsv($line, ' ');
            // UTF-8 encode domain
            $domain = utf8_encode(str_replace('~', ' ', $row[2]));
            // UTF-8 encode client host name
            $client = utf8_encode($row[3]);

            // Insert into array and output it in JSON format
            // array:         time      type     domain  client   status  dnssecStatus    reply    response_time   CNAMEDomain regexID  upstream destination    EDE
            echo json_encode(array($row[0], $row[1], $domain, $client, $row[4],  $row[5],     $row[6],     $row[7],      $row[8],   $row[9],     $row[10],         $row[11]));
        }
        // Finish the JSON string
        echo ']}';
        // exit at the end
        exit;
    }
}

if (isset($_GET['recentBlocked']) && $auth) {
    exit(utf8_encode(callFTLAPI('recentBlocked')[0]));
    unset($data);
}

if (isset($_GET['getForwardDestinationNames']) && $auth) {
    $return = callFTLAPI('forward-names');

    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $forward_dest = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $forwardip = utf8_encode($tmp[2]);
            if (count($tmp) > 3) {
                $forwardname = utf8_encode($tmp[3]);
                $forward_dest[$forwardname.'|'.$forwardip] = floatval($tmp[1]);
            } else {
                $forward_dest[$forwardip] = floatval($tmp[1]);
            }
        }

        $result = array('forward_destinations' => $forward_dest);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['overTimeDataQueryTypes']) && $auth) {
    $return = callFTLAPI('QueryTypesoverTime');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $over_time = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            for ($i = 0; $i < count($tmp) - 1; ++$i) {
                $over_time[intval($tmp[0])][$i] = floatval($tmp[$i + 1]);
            }
        }
        $result = array('over_time' => $over_time);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['getClientNames']) && $auth) {
    $return = callFTLAPI('client-names');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $client_names = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            $client_names[] = array(
                'name' => utf8_encode($tmp[0]),
                'ip' => utf8_encode($tmp[1]),
            );
        }

        $result = array('clients' => $client_names);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['overTimeDataClients']) && $auth) {
    $return = callFTLAPI('ClientsoverTime');

    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $over_time = array();
        foreach ($return as $line) {
            $tmp = explode(' ', $line);
            for ($i = 0; $i < count($tmp) - 1; ++$i) {
                $over_time[intval($tmp[0])][$i] = floatval($tmp[$i + 1]);
            }
        }
        $result = array('over_time' => $over_time);
        $data = array_merge($data, $result);
    }
}

if (isset($_GET['delete_lease']) && $auth) {
    $return = callFTLAPI('delete-lease '.$_GET['delete_lease']);
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $data['delete_lease'] = $return[0];
    }
}

if (isset($_GET['dns-port']) && $auth) {
    $return = callFTLAPI('dns-port');
    if (array_key_exists('FTLnotrunning', $return)) {
        $data = array('FTLnotrunning' => true);
    } else {
        $data['dns-port'] = $return[0];
    }
}
