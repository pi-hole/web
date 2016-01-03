<?php

class Blacklist {

    public static function getBlacklistEntries() {
        return array_filter( explode("\n", exec("cat /etc/pihole/blacklist.txt") ) );
    }

}