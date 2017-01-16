// User menu toggle
$("#dropdown-menu a").on("click", function(event) {
    $(this).parent().toggleClass("open");
});
$("body").on("click", function(event) {
    if(!$("#dropdown-menu").is(event.target) && $("#dropdown-menu").has(event.target).length === 0) {
        $("#dropdown-menu").removeClass("open");
    }
});

function piholeChanged(action)
{
    var status = $("#status");
    var ena = $("#pihole-enable");
    var dis = $("#pihole-disable");

    switch(action) {
        case "enabled":
        status.html("<i class='fa fa-circle' style='color:#7FFF00'></i> Active");
        ena.hide();
        dis.show();
        dis.removeClass("active");
        break;

        case "disabled":
        status.html("<i class='fa fa-circle' style='color:#FF0000'></i> Offline");
        ena.show();
        dis.hide();
        break;
    }

}

function piholeChange(action, duration)
{
    var token = encodeURIComponent($("#token").html());
    var btnStatus;

    switch(action) {
        case "enable":
        btnStatus = $("#flip-status-enable");
        btnStatus.html("<i class='fa fa-spinner'> </i>");
        $.getJSON("api.php?enable&token=" + token, function(data) {
            if(data.status === "enabled") {
                btnStatus.html("");
                piholeChanged("enabled");
            }
        });
        break;

        case "disable":
        btnStatus = $("#flip-status-disable");
        btnStatus.html("<i class='fa fa-spinner'> </i>");
        $.getJSON("api.php?disable=" + duration + "&token=" + token, function(data) {
            if(data.status === "disabled") {
                btnStatus.html("");
                piholeChanged("disabled");
            }
        });
        break;
    }
}

// Handle Enable/Disable
$("#pihole-enable").on("click", function(e){
    e.preventDefault();
    piholeChange("enable","");
});
$("#pihole-disable-permanently").on("click", function(e){
    e.preventDefault();
    piholeChange("disable","0");
});
$("#pihole-disable-10s").on("click", function(e){
    e.preventDefault();
    piholeChange("disable","10");
    setTimeout(function(){piholeChanged("enabled");},10000);
});
$("#pihole-disable-30s").on("click", function(e){
    e.preventDefault();
    piholeChange("disable","30");
    setTimeout(function(){piholeChanged("enabled");},30000);
});
$("#pihole-disable-5m").on("click", function(e){
    e.preventDefault();
    piholeChange("disable","300");
    setTimeout(function(){piholeChanged("enabled");},300000);
});

var piholeVersion = $("#piholeVersion").html();
var webVersion = $("#webVersion").html();

// Credit for following function: https://gist.github.com/alexey-bass/1115557
// Modified to discard any possible "v" in the string
function versionCompare(left, right) {
    if (typeof left + typeof right !== "stringstring")
    {
        return false;
    }

    // If we are on vDev then we assume that it is always
    // newer than the latest online release, i.e. version
    // comparison should return 1
    if(left === "vDev")
    {
        return 1;
    }

    var aa = left.split("v"),
        bb = right.split("v");

    var a = aa[aa.length-1].split(".")
        ,   b = bb[bb.length-1].split(".")
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
    if(versionCompare(piholeVersion, json.tag_name.slice(1)) < 0) {
        // Alert user
        $("#piholeVersion").html($("#piholeVersion").text() + "<a class=\"alert-link\" href=\"https://github.com/pi-hole/pi-hole/releases\">(Update available!)</a>");
        $("#alPiholeUpdate").show();
    }
});
$.getJSON("https://api.github.com/repos/pi-hole/AdminLTE/releases/latest", function(json) {
    if(versionCompare(webVersion, json.tag_name.slice(1)) < 0) {
        // Alert user
        $("#webVersion").html($("#webVersion").text() + "<a class=\"alert-link\" href=\"https://github.com/pi-hole/adminLTE/releases\">(Update available!)</a>");
        $("#alWebUpdate").show();
    }
});

/*
 * Make sure that Pi-hole is updated to at least v2.7, since that is needed to use the sudo
 * features of the interface. Skip if on dev
 */
if(versionCompare(piholeVersion, "v2.7") < 0) {
    alert("Pi-hole needs to be updated to at least v2.7 before you can use features such as whitelisting/blacklisting from this web interface!");
}

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
        var totalseconds = (start - current) / 1000;

        // var hours = Math.floor(totalseconds / 3600);
        // totalseconds = totalseconds % 3600;

        var minutes = Math.floor(totalseconds / 60);
        if(minutes < 10){ minutes = "0" + minutes; }

        var seconds = Math.floor(totalseconds % 60);
        if(seconds < 10){ seconds = "0" + seconds; }

        if(totalseconds > 0)
        {
            document.getElementById("sessiontimercounter").textContent = minutes + ":" + seconds;
        }
        else
        {
            document.getElementById("sessiontimercounter").textContent = "-- : --";
        }

    }, 1000);
}
else
{
    document.getElementById("sessiontimer").style.display = "none";
}

// Hide "exact match" button on queryads.php page if version is 2.9.5 or lower
if(versionCompare(piholeVersion, "v2.9.5") < 1)
{
	$("#btnSearchExact").hide();
}

// Handle Strg + Enter button on Login page
$(document).keypress(function(e) {
	if((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey && $("#loginpw").is(":focus")) {
		$("#loginform").attr("action", "settings.php");
		$("#loginform").submit();
	}
});

function testCookies()
{
    if (navigator.cookieEnabled)
    {
        return true;
    }

    // set and read cookie
    document.cookie = "cookietest=1";
    var ret = document.cookie.indexOf("cookietest=") !== -1;

    // delete cookie
    document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";

    return ret;
}

$(function() {
    if(!testCookies() && $("#cookieInfo").length)
    {
        $("#cookieInfo").show();
    }
});
