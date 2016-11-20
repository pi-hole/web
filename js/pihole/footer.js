// User menu toggle
$("#dropdown-menu a").on("click", function(event) {
    $(this).parent().toggleClass("open");
});
$("body").on("click", function(event) {
    if(!$("#dropdown-menu").is(event.target) && $("#dropdown-menu").has(event.target).length === 0) {
        $("#dropdown-menu").removeClass("open");
    }
});

var piholeVersion = $("#piholeVersion").html();
var webVersion = $("#webVersion").html();

// Credit for following function: https://gist.github.com/alexey-bass/1115557
function versionCompare(left, right) {
    if (typeof left + typeof right != 'stringstring')
        return false;

    var a = left.split('.')
        ,   b = right.split('.')
        ,   i = 0, len = Math.max(a.length, b.length);

    for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
            return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
            return -1;
        }
    }

    return 0;
}

// Update check
$.getJSON("https://api.github.com/repos/pi-hole/pi-hole/releases/latest", function(json) {
    // Skip if on dev
    if(piholeVersion !== "vDev" && versionCompare(piholeVersion, json.tag_name.slice(1)) < 0) {
        // Alert user
        $("#piholeVersion").html($("#piholeVersion").text() + '<a class="alert-link" href="https://github.com/pi-hole/pi-hole/releases">(Update available!)</a>');
        $("#alPiholeUpdate").show();
    }
});
$.getJSON("https://api.github.com/repos/pi-hole/AdminLTE/releases/latest", function(json) {
    // Skip if on dev
    if(webVersion !== "vDev" && versionCompare(webVersion, json.tag_name.slice(1)) < 0) {
        // Alert user
        $("#webVersion").html($("#webVersion").text() + '<a class="alert-link" href="https://github.com/pi-hole/adminLTE/releases">(Update available!)</a>');
        $("#alWebUpdate").show();
    }
});

/*
 * Make sure that Pi-hole is updated to at least v2.7, since that is needed to use the sudo
 * features of the interface. Skip if on dev
 */
if(piholeVersion !== "vDev" && versionCompare(piholeVersion, "v2.7") < 0)
    alert("Pi-hole needs to be updated to at least v2.7 before you can use features such as whitelisting/blacklisting from this web interface!")

// Session timer
var sessionvalidity = parseInt(document.getElementById("sessiontimercounter").textContent);
var start = new Date;

function updateSessionTimer()
{
    start = new Date;
    start.setSeconds(start.getSeconds() + sessionvalidity);
}

if(sessionvalidity > 0)
{
    // setSeconds will correctly handle wrap-around cases
    updateSessionTimer();

    setInterval(function() {
        var current = new Date;
        var total_seconds = (start - current) / 1000;

        // var hours = Math.floor(total_seconds / 3600);
        // total_seconds = total_seconds % 3600;
        // hours = pretty_time_string(hours);

        var minutes = Math.floor(total_seconds / 60);
        if(minutes < 10) minutes = "0" + minutes;

        var seconds = Math.floor(total_seconds % 60);
        if(seconds < 10) seconds = "0" + seconds;

        if(total_seconds > 0)
            document.getElementById("sessiontimercounter").textContent = minutes + ":" + seconds;
        else
            document.getElementById("sessiontimercounter").textContent = "-- : --";

        $('.timer').text(currentTimeString);
    }, 1000);
}
else
{
    document.getElementById("sessiontimer").style.display = 'none';
}
