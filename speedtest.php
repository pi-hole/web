<?php

header('Content-Type: application/json');

$dbFile ='scripts/pi-hole/speedtest/speedtest.db';

// $createSQL= <<<EOF
//   CREATE TABLE "speedtest" ( `id` INTEGER PRIMARY KEY AUTOINCREMENT, `start_time` INTEGER, `stop_time` text, `from_server` text, `from_ip` text, `server` text, `server_dist` REAL, `server_ping` real, `download` real, `upload` real, `share_url` text )
// EOF;
//
// check for DB
if(!file_exists($dbFile)){
  echo json_encode(array("error"=>"Unable to load data"));
  exit;
}

$db = new SQLite3($dbFile);
if(!$db) {
  echo json_encode($db->lastErrorMsg());
} else {
    //  echo "Opened database successfully\n";
}

$sql =<<<EOF
      SELECT * from speedtest  order by id desc;
EOF;

$dbResults = $db->query($sql);

$data= array();


if(!empty($dbResults)){
  while($row = $dbResults->fetchArray(SQLITE3_ASSOC) ) {
    array_push($data, $row);
  }
    echo json_encode(array_reverse(array_slice($data,0,24)));
}
else{
  echo json_encode(array("message"=>"No results"));
}

$db->close();

?>
