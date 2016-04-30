<?php
    require "header.html";
    include "blacklist.php";
    include "whitelist.php";

    if(isset($_GET['l']))
    {
        switch($_GET['l'])
        {
            case "black":
                $type = "black";
                break;
            case "white":
                $type = "white";
                break;
            default:
                $type = "invalid";
        }
    }

    if(isset($_POST['btn_update']) && isset($_POST['list_type']))
    {
        switch($_POST['list_type'])
        {
            case "black":
                if(update_blacklist($_POST['list_domains']))
                {
?>
                <div class="alert alert-success">
                <strong>Success!</strong> List updated!</div>
<?php
                }
                else
                {
?>
                <div class="alert alert-danger">
                <strong>Error!</strong> Failed to update list!</div>
<?php
                }
                break;
            case "white":
                if(update_whitelist($_POST['list_domains']))
                {
?>
                <div class="alert alert-success">
                <strong>Success!</strong> List updated!</div>
<?php
                }
                else
                {
?>
                <div class="alert alert-danger">
                <strong>Error!</strong> Failed to update list!</div>
<?php
                }
                break;
            default:
                echo "<h1>Invalid Request!</h1>";
        }
    }
?>
<!-- JS Warning -->
<div>
  <link rel="stylesheet" type="text/css" href="css/js-warn.css">
  <input type="checkbox" id="js-hide" />
  <div class="js-warn" id="js-warn-exit"><h1>Javascript Is Disabled</h1><p>Javascript seems to be disabled. This will break some site features.</p>
  <p>To enable Javascript click <a href="http://www.enable-javascript.com/" target="_blank">here</a></p><label for="js-hide">Close</label></div>
  <script>var jswarn = document.getElementById("js-warn-exit"); jswarn.parentNode.removeChild(jswarn);</script>
</div>
<!-- /JS Warning -->
<!-- Small boxes (Stat box) -->
<div class="row">
    <div class="col-md-12">
        <div class="contianer">
            <form role="form" action="<?php echo $_SERVER['REQUEST_URI']; ?>" method="POST">
                <div class="form-group">
<?php
if($type  == "black")
{
    display_blacklist();
}
else if($type == "white")
{
    display_whitelist();
}
?>
                </div>
                <input type="hidden" name="list_type" value="<?php echo $type; ?>" />
                <button type="button" class="btn btn-danger" onclick="addToList()">
                    <span class="glyphicon glyphicon-plus"></span> Add to List
                </button>
                <button type="submit" class="btn btn-success" name="btn_update">
                    <span class="glyphicon glyphicon-ok"></span> Update
                </button>
            </form>
        </div>
    </div>
</div>
<!-- /.row -->

<?php
    require "footer.php";
?>

<script type="text/javascript">

function addToList()
{
    var table = document.getElementById("list-table");
    var row = table.insertRow(table.rows.length);
    var cell1 = row.insertCell(0);
    cell1.innerHTML = '<input type="text" class="form-control" name="list_domains[]">';
}

</script>
