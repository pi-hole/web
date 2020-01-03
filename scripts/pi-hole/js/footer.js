/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

//The following functions allow us to display time until pi-hole is enabled after disabling.
//Works between all pages

function secondsTimeSpanToHMS(s) {
  var h = Math.floor(s / 3600); //Get whole hours
  s -= h * 3600;
  var m = Math.floor(s / 60); //Get remaining minutes
  s -= m * 60;
  return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s); //zero padding on minutes and seconds
}

function piholeChanged(action) {
  var status = $("#status");
  var ena = $("#pihole-enable");
  var dis = $("#pihole-disable");

  switch (action) {
    case "enabled":
      status.html("<i class='fa fa-circle text-green-light'></i> Active");
      ena.hide();
      dis.show();
      dis.removeClass("active");
      break;

    case "disabled":
      status.html("<i class='fa fa-circle text-red'></i> Offline");
      ena.show();
      dis.hide();
      break;

    default:
    // nothing
  }
}

function countDown() {
  var ena = $("#enableLabel");
  var enaT = $("#enableTimer");
  var target = new Date(parseInt(enaT.html()));
  var seconds = Math.round((target.getTime() - new Date().getTime()) / 1000);

  if (seconds > 0) {
    setTimeout(countDown, 1000);
    ena.text("Enable (" + secondsTimeSpanToHMS(seconds) + ")");
  } else {
    ena.text("Enable");
    piholeChanged("enabled");
    localStorage.removeItem("countDownTarget");
  }
}

function piholeChange(action, duration) {
  var token = encodeURIComponent($("#token").text());
  var enaT = $("#enableTimer");
  var btnStatus;

  switch (action) {
    case "enable":
      btnStatus = $("#flip-status-enable");
      btnStatus.html("<i class='fa fa-spinner'> </i>");
      $.getJSON("api.php?enable&token=" + token, function(data) {
        if (data.status === "enabled") {
          btnStatus.html("");
          piholeChanged("enabled");
        }
      });
      break;

    case "disable":
      btnStatus = $("#flip-status-disable");
      btnStatus.html("<i class='fa fa-spinner'> </i>");
      $.getJSON("api.php?disable=" + duration + "&token=" + token, function(data) {
        if (data.status === "disabled") {
          btnStatus.html("");
          piholeChanged("disabled");
          if (duration > 0) {
            enaT.html(new Date().getTime() + duration * 1000);
            setTimeout(countDown, 100);
          }
        }
      });
      break;

    default:
    // nothing
  }
}

$(document).ready(function() {
  var enaT = $("#enableTimer");
  var target = new Date(parseInt(enaT.html()));
  var seconds = Math.round((target.getTime() - new Date().getTime()) / 1000);
  if (seconds > 0) {
    setTimeout(countDown, 100);
  }
});

// Handle Enable/Disable
$("#pihole-enable").on("click", function(e) {
  e.preventDefault();
  localStorage.removeItem("countDownTarget");
  piholeChange("enable", "");
});
$("#pihole-disable-permanently").on("click", function(e) {
  e.preventDefault();
  piholeChange("disable", "0");
});
$("#pihole-disable-10s").on("click", function(e) {
  e.preventDefault();
  piholeChange("disable", "10");
});
$("#pihole-disable-30s").on("click", function(e) {
  e.preventDefault();
  piholeChange("disable", "30");
});
$("#pihole-disable-5m").on("click", function(e) {
  e.preventDefault();
  piholeChange("disable", "300");
});
$("#pihole-disable-custom").on("click", function(e) {
  e.preventDefault();
  var custVal = $("#customTimeout").val();
  custVal = $("#btnMins").hasClass("active") ? custVal * 60 : custVal;
  piholeChange("disable", custVal);
});

// Session timer
var sessionTimerCounter = document.getElementById("sessiontimercounter");
var sessionvalidity = parseInt(sessionTimerCounter.textContent);
var start = new Date();

function updateSessionTimer() {
  start = new Date();
  start.setSeconds(start.getSeconds() + sessionvalidity);
}

if (sessionvalidity > 0) {
  // setSeconds will correctly handle wrap-around cases
  updateSessionTimer();

  setInterval(function() {
    var current = new Date();
    var totalseconds = (start - current) / 1000;
    var minutes = Math.floor(totalseconds / 60);
    if (minutes < 10) {
      minutes = "0" + minutes;
    }

    var seconds = Math.floor(totalseconds % 60);
    if (seconds < 10) {
      seconds = "0" + seconds;
    }

    if (totalseconds > 0) {
      sessionTimerCounter.textContent = minutes + ":" + seconds;
    } else {
      sessionTimerCounter.textContent = "-- : --";
    }
  }, 1000);
} else {
  document.getElementById("sessiontimer").style.display = "none";
}

// Handle Strg + Enter button on Login page
$(document).keypress(function(e) {
  if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey && $("#loginpw").is(":focus")) {
    $("#loginform").attr("action", "settings.php");
    $("#loginform").submit();
  }
});

function testCookies() {
  if (navigator.cookieEnabled) {
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
  if (!testCookies() && $("#cookieInfo").length) {
    $("#cookieInfo").show();
  }
});
