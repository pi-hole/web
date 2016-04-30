<?php
$whitelist_file = "/etc/pihole/whitelist.txt";

function display_whitelist()
{
?>
    <table id="list-table" class="table table-striped table-hover table-condensed">
        <thead>
            <tr>
                <th>Whitelisted domain(s)</th>
            </tr>
        </thead>
        <tbody>

<?php
    $file = fopen($GLOBALS['whitelist_file'], "r");

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


function update_whitelist($list_domains)
{
    try
    {
        $file = fopen($GLOBALS['whitelist_file'], "w");

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
