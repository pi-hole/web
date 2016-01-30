<!--
Pi-hole: A black hole for Internet advertisements
(c) 2015, 2016 by Jacob Salmela
Network-wide ad blocking via your Raspberry Pi
http://pi-hole.net
Provides stats from the Pi-hole in the form of JSON

Pi-hole is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 2 of the License, or
(at your option) any later version.
-->

<?php 
    echo exec("/usr/local/bin/chronometer.sh -j"); 
?>
