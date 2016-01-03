<?php

class Whitelist {

    public static function getWhitelistEntries() {
        return array_filter( explode("\n", exec("cat /etc/pihole/whitelist.txt") ) );
    }

}