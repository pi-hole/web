#!/usr/bin/env bash
### speedtest-csv {{SPEEDTEST_CSV_VERSION}}
###
### Usage:
###  speedtest-csv [options]
###
### Options:
###  --header          Display field names (only)
###
###  --header-units    Units (ms, Mbit/s and km) are in header (default)
###  --no-header-units Units are in the values
###  --standardize     Standardize units and number formats (default)
###  --no-standardize  Disable --standardize
###  --share           Generate and provide a URL to the speedtest.net
###                    share results image (default)
###  --no-share        Disable --share
###
###  --quote <str>     Quote fields using <str> (default: none)
###  --sep <str>       Separate fields using <str> (default '\t')
###
###  --help            This help
###  --version         Display version
###
###  --debug           Output extra debug information
###  --last            Use most recent stats, if available
###                    (avoids calling `speedtest-cli`)
###
### Any other options are passed to speedtest-cli as is.
###
### Example:
###  speedtest-csv --header
###  speedtest-csv
###
###  # Defaults in speedtest-csv (<= 1.3.0):
###  speedtest-csv --sep ';' --no-standardize --no-header-units
###
### Installed dependencies:
###  speedtest-cli {{SPEEDTEST_CLI_VERSION}} (https://github.com/sivel/speedtest-cli)
###  python {{PYTHON_VERSION}}
###
### Copyright: 2014-2017 Henrik Bengtsson
### License: GPL (>= 2.1) (https://www.gnu.org/licenses/gpl.html)


readonly setupVars="/etc/pihole/setupVars.conf"

source "${setupVars}"

call="$0 $*"

SPEEDTEST_CSV_VERSION="2.0.1"

# In case speedtest-cli is in the same directory
# as speedtest-csv, but neither is on the PATH
PATH=$(dirname $0):$PATH

# Temporary file holding speedtest-cli output
user=$USER
if [[ -z $user ]]; then
    user=$USERNAME
fi
log=/tmp/$user/speedtest-csv.log

# Local functions
function mecho() { echo "$@" 1>&2; }
function mdebug() {
    if [[ $debug == true ]]; then
	mecho "[DEBUG] $@";
    fi
}
function str_extract() {
    pattern=$1
    # Extract
    res=`grep "$pattern" $log | sed "s/$pattern//g"`
    # Drop trailing '...'
    res=`echo $res | sed 's/[.][.][.]//g'`
    # WORKAROUND: Drop stray preceeding '.' (Issue #19)
    res=`echo $res | sed 's/^[.]*//g'`
    # Trim
    res=`echo $res | sed 's/^ *//g' | sed 's/ *$//g'`
    echo $res
}

debug=false
header=false
standardize=true
share=true
last=false
version=false
help=false
header_units=true
retry=false

# Character for separating values
sep="\t"
quote=""
opts=

# Parse command-line options
while [[ $# > 0 ]]; do
    opt=$1
    if [[ "$opt" == "--header" ]]; then
	header=true
    elif [[ "$opt" == "--header-units" ]]; then
	header_units=true
    elif [[ "$opt" == "--no-header-units" ]]; then
	header_units=false
    elif [[ "$opt" == "--retry" ]]; then
	retry=true
    elif [[ "$opt" == "--quote" ]]; then
	quote=$2
	shift
    elif [[ "$opt" == "--sep" ]]; then
	sep=$2
	shift
    elif [[ "$1" == "--share" ]]; then
        share=true
    elif [[ "$1" == "--no-share" ]]; then
        share=false
    elif [[ "$1" == "--standardize" ]]; then
        standardize=true
    elif [[ "$1" == "--no-standardize" ]]; then
        standardize=false
    elif [[ "$1" == "--last" ]]; then
        last=true
    elif [[ "$1" == "--debug" ]]; then
        debug=true
    elif [[ "$1" == "--version" ]]; then
        version=true
    elif [[ "$1" == "--help" ]]; then
        help=true
    else
	opts="$opts $1"
    fi
    shift
done

if [[ $share == true ]]; then
    opts="$opts --share"
fi

# Trim
opts=`echo $opts | sed 's/^ *//g' | sed 's/ *$//g'`

if [[ -n "$SPEEDTEST_CSV_SKIP" ]]; then
    mdebug "\$SPEEDTEST_CSV_SKIP => --last"
    last=true
fi

if [[ $debug == true ]]; then
    mdebug "call: $call"
    mdebug "header: $header"
    mdebug "header_units: $header_units"
    mdebug "standardize: $standardize"
    mdebug "share: $share"
    mdebug "last: $last"
    mdebug "version: $version"
    mdebug "field delimiter: '$sep'"
    mdebug "quotation mark: $quote"
    mdebug "speedtest-cli options: $opts"
fi

if [[ $version == true ]]; then
    echo ${SPEEDTEST_CSV_VERSION}
    exit 0
fi

if [[ $help == true ]]; then
    SPEEDTEST_CLI_VERSION=$(speedtest-cli --version 2>&1)
    if [[ $? -ne 0 ]]; then
	SPEEDTEST_CLI_VERSION="<PLEASE INSTALL>"
    fi
    PYTHON_VERSION=$(python --version 2>&1)
    if [[ $? -ne 0 ]]; then
	PYTHON_VERSION="<PLEASE INSTALL>"
    else
	PYTHON_VERSION=${PYTHON_VERSION/Python /}
    fi
    grep "^###" $0 | grep -v "^####" | cut -b 5- | sed "s/{{SPEEDTEST_CSV_VERSION}}/${SPEEDTEST_CSV_VERSION}/" | sed "s/{{SPEEDTEST_CLI_VERSION}}/${SPEEDTEST_CLI_VERSION}/" | sed "s/{{PYTHON_VERSION}}/${PYTHON_VERSION}/"
    exit 0
fi

# Display header?
if [[ $header == true ]]; then
    mdebug "Generating header"
    start="start"
    stop="stop"
    from="from"
    from_ip="from_ip"
    server="server"
    share_url="share_url"
    if [[ $header_units == true ]]; then
        server_dist="server_dist (km)"
        server_ping="server_ping (ms)"
        download="download (Mbit/s)"
        upload="upload (Mbit/s)"
    else
        server_dist="server_dist"
        server_ping="server_ping"
        download="download"
        upload="upload"
    fi
else
    mkdir -p $(dirname $log)

    start=$(date +"%Y-%m-%d %H:%M:%S")

    if [[ $last == true && -f "$log" ]]; then
        # Reuse existing results (useful for debugging)
        mdebug "Reusing existing results: $log"
    else
        # Query Speedtest
        # Test for no-pre-allocate
        pre_allocate=`speedtest-cli --help | grep "no-pre-allocate"| wc -l`
        if [[ "${pre_allocate}" -ge 1 ]]; then
            opts="$opts --no-pre-allocate"
        fi

        # Test for custom server
        if [[ "${SPEEDTEST_SERVER}" =~ ^[0-9]+$ ]]; then
          if [[ "${SPEEDTEST_SERVER}" -ge 1 ]]; then
            # echo "Using custom server $SPEEDTEST_SERVER"
            opts="$opts --server $SPEEDTEST_SERVER"
          fi
        fi

        cmd="speedtest-cli $opts"
        # echo $cmd
        # exit
        mdebug "Querying Speedtest using '$cmd'"
        $cmd > $log
	      status=$?
        mdebug "Exit code: $status"
    fi

    stop=$(date +"%Y-%m-%d %H:%M:%S")

    last=$(tail -c 2 /tmp/$user/speedtest-csv.log)

    # temp fix for failed run
    if [[ $last  != "g" ]]; then
        echo "Connection Failed";
        if [ $retry = false ]; then
            echo "Retry after 30 sec  "
            sleep 30
            retry_cmd="--retry"
            self_path="/var/www/html/admin/scripts/pi-hole/speedtest/speedtest.sh"
            $self_path $retry_cmd
        else
            echo "Retry failed aborting"
        fi
        exit;
    fi

    # Was speedtest-cli successful?
    if [[ $status -ne 0 ]]; then
	mecho "ERROR: '$cmd' failed (exit code $status)."
	mecho $(cat /tmp/$user/speedtest-csv.log > /tmp/csv-error.log)
	exit $status
    fi

    # Raw results
    if [[ $debug == true ]]; then
      mdebug "Raw results"
      bfr=$(cat $log | tr '\n' '~')
      echo "[DEBUG] - ${bfr}" | sed 's/~/\n[DEBUG] - /g' | head -n -1 1>&2;
    fi

    # Parse
    mdebug "Parsing results"
    from=$(str_extract "Testing from ")
    from_ip=$(echo $from | sed 's/.*(//g' | sed 's/).*//g')
    from=$(echo $from | sed 's/ (.*//g')
    server=$(str_extract "Hosted by ")
    server_ping=$(echo $server | sed 's/.*: //g')
    server=$(echo $server | sed 's/: .*//g')
    server_dist=$(echo $server | sed 's/.*\[//g' | sed 's/\].*//g')
    server=$(echo $server | sed 's/ \[.*//g')

    download=$(str_extract "Download: ")
    upload=$(str_extract "Upload: ")
    if [[ $share == true ]]; then
	share_url=$(str_extract "Share results: ")
    else
	share_url=
    fi

    # Standardize units?
    if [[ $standardize == true ]]; then
	## Mbits/s -> Mbit/s
        mdebug "Standardize to Mbit/s"
        download=$(echo $download | sed 's/Mbits/Mbit/')
        upload=$(echo $upload | sed 's/Mbits/Mbit/')

	## commas to periods
        mdebug "Standardize to periods (not commas)"
        download=$(echo $download | sed 's/,/./')
        upload=$(echo $upload | sed 's/,/./')
        server_dist=$(echo $server_dist | sed 's/,/./')
        server_ping=$(echo $server_ping | sed 's/,/./')
    fi

    if [[ $header_units == true ]]; then
        download=$(echo $download | sed 's/ .*//')
        upload=$(echo $upload | sed 's/ .*//')
        server_dist=$(echo $server_dist | sed 's/ .*//')
        server_ping=$(echo $server_ping | sed 's/ .*//')
    fi

    mdebug "start: '$start'"
    mdebug "stop: '$stop'"
    mdebug "from: '$from'"
    mdebug "from_ip: '$from_ip'"
    mdebug "server: '$server'"
    mdebug "server_dist: '$server_dist'"
    mdebug "server_ping: '$server_ping'"
    mdebug "download: '$download'"
    mdebug "upload: '$upload'"
    mdebug "share_url: '$share_url'"
fi


# Output CSV results
sep="$quote$sep$quote"
printf "$quote$start$sep$stop$sep$from$sep$from_ip$sep$server$sep$server_dist$sep$server_ping$sep$download$sep$upload$sep$share_url$quote\n"

##Save SQLITE3
sqlite3 /etc/pihole/speedtest.db  "insert into speedtest values (NULL, '${start}', '${stop}', '${from}', '${from_ip}', '${server}', ${server_dist}, ${server_ping}, ${download}, ${upload}, '${share_url}');"