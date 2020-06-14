/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false */

// Credit: https://stackoverflow.com/a/4835406
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

// Helper function for converting Objects to Arrays after sorting the keys
function objectToArray(obj) {
  var arr = [];
  var idx = [];
  var keys = Object.keys(obj);

  keys.sort(function (a, b) {
    return a - b;
  });

  for (var i = 0; i < keys.length; i++) {
    arr.push(obj[keys[i]]);
    idx.push(keys[i]);
  }

  return [idx, arr];
}

function padNumber(num) {
  return ("00" + num).substr(-2, 2);
}

var info = null; // TODO clear this up; there shouldn't be a global var here
function showAlert(type, icon, title, message) {
  var opts = {};
  title = "&nbsp;<strong>" + title + "</strong><br>";
  switch (type) {
    case "info":
      opts = {
        type: "info",
        icon: "far fa-clock",
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
        icon: "fas fa-exclamation-triangle",
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
        icon: "fas fa-times",
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
  return moment.unix(Math.floor(date)).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
}

function disableAll() {
  $("input").prop("disabled", true);
  $("select").prop("disabled", true);
  $("button").prop("disabled", true);
  $("textarea").prop("disabled", true);
}

function enableAll() {
  $("input").prop("disabled", false);
  $("select").prop("disabled", false);
  $("button").prop("disabled", false);
  $("textarea").prop("disabled", false);

  // Enable custom input field only if applicable
  var ip = $("#select") ? $("#select").val() : null;
  if (ip !== null && ip !== "custom") {
    $("#ip-custom").prop("disabled", true);
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

// set bootstrap-select defaults
function setBsSelectDefaults() {
  var bsSelectDefaults = $.fn.selectpicker.Constructor.DEFAULTS;
  bsSelectDefaults.noneSelectedText = "none selected";
  bsSelectDefaults.selectedTextFormat = "count > 1";
  bsSelectDefaults.actionsBox = true;
  bsSelectDefaults.width = "fit";
  bsSelectDefaults.container = "body";
  bsSelectDefaults.dropdownAlignRight = "auto";
  bsSelectDefaults.selectAllText = "All";
  bsSelectDefaults.deselectAllText = "None";
  bsSelectDefaults.countSelectedText = function (num, total) {
    if (num === total) {
      return "All selected (" + num + ")";
    }

    return num + " selected";
  };
}

function stateSaveCallback(itemName, data) {
  localStorage.setItem(itemName, JSON.stringify(data));
}

function stateLoadCallback(itemName) {
  // Receive previous state from client's local storage area
  var data = localStorage.getItem(itemName);
  // Return if not available
  if (data === null) {
    return null;
  }

  data = JSON.parse(data);
  // Always start on the first page to show most recent queries
  data.start = 0;
  // Always start with empty search field
  data.search.search = "";
  // Apply loaded state to table
  return data;
}

function getGraphType() {
  // Only return line if `barchart_chkbox` is explicitly set to false. Else return bar
  return localStorage.getItem("barchart_chkbox") === "false" ? "line" : "bar";
}

window.utils = (function () {
  return {
    escapeHtml: escapeHtml,
    objectToArray: objectToArray,
    padNumber: padNumber,
    showAlert: showAlert,
    datetime: datetime,
    disableAll: disableAll,
    enableAll: enableAll,
    validateIPv4CIDR: validateIPv4CIDR,
    validateIPv6CIDR: validateIPv6CIDR,
    setBsSelectDefaults: setBsSelectDefaults,
    stateSaveCallback: stateSaveCallback,
    stateLoadCallback: stateLoadCallback,
    getGraphType: getGraphType
  };
})();
