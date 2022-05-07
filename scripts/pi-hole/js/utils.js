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
    "'": "&#039;",
  };

  if (text === null) return null;

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function unescapeHtml(text) {
  var map = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&Uuml;": "Ü",
    "&uuml;": "ü",
    "&Auml;": "Ä",
    "&auml;": "ä",
    "&Ouml;": "Ö",
    "&ouml;": "ö",
    "&szlig;": "ß",
  };

  if (text === null) return null;

  return text.replace(
    /&(?:amp|lt|gt|quot|#039|Uuml|uuml|Auml|auml|Ouml|ouml|szlig);/g,
    function (m) {
      return map[m];
    }
  );
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
        message: message,
      };
      info = $.notify(opts);
      break;
    case "success":
      opts = {
        type: "success",
        icon: icon,
        title: title,
        message: message,
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
        message: message,
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
        message: message,
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

function datetime(date, html) {
  var format = html === false ? "Y-MM-DD HH:mm:ss z" : "Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z";
  return moment.unix(Math.floor(date)).format(format).trim();
}

function datetimeRelative(date) {
  return moment.unix(Math.floor(date)).fromNow();
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
      "))*((?::" +
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

function validateMAC(mac) {
  var macvalidator = new RegExp(/^([\da-fA-F]{2}:){5}([\da-fA-F]{2})$/);
  return macvalidator.test(mac);
}

function validateHostname(name) {
  var namevalidator = new RegExp(/[^<>;"]/);
  return namevalidator.test(name);
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

var backupStorage = {};
function stateSaveCallback(itemName, data) {
  if (localStorage === null) {
    backupStorage[itemName] = JSON.stringify(data);
  } else {
    localStorage.setItem(itemName, JSON.stringify(data));
  }
}

function stateLoadCallback(itemName) {
  var data;
  // Receive previous state from client's local storage area
  if (localStorage === null) {
    var item = backupStorage[itemName];
    data = typeof item === "undefined" ? null : item;
  } else {
    data = localStorage.getItem(itemName);
  }

  // Return if not available
  if (data === null) {
    return null;
  }

  // Parse JSON string
  data = JSON.parse(data);

  // Clear possible filtering settings
  data.columns.forEach(function (value, index) {
    data.columns[index].search.search = "";
  });

  // Always start on the first page to show most recent queries
  data.start = 0;
  // Always start with empty search field
  data.search.search = "";
  // Apply loaded state to table
  return data;
}

function getGraphType() {
  // Only return line if `barchart_chkbox` is explicitly set to false. Else return bar
  return localStorage && localStorage.getItem("barchart_chkbox") === "false" ? "line" : "bar";
}

function addFromQueryLog(domain, list) {
  var token = $("#token").text();
  var alertModal = $("#alertModal");
  var alProcessing = alertModal.find(".alProcessing");
  var alSuccess = alertModal.find(".alSuccess");
  var alFailure = alertModal.find(".alFailure");
  var alNetworkErr = alertModal.find(".alFailure #alNetErr");
  var alCustomErr = alertModal.find(".alFailure #alCustomErr");
  var alList = "#alList";
  var alDomain = "#alDomain";

  // Exit the function here if the Modal is already shown (multiple running interlock)
  if (alertModal.css("display") !== "none") {
    return;
  }

  var listtype = list === "white" ? "Whitelist" : "Blacklist";

  alProcessing.children(alDomain).text(domain);
  alProcessing.children(alList).text(listtype);
  alertModal.modal("show");

  // add Domain to List after Modal has faded in
  alertModal.one("shown.bs.modal", function () {
    $.ajax({
      url: "scripts/pi-hole/php/groups.php",
      method: "post",
      data: {
        domain: domain,
        list: list,
        token: token,
        action: "replace_domain",
        comment: "Added from Query Log",
      },
      success: function (response) {
        alProcessing.hide();
        if (!response.success) {
          // Failure
          alNetworkErr.hide();
          alCustomErr.html(response.message);
          alFailure.fadeIn(1000);
          setTimeout(function () {
            alertModal.modal("hide");
          }, 10000);
        } else {
          // Success
          alSuccess.children(alDomain).text(domain);
          alSuccess.children(alList).text(listtype);
          alSuccess.fadeIn(1000);
          setTimeout(function () {
            alertModal.modal("hide");
          }, 2000);
        }
      },
      error: function () {
        // Network Error
        alProcessing.hide();
        alNetworkErr.show();
        alFailure.fadeIn(1000);
        setTimeout(function () {
          alertModal.modal("hide");
        }, 8000);
      },
    });
  });

  // Reset Modal after it has faded out
  alertModal.one("hidden.bs.modal", function () {
    alProcessing.show();
    alSuccess.add(alFailure).hide();
    alProcessing.add(alSuccess).children(alDomain).html("").end().children(alList).html("");
    alCustomErr.html("");
  });
}

// Helper functions to format the progress bars used on the Dashboard and Long-term Lists
function addTD(content) {
  return "<td>" + content + "</td> ";
}

function colorBar(percentage, total, cssClass) {
  var title = percentage.toFixed(1) + "% of " + total;
  var bar = '<div class="progress-bar ' + cssClass + '" style="width: ' + percentage + '%"></div>';
  return '<div class="progress progress-sm" title="' + title + '"> ' + bar + " </div>";
}

function checkMessages() {
  var ignoreNonfatal = localStorage
    ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") === "true"
    : false;
  $.getJSON("api_db.php?status" + (ignoreNonfatal ? "&ignore=DNSMASQ_WARN" : ""), function (data) {
    if ("message_count" in data && data.message_count > 0) {
      var more = '\nAccess "Tools/Pi-hole diganosis" for further details.';
      var title =
        data.message_count > 1
          ? "There are " + data.message_count + " warnings." + more
          : "There is one warning." + more;

      $(".warning-count").prop("title", title);
      $(".warning-count").text(data.message_count);
      $(".warning-count").removeClass("hidden");
    } else {
      $(".warning-count").addClass("hidden");
    }
  });
}

// Show only the appropriate delete buttons in datatables
function changeBulkDeleteStates(table) {
  var allRows = table.rows({ filter: "applied" }).data().length;
  var pageLength = table.page.len();
  var selectedRows = table.rows(".selected").data().length;

  if (selectedRows === 0) {
    // Nothing selected
    $(".selectAll").removeClass("hidden");
    $(".selectMore").addClass("hidden");
    $(".removeAll").addClass("hidden");
    $(".deleteSelected").addClass("hidden");
  } else if (selectedRows >= pageLength || selectedRows === allRows) {
    // Whole page is selected (or all available messages were selected)
    $(".selectAll").addClass("hidden");
    $(".selectMore").addClass("hidden");
    $(".removeAll").removeClass("hidden");
    $(".deleteSelected").removeClass("hidden");
  } else {
    // Some rows are selected, but not all
    $(".selectAll").addClass("hidden");
    $(".selectMore").removeClass("hidden");
    $(".removeAll").addClass("hidden");
    $(".deleteSelected").removeClass("hidden");
  }
}

window.utils = (function () {
  return {
    escapeHtml: escapeHtml,
    unescapeHtml: unescapeHtml,
    objectToArray: objectToArray,
    padNumber: padNumber,
    showAlert: showAlert,
    datetime: datetime,
    datetimeRelative: datetimeRelative,
    disableAll: disableAll,
    enableAll: enableAll,
    validateIPv4CIDR: validateIPv4CIDR,
    validateIPv6CIDR: validateIPv6CIDR,
    setBsSelectDefaults: setBsSelectDefaults,
    stateSaveCallback: stateSaveCallback,
    stateLoadCallback: stateLoadCallback,
    getGraphType: getGraphType,
    validateMAC: validateMAC,
    validateHostname: validateHostname,
    addFromQueryLog: addFromQueryLog,
    addTD: addTD,
    colorBar: colorBar,
    checkMessages: checkMessages,
    changeBulkDeleteStates: changeBulkDeleteStates,
  };
})();
