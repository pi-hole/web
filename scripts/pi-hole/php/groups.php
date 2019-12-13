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
    echo json_encode(array("success" => false, "message" => $message));
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
        $stmt = $db->prepare('INSERT OR IGNORE INTO "group" (name,description) VALUES (:name,:desc)');
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
echo shell_exec("sudo pihole restartdns reload-lists");
?>
