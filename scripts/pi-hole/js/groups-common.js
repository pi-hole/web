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

  // Enable custom input field only if applicable
  var ip = $("#select") ? $("#select").val() : null;
  if (ip !== null && ip !== "custom") {
    ip = $("#ip-custom").attr("disabled", true);
  }
}

// Pi-hole IPv4/CIDR validator by DL6ER, see regexr.com/50csh
function validateIPv4CIDR(ip) {
  // One IPv4 element is 8bit: 0 - 256
  var ipv4elem = "(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)";
  // CIDR for IPv4 is 1 - 32 bit
  var v4cidr = "(\\/([1-9]|[1-2][0-9]|3[0-2])){0,1}";
  var ipv4validator = new RegExp(
    "^" + ipv4elem + "\\." + ipv4elem + "\\." + ipv4elem + "\\." + ipv4elem + v4cidr + "$"
  );
  return ipv4validator.test(ip);
}

// Pi-hole IPv6/CIDR validator by DL6ER, see regexr.com/50csn
function validateIPv6CIDR(ip) {
  // One IPv6 element is 16bit: 0000 - FFFF
  var ipv6elem = "[0-9A-Fa-f]{1,4}";
  // CIDR for IPv6 is 1- 128 bit
  var v6cidr = "(\\/([1-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8])){0,1}";
  var ipv6validator = new RegExp(
    "^(((?:" +
      ipv6elem +
      "))((?::" +
      ipv6elem +
      "))*::((?:" +
      ipv6elem +
      "))*((?::" +
      ipv6elem +
      "))*|((?:" +
      ipv6elem +
      "))((?::" +
      ipv6elem +
      ")){7})" +
      v6cidr +
      "$"
  );
  return ipv6validator.test(ip);
}

function bsSelect_defaults() {
  // set bootstrap-select defaults
  var pickerDEFAULTS = $.fn.selectpicker.Constructor.DEFAULTS;
  pickerDEFAULTS.noneSelectedText = "none selected";
  pickerDEFAULTS.selectedTextFormat = "count > 1";
  pickerDEFAULTS.actionsBox = true;
  pickerDEFAULTS.width = "fit";
  pickerDEFAULTS.container = "body";
  pickerDEFAULTS.dropdownAlignRight = "auto";
  pickerDEFAULTS.selectAllText = "All";
  pickerDEFAULTS.deselectAllText = "None";
  pickerDEFAULTS.countSelectedText = function(num, total) {
    if (num === total) {
      return "All selected (" + num + ")";
    }

    return num + " selected";
  };
}

window.utils = (function() {
  return {
    showAlert: showAlert,
    datetime: datetime,
    disableAll: disableAll,
    enableAll: enableAll,
    validateIPv4CIDR: validateIPv4CIDR,
    validateIPv6CIDR: validateIPv6CIDR,
    bsSelect_defaults: bsSelect_defaults
  };
})();
