<?php
function checkPass($passB64) {
    // Convert from Base64
    $pass = base64_decode($passB64);
    
    // Check password
    return hash_equals(str_replace(array("\r", "\n"), '', file_get_contents("/etc/pihole/password.txt")), hash("sha256", $pass));
}