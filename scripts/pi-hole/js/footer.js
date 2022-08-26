/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */
//The following functions allow us to display time until pi-hole is enabled after disabling.
//Works between all pages

function secondsTimeSpanToHMS(s) {
  var h = Math.floor(s / 3600); //Get whole hours
  s -= h * 3600;
  var m = Math.floor(s / 60); //Get remaining minutes
  s -= m * 60;
  return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s); //zero padding on minutes and seconds
}

function countDown() {
  var ena = $("#pihole-enable");
  var enaLabel = $("#enableLabel");
  var dis = $("#pihole-disable");
  var enaT = $("#enableTimer");
  var target = new Date(parseInt(enaT.html(), 10));
  var seconds = Math.round((target.getTime() - Date.now()) / 1000);

  //Stop and remove timer when user enabled early
  if (ena.hasClass("hidden")) {
    enaLabel.text("Enable Blocking");
    return;
  }

  if (seconds > 0) {
    setTimeout(countDown, 1000);
    enaLabel.text("Enable Blocking (" + secondsTimeSpanToHMS(seconds) + ")");
  } else {
    enaLabel.text("Enable Blocking");
    // close the "Disable Blocking" menu
    dis.removeClass("menu-open");
    dis[0].querySelector("ul").style.display = "none";
    if (localStorage) {
      localStorage.removeItem("countDownTarget");
    }
  }
}

function piholeChange(action, duration) {
  var token = encodeURIComponent($("#token").text());
  var enaT = $("#enableTimer");
  var btnStatus;
  var dis = $("#pihole-disable");
  var ena = $("#pihole-enable");

  switch (action) {
    case "enable":
      btnStatus = $("#flip-status-enable");
      btnStatus.html("<i class='fa fa-spinner'> </i>");
      $.getJSON("api.php?enable&token=" + token, function (data) {
        if (data.status === "enabled") {
          btnStatus.html("");
          updatePiholeStatus(true);
          // close the "Disable Blocking" menu
          dis.removeClass("menu-open");
          dis[0].querySelector("ul").style.display = "none";
        }
      });
      break;

    case "disable":
      btnStatus = $("#flip-status-disable");
      btnStatus.html("<i class='fa fa-spinner'> </i>");
      $.getJSON("api.php?disable=" + duration + "&token=" + token, function (data) {
        if (data.status === "disabled") {
          btnStatus.html("");
          // we need to remove the hidden already before updatePiholeStatus() because getting the data from the API can be slow
          // and we run into an race condition with countDown checking for that class
          ena.removeClass("hidden");
          updatePiholeStatus(true);
          if (duration > 0) {
            enaT.html(Date.now() + duration * 1000);
            setTimeout(countDown, 100);
          }
        }
      });
      break;

    default:
    // nothing
  }
}

// sets the status indicator and toggles enable/disable/(restart DNS) blocking
function updatePiholeStatus(once) {
  $.getJSON("api.php?pihole-status", function (data) {
    var pistatus = data["pihole-status"];

    var status = $("#status");
    var ena = $("#pihole-enable");
    var dis = $("#pihole-disable");
    var restart = $("#pihole-restart");
    switch (true) {
      case pistatus === 53:
        status.html("<i class='fa fa-w fa-circle text-green-light'></i> Active");
        ena.addClass("hidden");
        dis.removeClass("hidden");
        restart.addClass("hidden");
        break;

      case pistatus === 0:
        status.html("<i class='fa fa-w fa-circle text-red'></i> Blocking disabled");
        dis.addClass("hidden");
        ena.removeClass("hidden");
        restart.addClass("hidden");
        break;

      case pistatus === -1:
        status.html("<i class='fa fa-w fa-circle text-red'></i> DNS service not running");
        restart.removeClass("hidden");
        dis.addClass("hidden");
        ena.addClass("hidden");
        break;

      case pistatus > 0:
        status.html(
          "<i class='fa fa-w fa-circle text-orange'></i> DNS service on port " + pistatus
        );
        ena.addClass("hidden");
        dis.removeClass("hidden");
        restart.addClass("hidden");
        break;

      default:
        status.html("<i class='fa fa-w fa-circle text-red'></i> Unknown");
        restart.removeClass("hidden");
        dis.addClass("hidden");
        ena.addClass("hidden");
    }
  }).done(function () {
    // Reload function every second if not asked to run only once
    if (!once) {
      setTimeout(updatePiholeStatus, 1000);
    }
  });
}

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

function initCheckboxRadioStyle() {
  function getCheckboxURL(style) {
    var extra = style.startsWith("material-") ? "material" : "bootstrap";
    return "style/vendor/icheck-" + extra + ".min.css";
  }

  function applyCheckboxRadioStyle(style) {
    boxsheet.attr("href", getCheckboxURL(style));
    // Get all radio/checkboxes for theming, with the exception of the two radio buttons on the custom disable timer,
    // as well as every element with an id that starts with "status_"
    var sel = $("input[type='radio'],input[type='checkbox']")
      .not("#selSec")
      .not("#selMin")
      .not("[id^=status_]");
    sel.parent().removeClass();
    sel.parent().addClass("icheck-" + style);
  }

  // Read from local storage, initialize if needed
  var chkboxStyle = localStorage ? localStorage.getItem("theme_icheck") : null;
  if (chkboxStyle === null) {
    chkboxStyle = "primary";
  }

  var boxsheet = $('<link href="' + getCheckboxURL(chkboxStyle) + '" rel="stylesheet" />');
  boxsheet.appendTo("head");

  applyCheckboxRadioStyle(chkboxStyle);

  // Add handler when on settings page
  var iCheckStyle = $("#iCheckStyle");
  if (iCheckStyle !== null) {
    iCheckStyle.val(chkboxStyle);
    iCheckStyle.change(function () {
      var themename = $(this).val();
      localStorage.setItem("theme_icheck", themename);
      applyCheckboxRadioStyle(themename);
    });
  }
}

function initCPUtemp() {
  function setCPUtemp(unit) {
    if (localStorage) {
      localStorage.setItem("tempunit", tempunit);
    }

    var temperature = parseFloat($("#rawtemp").text());
    var displaytemp = $("#tempdisplay");
    if (!isNaN(temperature)) {
      switch (unit) {
        case "K":
          temperature += 273.15;
          displaytemp.html(temperature.toFixed(1) + "&nbsp;K");
          break;

        case "F":
          temperature = (temperature * 9) / 5 + 32;
          displaytemp.html(temperature.toFixed(1) + "&nbsp;&deg;F");
          break;

        default:
          displaytemp.html(temperature.toFixed(1) + "&nbsp;&deg;C");
          break;
      }
    }
  }

  // Read from local storage, initialize if needed
  var tempunit = localStorage ? localStorage.getItem("tempunit") : null;
  if (tempunit === null) {
    tempunit = "C";
  }

  setCPUtemp(tempunit);

  // Add handler when on settings page
  var tempunitSelector = $("#tempunit-selector");
  if (tempunitSelector !== null) {
    tempunitSelector.val(tempunit);
    tempunitSelector.change(function () {
      tempunit = $(this).val();
      setCPUtemp(tempunit);
    });
  }
}

$(function () {
  var enaT = $("#enableTimer");
  var target = new Date(parseInt(enaT.html(), 10));
  var seconds = Math.round((target.getTime() - Date.now()) / 1000);
  if (seconds > 0) {
    setTimeout(countDown, 100);
  }

  updatePiholeStatus();

  if (!testCookies() && $("#cookieInfo").length > 0) {
    $("#cookieInfo").show();
  }

  // Apply per-browser styling settings
  initCheckboxRadioStyle();
  initCPUtemp();

  // Run check immediately after page loading ...
  utils.checkMessages();
  // ... and once again with five seconds delay
  setTimeout(utils.checkMessages, 5000);
});

// Handle Enable/Disable
$("#pihole-enable").on("click", function (e) {
  e.preventDefault();
  localStorage.removeItem("countDownTarget");
  piholeChange("enable", "");
});
$("#pihole-disable-indefinitely").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "0");
});
$("#pihole-disable-10s").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "10");
});
$("#pihole-disable-30s").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "30");
});
$("#pihole-disable-5m").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "300");
});
$("#pihole-disable-custom").on("click", function (e) {
  e.preventDefault();
  var custVal = $("#customTimeout").val();
  custVal = $("#btnMins").hasClass("active") ? custVal * 60 : custVal;
  piholeChange("disable", custVal);
});

// Handle Ctrl + Enter button on Login page
$(document).keypress(function (e) {
  if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey && $("#loginpw").is(":focus")) {
    $("#loginform").attr("action", "settings.php");
    $("#loginform").submit();
  }
});
