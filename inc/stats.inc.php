<?php

define('PIHOLE_LOGFILE_PATH', '/var/log/pihole.log');

class Stats {

    public static function getBlockedDomains() {
        return exec("wc -l /etc/pihole/gravity.list | awk '{print $1}'");
    }

    public static function getQueryCount() {
        return exec("cat " . PIHOLE_LOGFILE_PATH . " | awk '/query/ {print $6}' | wc -l");
    }

    public static function getBlockedCount() {
        return exec("cat " . PIHOLE_LOGFILE_PATH . " | awk '/\/etc\/pihole\/gravity.list/ && !/address/ {print $6}' | wc -l");
    }

    public static function getBlockedPercentage() {
        return number_format(self::getBlockedCount() / self::getQueryCount() * 100, 2, '.', '');
    }


}
