<?php
require('func.php');

$PI_HOLE_DIR = "/etc/pihole";

/** Make sure this is false before merging */
$ENABLE_STUBS = true;
if ($ENABLE_STUBS) {
    $PI_HOLE_DIR = "stubs";
}

function stubWith($original, $stub)
{
    global $PI_HOLE_DIR;
    if ($PI_HOLE_DIR != "stubs") {
        return $original();
    } else if (isset($stub)) {
        return $stub();
    }
}

function doNothing()
{
}

function getFileList($type)
{
    global $PI_HOLE_DIR;
    $list = "";
    if ($type == "white" || $type == "black") {
        $list = file_get_contents($PI_HOLE_DIR . "/" . $type . "list.txt");
    }
    return $list;
}

function getGravityList()
{
    global $PI_HOLE_DIR;
    return new \SplFileObject("$PI_HOLE_DIR/gravity.list");
}

function getSetupVars()
{
    global $PI_HOLE_DIR;
    return parse_ini_file("$PI_HOLE_DIR/setupVars.conf");
}

function getPiHoleVersion()
{
    return stubWith(
        $original = function () { return exec("cd /etc/.pihole/ && git describe --tags --abbrev=0"); },
        $stub = function () { return "Stub"; }
    );
}

function getPiHoleLog()
{
    return stubWith(
        $original = function () {
            return new \SplFileObject("/var/log/pihole.log");
        },
        $stub = function () {
            global $PI_HOLE_DIR;
            return new \SplFileObject("$PI_HOLE_DIR/pihole.log");
        }
    );
}

function getSystemTemperature() {
    return stubWith(
        $original = function () {
            return shell_exec("echo $((`cat /sys/class/thermal/thermal_zone0/temp | cut -c1-2`))");
        },
        $stub = function () { return "N/A"; }
    );
}

function isUsingIVP6() {
    return stubWith(
        $original = function () {
            $ipv4 = parse_ini_file("/etc/pihole/setupVars.conf")['IPV4_ADDRESS'] != "";
            $ipv6 = parse_ini_file("/etc/pihole/setupVars.conf")['IPV6_ADDRESS'] != "";
            return $ipv4 && $ipv6;
        },
        $stub = function () { return false; }
    );
}

function getProcValue() {
    return stubWith(
        $original = function () { return shell_exec('nproc'); },
        $stub = function () { return 0; }
    );
}

function getMemoryUsage() {
    return stubWith(
        $original = function () {
            $free = shell_exec('free');
            $free = (string)trim($free);
            $free_arr = explode("\n", $free);
            $mem = explode(" ", $free_arr[1]);
            $mem = array_filter($mem);
            $mem = array_merge($mem);
            $used = $mem[2] - $mem[5] - $mem[6];
            $total = $mem[1];
            return ($total == 0 ? 0 : $used / $total * 100);
        },
        $stub = function () { return 0; }
    );
}

function getPiHoleStatus() {
    return stubWith(
        $original = function () {
            return exec('sudo pihole status web');
        },
        $stub = function () {}
    );
}

function modifyList($file, $action, $url) {
    stubWith(
        $original = function () use ($file, $action, $url) {
            $listType = ($file == "white" ? "-w" : "-b");
            $delete = ($action == "delete" ? "-d" : "");
            if (is_valid_domain_name($url)) {
                exec("sudo pihole " . $listType . " -q " . $delete . " " . $url);
            }
        },
        $stub = function () {}
    );
}

function flushPiHole() {
    stubWith(
        $original = function () { exec("sudo pihole -f"); },
        $stub = function () {}
    );
}

function queryAdsForUrl($url) {
    stubWith(
        $original = function () use ($url) {
            return popen("sudo pihole -q " . $url, 'r');
        },
        $stub = function () {}
    );
}

function enablePiHole() {
    stubWith(
        $original = function () { exec('sudo pihole enable'); },
        $stub = function () {}
    );
}

function disablePiHole() {
    stubWith(
        $original = function () { exec('sudo pihole disable'); },
        $stub = function () {}
    );
}

function updateGravity() {
    stubWith(
        $original = function () { popen("sudo pihole -g", 'r'); },
        $stub = function () {}
    );
}