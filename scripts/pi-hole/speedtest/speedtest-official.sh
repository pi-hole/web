#!/bin/bash

start=$(date +"%Y-%m-%d %H:%M:%S")

readonly setupVars="/etc/pihole/setupVars.conf"

serverid=$(sed -n -e '/SPEEDTEST_SERVER/ s/.*\= *//p' $setupVars)

echo "Testing with ${serverid}"

function nointernet(){
    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', 'No Internet', '-', '-', 0, 0, 0, 0, '#');"
    exit
}


if [[ "$serverid" =~ ^[0-9]+$ ]]; then
    /usr/bin/speedtest -s $serverid --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
else
    /usr/bin/speedtest --accept-gdpr --accept-license -f json-pretty > /tmp/speedtest.log || nointernet
fi


FILE=/tmp/speedtest.log
if [[ -f "$FILE" ]]; then
    stop=$(date +"%Y-%m-%d %H:%M:%S")
    download=`cat /tmp/speedtest.log| jq -r '.download.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}'`
    upload=`cat /tmp/speedtest.log| jq -r '.upload.bandwidth' | awk '{$1=$1*8/1000/1000; print $1;}'`
    server_name=`cat /tmp/speedtest.log| jq -r '.server.name'`
    isp=`cat /tmp/speedtest.log| jq -r '.isp'`
    server_ip=`cat /tmp/speedtest.log| jq -r '.server.ip'`
    from_ip=`cat /tmp/speedtest.log| jq -r '.interface.externalIp'`
    server_ping=`cat /tmp/speedtest.log| jq -r '.ping.latency'`
    share_url=`cat /tmp/speedtest.log| jq -r '.result.url'`
    server_dist=0

    rm /tmp/speedtest.log

    sep="\t"
    quote=""
    opts=

    # Output CSV results
    sep="$quote$sep$quote"
    printf "$quote$start$sep$stop$sep$isp$sep$from_ip$sep$server_name$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"

    sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', '${isp}', '${from_ip}', '${server_name}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"
fi

