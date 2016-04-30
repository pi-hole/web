<?php
$blacklist_file = "/etc/pihole/blacklist.txt";

function display_blacklist()
{
?>
    <table id="list-table" class="table table-striped table-hover table-condensed">
        <thead>
            <tr>
                <th>Blacklisted domain(s)</th>
            </tr>
        </thead>
        <tbody>

<?php
    $file = fopen($GLOBALS['blacklist_file'], "r");

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


function update_blacklist($list_domains)
{
    try
    {
        $file = fopen($GLOBALS['blacklist_file'], "w");

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
