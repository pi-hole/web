<?php

function display_whitelist()
{
?>
    <table class="table table-striped table-hover table-condensed">
        <thead>
            <tr>
                <th>whitelisted domain(s)</th>
            </tr>
        </thead>
        <tbody>

<?php
$file = fopen("/etc/pihole/whitelist.txt","r");

while(! feof($file))
{
    echo "<tr><td>".fgets($file)."</td></tr>";
}

fclose($file);

?>
        </tbody>
    </table>
<?php
}
?>
