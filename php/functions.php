<?php
function checkPass($pass) {
    // Check password
    return hash_equals(str_replace(array("\r", "\n"), '', file_get_contents("/etc/pihole/password.txt")), hash("sha256", $pass));
}