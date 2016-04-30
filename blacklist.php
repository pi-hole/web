<?php

function display_blacklist()
{
?>
    <table class="table table-striped table-hover table-condensed">
        <thead>
            <tr>
                <th>blacklisted domain(s)</th>
            </tr>
        </thead>
        <tbody>

<?php
$file = fopen("/etc/pihole/blacklist.txt","r");

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
