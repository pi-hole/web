<?php

$PI_HOLE_DIR = "/etc/pihole";

$ENABLE_STUBS = true;

if ($ENABLE_STUBS) {
    $PI_HOLE_DIR = "stubs";
}

function isUsingStubs() {
    global $PI_HOLE_DIR;
    return $PI_HOLE_DIR == "stubs";
}

function getFileList($type) {
    global $PI_HOLE_DIR;
    return file_get_contents($PI_HOLE_DIR . "/" . $type . "list.txt");
}

function getSetupVars() {
    global $PI_HOLE_DIR;
    return parse_ini_file("$PI_HOLE_DIR/setupVars.conf");
}

function getPiHoleVersion() {
    if(isUsingStubs()) {
        return "Stub";
    }
    else {
        return exec("cd /etc/.pihole/ && git describe --tags --abbrev=0");
    }
}

function getPiHoleLog() {
    global $PI_HOLE_DIR;
    return new \SplFileObject("$PI_HOLE_DIR/pihole.log");
}

function getGravityList() {
    global $PI_HOLE_DIR;
    return new \SplFileObject("$PI_HOLE_DIR/gravity.list");
}

function getSystemTemperature() {
    if(isUsingStubs()) {
        return "N/A";
    }
    else {
        return shell_exec("echo $((`cat /sys/class/thermal/thermal_zone0/temp | cut -c1-2`))");
    }
}