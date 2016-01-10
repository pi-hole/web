<?php
require_once ('inc/nameserverHelper.inc.php');

if ( !empty($_POST['addCustomNameserver']) ) {
    if ( !empty($_POST['customNameServerDomain']) && !empty($_POST['customNameServerIP']) ) {
        NameserverHelper::addCustomNameserver($_POST['customNameServerDomain'], $_POST['customNameServerIP']);
        //TODO: doesnt work as expected
        exec('sudo killall dnsmasq');
        exec('sudo service dnsmasq start');
        echo '{status:"success"}';
    }
    die();
}

if ( !empty($_POST['removeCustomNameserver']) ) {
    if ( !empty($_POST['customNameserverID']) ) {
        NameserverHelper::removeNameserver( $_POST['customNameserverID'] );
        //TODO: doesnt work as expected
        exec('sudo killall dnsmasq');
        exec('sudo service dnsmasq start');
        echo '{status:"success"}';
    }
    die();
}