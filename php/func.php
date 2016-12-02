<?php

// Credit: http://stackoverflow.com/a/4694816/2087442
function is_valid_domain_name($domain_name)
{
    return (preg_match("/^([a-z\d](-*[a-z\d])*)(\.([a-z\d](-*[a-z\d])*))*$/i", $domain_name) &&  //valid chars check
        preg_match("/^.{1,253}$/", $domain_name) && //overall length check
        preg_match("/^[^\.]{1,63}(\.[^\.]{1,63})*$/", $domain_name)); //length of each label
}

?>