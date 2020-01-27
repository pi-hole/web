/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false */

var info = null;
function showAlert(type, icon, title, message) {
  var opts = {};
  title = "&nbsp;<strong>" + title + "</strong><br>";
  switch (type) {
    case "info":
      opts = {
        type: "info",
        icon: "glyphicon glyphicon-time",
        title: title,
        message: message
      };
      info = $.notify(opts);
      break;
    case "success":
      opts = {
        type: "success",
        icon: icon,
        title: title,
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }

      break;
    case "warning":
      opts = {
        type: "warning",
        icon: "glyphicon glyphicon-warning-sign",
        title: title,
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }

      break;
    case "error":
      opts = {
        type: "danger",
        icon: "glyphicon glyphicon-remove",
        title: "&nbsp;<strong>Error, something went wrong!</strong><br>",
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }

      break;
    default:
  }
}

function datetime(date) {
  return moment.unix(Math.floor(date)).format("Y-MM-DD HH:mm:ss z");
}

function disableAll() {
  $("input").attr("disabled", true);
  $("select").attr("disabled", true);
  $("button").attr("disabled", true);
  $("textarea").attr("disabled", true);
}

function enableAll() {
  $("input").attr("disabled", false);
  $("select").attr("disabled", false);
  $("button").attr("disabled", false);
  $("textarea").attr("disabled", false);
}

window.utils = (function() {
  return {
    showAlert: showAlert,
    datetime: datetime,
    disableAll: disableAll,
    enableAll: enableAll
  };
})();
