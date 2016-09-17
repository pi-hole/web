<?php
function getLogQueries() {
        $allQueries = array("data" => array());
        $log = readInSyslog();
        $dns_queries = getLogQueriesAll($log);

        foreach ($dns_queries as $query) {
            $time = date_create(substr($query, 0, 16));
            $exploded = explode(" ", trim($query));
            $tmp = $exploded[count($exploded)-4];
	    $tmp2 = $exploded[count($exploded)-3];

            if (substr($tmp, 0, 1) == "D"){
		//substring of explodedcountexploded, fourth from the back
		//substring is count forward five spaces, then all the way 
		//until the second to last character (negative one character)
		//second to last character before the space (exploded)
              $type = substr($exploded[count($exploded)-4], 0, -5);
	      $domain = $exploded[count($exploded)-2];
              $client = $exploded[count($exploded)-1];
              $status = "OK";
            }

	    elseif (substr($tmp, 0, 1) == "d"){
              $type = substr($exploded[count($exploded)-3], 0, -5);
              $domain = $exploded[count($exploded)-1];
              $client = $exploded[count($exploded)-1];
              //$client = ""
	      $status = "OK";
            }	   

            if ( $status != ""){
              array_push($allQueries['data'], array(
                $time->format('Y-m-d\TH:i:s'),
	        $type,
                $domain,
	        hasHostName($client),
	        $status,
              ));
            }


        }
        return $allQueries;
    }



function readInSyslog() {
        global $log;
        return count($log) > 1 ? $log :
            file("/home/pi/youlogfile.log");
    }

function getLogQueriesAll($log) {
      return array_filter($log, "findLogQueriesAll");
    }

function findLogQueriesAll($var) {
        return strpos($var, ": DHCP");
    }

/*
function findLogQueriesAll($var) {
        return strpos($var, ": DHCP") || strpos($var, ": DHCPREQUEST") || strpos($var, ": DHCPREQUEST") !== false;
    }
*/

?>
