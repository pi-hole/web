/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global onAuth:false */

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
  var target = new Date(parseInt(enaT.html(), 10));
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
      $.getJSON("api.php?enable&token=" + token, function (data) {
        if (data.status === "enabled") {
          btnStatus.html("");
          piholeChanged("enabled");
        }
      });
      break;

    case "disable":
      btnStatus = $("#flip-status-disable");
      btnStatus.html("<i class='fa fa-spinner'> </i>");
      $.getJSON("api.php?disable=" + duration + "&token=" + token, function (data) {
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

function checkMessages() {
  /*
  $.getJSON("api_db.php?status", function (data) {
    if ("message_count" in data && data.message_count > 0) {
      var title =
        data.message_count > 1
          ? "There are " + data.message_count + " warnings. Click for further details."
          : "There is one warning. Click for further details.";

      $("#pihole-diagnosis").prop("title", title);
      $("#pihole-diagnosis-count").text(data.message_count);
      $("#pihole-diagnosis").removeClass("hidden");
    }
  });
*/
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
    // Get all radio/checkboxes for theming, with the exception of the two radio buttons on the custom disable timer
    var sel = $("input[type='radio'],input[type='checkbox']").not("#selSec").not("#selMin");
    sel.parent().removeClass();
    sel.parent().addClass("icheck-" + style);
  }

  // Read from local storage, initialize if needed
  var chkboxStyle = localStorage.getItem("theme_icheck");
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
    localStorage.setItem("tempunit", tempunit);
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
  var tempunit = localStorage.getItem("tempunit");
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

function checkAuth() {
  $.getJSON("/api/auth")
    .done(function(data) {
      onAuth(data.session.valid);
      if(data.session.valid) {
        $(".needs-auth").show();
        $(".menu-login").hide();
      } else {
        $(".needs-auth").hide();
        $(".menu-login").show();
      }
    });
}

function doLogout() {
  $.ajax({
    url: "/api/auth",
    method: "DELETE"
  }).fail(function (data) {
    if(data.status == 410)
      location.reload();
  });
}

function updateSysInfo() {
  $.ajax({
    url: "/api/ftl/system"
  }).done(function (data) {
    var memory = 100.0 * data.memory.ram.used / data.memory.ram.total;
    $("#memory").html(memory.toFixed(1) + "&thinsp;%");
    var totalGB = 1e-9*data.memory.ram.total;
    $("#memory").prop("title", "Total memory: " + totalGB.toFixed(1) + " GB");
    if(memory > 75)
    {
      $("#memory_icon").addClass("text-red");
      $("#memory_icon").removeClass("text-green-light");
    }
    else
    {
      $("#memory_icon").removeClass("text-red");
      $("#memory_icon").addClass("text-green-light");
    }
    $("#cpu").html(data.cpu.percent[0].toFixed(1) + "&thinsp;%&nbsp;&nbsp;" + data.cpu.percent[1].toFixed(1) + "&thinsp;%&nbsp;&nbsp;" + data.cpu.percent[2].toFixed(1) + "&thinsp;%");
    $("#cpu").prop("title", "Load: " + data.cpu.load[0].toFixed(2) + " " + data.cpu.load[1].toFixed(2) + " " + data.cpu.load[2].toFixed(2) + ", number of cores: " + data.cpu.nprocs);
    if(data.cpu.percent[0] > 100)
    {
      $("#cpu_icon").addClass("text-red");
      $("#cpu_icon").removeClass("text-green-light");
    }
    else
    {
      $("#cpu_icon").removeClass("text-red");
      $("#cpu_icon").addClass("text-green-light");
    }
    if(data.sensors.length > 0)
    {
      $("#temperature").html(data.sensors[0].value + "&thinsp;&deg;C");
      if(data.sensors[0].value > 50)
      {
        $("#temperature_icon").addClass("text-red");
        $("#temperature_icon").removeClass("text-vivid-blue");
      }
      else
      {
        $("#temperature_icon").removeClass("text-red");
        $("#temperature_icon").addClass("text-vivid-blue");
      }
    }
    else
    {
      $("#temperature").html("N/A");
      $("#temperature_icon").addClass("text-vivid-blue");
    }
    $("#temperature").prop("title", "System uptime: " + moment.duration(1000*data.uptime).humanize());

    // Update every 60 seconds
    setTimeout(updateSysInfo, 60000);
  });
}

$(function () {
  checkAuth();
  updateSysInfo();
  var enaT = $("#enableTimer");
  var target = new Date(parseInt(enaT.html(), 10));
  var seconds = Math.round((target.getTime() - new Date().getTime()) / 1000);
  if (seconds > 0) {
    setTimeout(countDown, 100);
  }

  if (!testCookies() && $("#cookieInfo").length > 0) {
    $("#cookieInfo").show();
  }

  // Apply per-browser styling settings
  initCheckboxRadioStyle();
  initCPUtemp();

  // Run check immediately after page loading ...
  checkMessages();
  // ... and once again with five seconds delay
  setTimeout(checkMessages, 5000);
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
