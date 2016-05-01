<?php
$list_folder = "/etc/pihole/";

function display_list($type)
{
?>
    <table id="list-table" class="table table-striped table-hover table-condensed">
        <thead>
            <tr>
                <th><?php echo ucfirst($type); ?>listed domain(s)</th>
            </tr>
        </thead>
        <tbody>

<?php
    $file = fopen($GLOBALS['list_folder'] . $type . "list.txt", "r");

    while(! feof($file))
    {
        $line = fgets($file);
        if($line != "")
        {
            echo "<tr><td>";
            echo '<input type="text" class="form-control" value="'.$line.'" name="list_domains[]">';
            echo "</td></tr>";
        }
    }
    fclose($file);
?>
        </tbody>
    </table>
<?php
}


function update_list($type, $list_domains)
{
    try
    {
        $file = fopen($GLOBALS['list_folder'] . $type . "list.txt", "w");

        foreach($list_domains as $domain)
        {
            if($domain != "")
            {
                fwrite($file, $domain . PHP_EOL);
            }
        }
        fclose($file);
    }
    catch(Exception $ex)
    {
        return false;
    }
    return true;
}
?>
