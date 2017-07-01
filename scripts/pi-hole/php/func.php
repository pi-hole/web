<?php
/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

function is_valid_domain_name($domain_name)
{
    return (preg_match("/^((-|_)*[a-z\d]((-|_)*[a-z\d])*(-|_)*)(\.(-|_)*([a-z\d]((-|_)*[a-z\d])*))*$/i", $domain_name) && // Valid chars check
        preg_match("/^.{1,253}$/", $domain_name) && // Overall length check
        preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)); // Length of each label
}

function checkfile($filename) {
    if(is_readable($filename))
    {
        return $filename;
    }
    else
    {
        // substitute dummy file
        return "/dev/null";
    }
}

?>
