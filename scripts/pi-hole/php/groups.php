<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

require_once('auth.php');
/*
// Authentication checks
if(isset($_POST['token']))
{
    check_cors();
    check_csrf($_POST['token']);
}
elseif(isset($_POST['pw']))
{
    require("password.php");
    if($wrongpassword || !$auth)
    {
	log_and_die("Wrong password!");
    }
}
else
{
    log_and_die("Not allowed!");
}*/

$reload = false;

require_once("func.php");
require_once("database.php");
$GRAVITYDB = getGravityDBFilename();
$db = SQLite3_connect($GRAVITYDB, SQLITE3_OPEN_READWRITE);

function JSON_success($message = null)
{
    header('Content-type: application/json');
    echo json_encode(array("success" => true, "message" => $message));
}

function JSON_error($message = null)
{
    header('Content-type: application/json');
    $response = array("success" => false, "message" => $message);
    if(isset($_REQUEST['action']))
    {
        array_push($response, array("action" => $_REQUEST['action']));
    }
    echo json_encode($response);
}

if($_REQUEST['action'] == "get_groups")
{
    // List all available groups
    try
    {
        $query = $db->query("SELECT * FROM \"group\";");
        $data = array();
        while($res = $query->fetchArray(SQLITE3_ASSOC))
        {
            array_push($data,$res);
        }
        echo json_encode(array("data" => $data));
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "add_group")
{
    // Add new group
    try
    {
        $stmt = $db->prepare('INSERT INTO "group" (name,description) VALUES (:name,:desc)');
        if(!$stmt)
        {
            throw new Exception("While preparing statement: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':name', $_POST["name"], SQLITE3_TEXT))
        {
            throw new Exception("While binding name: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':desc', $_POST["desc"], SQLITE3_TEXT))
        {
            throw new Exception("While binding desc: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing: ".$db->lastErrorMsg());
        }

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "edit_group")
{
    // Edit group identified by ID
    try
    {
        $stmt = $db->prepare('UPDATE "group" SET enabled=:enabled, name=:name, description=:desc WHERE id = :id');
        if(!$stmt)
        {
            throw new Exception("While preparing statement: ".$db->lastErrorMsg());
        }

        $status = intval($_POST["status"]);
        if($status !== 0)
        {
                $status = 1;
        }
    
        if(!$stmt->bindValue(':enabled', $status, SQLITE3_INTEGER))
        {
            throw new Exception("While binding enabled: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':name', $_POST["name"], SQLITE3_TEXT))
        {
            throw new Exception("While binding name: ".$db->lastErrorMsg());
        }

        $desc = $_POST["desc"];
        if(strlen($desc) == 0)
        {
                // Store NULL in database for empty descriptions
                $desc = null;
        }
        if(!$stmt->bindValue(':desc', $desc, SQLITE3_TEXT))
        {
            throw new Exception("While binding desc: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':id', intval($_POST["id"]), SQLITE3_INTEGER))
        {
            throw new Exception("While binding id: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing: ".$db->lastErrorMsg());
        }

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "delete_group")
{
    // Delete group identified by ID
    try
    {
        $stmt = $db->prepare('DELETE FROM "group" WHERE id=:id');
        if(!$stmt)
        {
            throw new Exception("While preparing statement: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':id', intval($_POST["id"]), SQLITE3_INTEGER))
        {
            throw new Exception("While binding id: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing: ".$db->lastErrorMsg());
        }

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "get_clients")
{
    // List all available groups
    try
    {
        $query = $db->query("SELECT * FROM client;");
        if(!$query)
        {
            throw new Exception("Error while querying gravity's client table: ".$db->lastErrorMsg());
        }

        $data = array();
        while($res = $query->fetchArray(SQLITE3_ASSOC))
        {
            $group_query = $db->query("SELECT group_id FROM client_by_group WHERE client_id = ".$res["id"].";");
            if(!$group_query)
            {
                throw new Exception("Error while querying gravity's client_by_group table: ".$db->lastErrorMsg());
            }
    
            $groups = array();
            while($gres = $group_query->fetchArray(SQLITE3_ASSOC))
            {
                array_push($groups,$gres["group_id"]);
            }
            $res["groups"] = $groups;
            array_push($data,$res);
        }


        echo json_encode(array("data" => $data));
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "get_unconfigured_clients")
{
    // List all available clients WITHOUT already configured clients
    try
    {
        $QUERYDB = getQueriesDBFilename();
        $FTLdb = SQLite3_connect($QUERYDB);

        $query = $FTLdb->query("SELECT DISTINCT ip FROM network_addresses ORDER BY ip ASC;");
        if(!$query)
        {
            throw new Exception("Error while querying FTL's database: ".$db->lastErrorMsg());
        }

        // Loop over results
        $ips = array();
        while($res = $query->fetchArray(SQLITE3_ASSOC))
        {
            array_push($ips,$res["ip"]);
        }
        $FTLdb->close();

        $query = $db->query("SELECT ip FROM client;");
        if(!$query)
        {
            throw new Exception("Error while querying gravity's database: ".$db->lastErrorMsg());
        }

        // Loop over results, remove already configured clients
        while($res = $query->fetchArray(SQLITE3_ASSOC))
        {
            if(($idx = array_search($res["ip"],$ips)) !== false)
            {
                unset($ips[$idx]);
            }
        }

        echo json_encode(array_values($ips));
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "add_client")
{
    // Add new client
    try
    {
        $stmt = $db->prepare('INSERT INTO client (ip) VALUES (:ip)');
        if(!$stmt)
        {
            throw new Exception("While preparing statement: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':ip', $_POST["ip"], SQLITE3_TEXT))
        {
            throw new Exception("While binding ip: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing: ".$db->lastErrorMsg());
        }

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "edit_client")
{
    // Edit client identified by ID
    try
    {
        $stmt = $db->prepare('DELETE FROM client_by_group WHERE client_id = :id');
        if(!$stmt)
        {
            throw new Exception("While preparing DELETE statement: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':id', intval($_POST["id"]), SQLITE3_INTEGER))
        {
            throw new Exception("While binding id: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing DELETE statement: ".$db->lastErrorMsg());
        }
        
        $db->query("BEGIN TRANSACTION;");
        foreach ($_POST["groups"] as $gid)
        {
            $stmt = $db->prepare('INSERT INTO client_by_group (client_id,group_id) VALUES(:id,:gid);');
            if(!$stmt)
            {
                throw new Exception("While preparing INSERT INTO statement: ".$db->lastErrorMsg());
            }
    
            if(!$stmt->bindValue(':id', intval($_POST["id"]), SQLITE3_INTEGER))
            {
                throw new Exception("While binding id: ".$db->lastErrorMsg());
            }
    
            if(!$stmt->bindValue(':gid', intval($gid), SQLITE3_INTEGER))
            {
                throw new Exception("While binding gid: ".$db->lastErrorMsg());
            }
    
            if(!$stmt->execute())
            {
                throw new Exception("While executing INSERT INTO statement: ".$db->lastErrorMsg());
            }
        }
        $db->query("COMMIT;");

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
elseif($_REQUEST['action'] == "delete_client")
{
    // Delete client identified by ID
    try
    {
        $stmt = $db->prepare('DELETE FROM client WHERE id=:id');
        if(!$stmt)
        {
            throw new Exception("While preparing statement: ".$db->lastErrorMsg());
        }

        if(!$stmt->bindValue(':id', intval($_POST["id"]), SQLITE3_INTEGER))
        {
            throw new Exception("While binding id: ".$db->lastErrorMsg());
        }

        if(!$stmt->execute())
        {
            throw new Exception("While executing: ".$db->lastErrorMsg());
        }

        $reload = true;
        return JSON_success();
    }
    catch (\Exception $ex)
    {
        return JSON_error($ex->getMessage());
    }
}
else
{
    log_and_die("Requested action not supported!");
}
// Reload lists in pihole-FTL after having added something
if($reload)
{
    //echo shell_exec("sudo pihole restartdns reload-lists");
}
?>
