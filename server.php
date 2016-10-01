<?php

try {
  // $DBH = new PDO("mysql:host=$host;dbname=$dbname", $user, $pass); //MYSQL database
  $conn = new PDO("sqlite:/etc/pihole/pihole.db");  // SQLite Database
  $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

  $hostname = trim(file_get_contents("/etc/hostname"), "\x00..\x1F");

  $where ="(source || name !='127.0.0.1$hostname')";
  $order_by="id";
  $rows=25;
  $current=1;
  $limit_l=($current * $rows) - ($rows);
  $limit_h=$limit_l + $rows  ;


//Handles Sort querystring sent from Bootgrid
  if (isset($_REQUEST['sort']) && is_array($_REQUEST['sort']) )
  {
    $order_by="";
    foreach($_REQUEST['sort'] as $key=> $value)
      $order_by.=" $key $value";
  }

//Handles search  querystring sent from Bootgrid
  if (isset($_REQUEST['searchPhrase']) )
  {
    $search=trim($_REQUEST['searchPhrase']);
    $where.= " AND ( ts LIKE '%".$search."%' OR  query_type LIKE '%".$search."%' OR  name LIKE '%".$search."%' OR  source LIKE '%".$search."%' OR domain LIKE '%".$search."%'  ) ";
  }

//Handles determines where in the paging count this result set falls in
  if (isset($_REQUEST['rowCount']) )
    $rows=$_REQUEST['rowCount'];

  //calculate the low and high limits for the SQL LIMIT x,y clause
  if (isset($_REQUEST['current']) )
  {
    $current=$_REQUEST['current'];
    $limit_l=($current * $rows) - ($rows);
    $limit_h=$rows ;
  }

  if ($rows==-1)
    $limit="";  //no limit
  else
    $limit=" LIMIT $limit_l,$limit_h  ";

//NOTE: No security here please beef this up using a prepared statement - as is this is prone to SQL injection.
  $sql="SELECT ts, query_type, name,source, domain FROM queries left join gravity on queries.name = gravity.domain WHERE $where ORDER BY $order_by $limit";

  $stmt=$conn->prepare($sql);
  $stmt->execute();
  $results_array=$stmt->fetchAll(PDO::FETCH_ASSOC);

  $json=json_encode( $results_array );

  $nRows=$conn->query("SELECT count(*) FROM queries left join gravity on queries.name = gravity.domain  WHERE $where")->fetchColumn();   /* specific search then how many match */

  header('Content-Type: application/json'); //tell the broswer JSON is coming

  if (isset($_REQUEST['rowCount']) )  //Means we're using bootgrid library
    echo "{ \"current\":  $current, \"rowCount\":$rows,  \"rows\": ".$json.", \"total\": $nRows }";
  else
    echo $json;  //Just plain vanillat JSON output
  exit;
}
catch(PDOException $e) {
  echo 'SQL PDO ERROR: ' . $e->getMessage();
}
?>