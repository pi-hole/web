/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false, apiFailure: false, updateFtlInfo: false, NProgress:false */

$(function () {
  // CSRF protection for AJAX requests, this has to be configured globally
  // because we are using the jQuery $.ajax() function directly in some cases
  // Furthermore, has this to be done before any AJAX request is made so that
  // the CSRF token is sent along with each request to the API
  $.ajaxSetup({
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
  });
});

// Credit: https://stackoverflow.com/a/4835406
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  // Return early when text is not a string
  if (typeof text !== "string") return text;

  return text.replaceAll(/[&<>"']/g, function (m) {
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

  return text.replaceAll(
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

var showAlertBox = null;
function showAlert(type, icon, title, message, toast) {
  const options = {
      title: "&nbsp;<strong>" + escapeHtml(title) + "</strong><br>",
      message: escapeHtml(message),
      icon: icon,
    },
    settings = {
      type: type,
      delay: 5000, // default value
      mouse_over: "pause",
      animate: {
        enter: "animate__animated animate__fadeInDown",
        exit: "animate__animated animate__fadeOutUp",
      },
    };
  switch (type) {
    case "info":
      options.icon = icon !== null && icon.len > 0 ? icon : "fas fa-clock";

      break;
    case "success":
      break;
    case "warning":
      options.icon = "fas fa-exclamation-triangle";
      settings.delay *= 2;

      break;
    case "error":
      options.icon = "fas fa-times";
      if (title.length === 0)
        options.title = "&nbsp;<strong>Error, something went wrong!</strong><br>";
      settings.delay *= 2;

      // If the message is an API object, nicely format the error message
      // Try to parse message as JSON
      try {
        var data = JSON.parse(message);
        console.log(data); // eslint-disable-line no-console
        if (data.error !== undefined) {
          options.title = "&nbsp;<strong>" + escapeHtml(data.error.message) + "</strong><br>";

          if (data.error.hint !== null) options.message = escapeHtml(data.error.hint);
        }
      } catch {
        // Do nothing
      }

      break;
    default:
      // Case not handled, do nothing
      console.log("Unknown alert type: " + type); // eslint-disable-line no-console
      return;
  }

  if (toast === undefined) {
    if (type === "info") {
      // Create a new notification for info boxes
      showAlertBox = $.notify(options, settings);
      return showAlertBox;
    } else if (showAlertBox !== null) {
      // Update existing notification for other boxes (if available)
      showAlertBox.update(options);
      showAlertBox.update(settings);
      return showAlertBox;
    } else {
      // Create a new notification for other boxes if no previous info box exists
      return $.notify(options, settings);
    }
  } else if (toast === null) {
    // Always create a new toast
    return $.notify(options, settings);
  } else {
    // Update existing toast
    toast.update(options);
    toast.update(settings);
    return toast;
  }
}

function datetime(date, html, humanReadable) {
  if (date === 0 && humanReadable) {
    return "Never";
  }

  var format = html === false ? "Y-MM-DD HH:mm:ss z" : "Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z";
  var timestr = moment.unix(Math.floor(date)).format(format).trim();
  return humanReadable
    ? '<span title="' + timestr + '">' + moment.unix(Math.floor(date)).fromNow() + "</span>"
    : timestr;
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
  var macvalidator = /^([\da-fA-F]{2}:){5}([\da-fA-F]{2})$/;
  return macvalidator.test(mac);
}

function validateHostname(name) {
  var namevalidator = /[^<>;"]/;
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
    data = item === "undefined" ? null : item;
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

function addFromQueryLog(domain, list) {
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

  var listtype = list === "allow" ? "Allowlist" : "Denylist";

  alProcessing.children(alDomain).text(domain);
  alProcessing.children(alList).text(listtype);
  alertModal.modal("show");

  // add Domain to List after Modal has faded in
  alertModal.one("shown.bs.modal", function () {
    $.ajax({
      url: "/api/domains/" + list + "/exact",
      method: "post",
      dataType: "json",
      processData: false,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        domain: domain,
        comment: "Added from Query Log",
        type: list,
        kind: "exact",
      }),
      success: function (response) {
        alProcessing.hide();
        if ("domains" in response && response.domains.length > 0) {
          // Success
          alSuccess.children(alDomain).text(domain);
          alSuccess.children(alList).text(listtype);
          alSuccess.fadeIn(1000);
          // Update domains counter in the menu
          updateFtlInfo();
          setTimeout(function () {
            alertModal.modal("hide");
          }, 2000);
        } else {
          // Failure
          alNetworkErr.hide();
          alCustomErr.html(response.message);
          alFailure.fadeIn(1000);
          setTimeout(function () {
            alertModal.modal("hide");
          }, 10000);
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

function toPercent(number, fractionDigits = 0) {
  const userLocale = navigator.language || "en-US";
  return new Intl.NumberFormat(userLocale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(number / 100);
}

function colorBar(percentage, total, cssClass) {
  const formattedPercentage = toPercent(percentage, 1);
  const title = `${formattedPercentage} of ${total}`;
  const bar = `<div class="progress-bar ${cssClass}" style="width: ${percentage}%"></div>`;
  return `<div class="progress progress-sm" title="${title}"> ${bar} </div>`;
}

function checkMessages() {
  var ignoreNonfatal = localStorage
    ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") === "true"
    : false;
  $.ajax({
    url: "/api/info/messages/count" + (ignoreNonfatal ? "?filter_dnsmasq_warnings=true" : ""),
    method: "GET",
    dataType: "json",
  })
    .done(function (data) {
      if (data.count > 0) {
        var more = '\nAccess "Tools/Pi-hole diagnosis" for further details.';
        var title =
          data.count > 1
            ? "There are " + data.count + " warnings." + more
            : "There is one warning." + more;

        $(".warning-count").prop("title", title);
        $(".warning-count").text(data.count);
        $(".warning-count").removeClass("hidden");
      } else {
        $(".warning-count").addClass("hidden");
      }
    })
    .fail(function (data) {
      $(".warning-count").addClass("hidden");
      apiFailure(data);
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

function doLogout() {
  $.ajax({
    url: "/api/auth",
    method: "DELETE",
  }).always(function () {
    location.reload();
  });
}

function renderTimestamp(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    return datetime(data, false, false);
  }

  // Sorting content
  return data;
}

function renderTimespan(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    return datetime(data, false, true);
  }

  // Sorting content
  return data;
}

function htmlPass(data, _type) {
  return data;
}

// Show only the appropriate buttons
function changeTableButtonStates(table) {
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

function getCSSval(cssclass, cssproperty) {
  var elem = $("<div class='" + cssclass + "'></div>"),
    val = elem.appendTo("body").css(cssproperty);
  elem.remove();
  return val;
}

function parseQueryString(queryString = globalThis.location.search) {
  const GETDict = {};
  queryString
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
    });

  return GETDict;
}

// https://stackoverflow.com/q/21647928
function hexEncode(string) {
  var hex, i;

  var result = "";
  for (i = 0; i < string.length; i++) {
    hex = string.codePointAt(i).toString(16);
    result += ("000" + hex).slice(-4);
  }

  return result;
}

// https://stackoverflow.com/q/21647928
function hexDecode(string) {
  var j;
  var hexes = string.match(/.{1,4}/g) || [];
  var back = "";
  for (j = 0; j < hexes.length; j++) {
    back += String.fromCodePoint(parseInt(hexes[j], 16));
  }

  return back;
}

function listAlert(type, items, data) {
  // Show simple success message if there is no "processed" object in "data" or
  // if all items were processed successfully
  if (data.processed === undefined || data.processed.success.length === items.length) {
    showAlert(
      "success",
      "fas fa-plus",
      "Successfully added " + type + (items.length !== 1 ? "s" : ""),
      items.join(", ")
    );
    return;
  }

  // Show a more detailed message if there is a "processed" object in "data" and
  // not all items were processed successfully
  let message = "";

  // Show a list of successful items if there are any
  if (data.processed.success.length > 0) {
    message +=
      "Successfully added " +
      data.processed.success.length +
      " " +
      type +
      (data.processed.success.length !== 1 ? "s" : "") +
      ":";

    // Loop over data.processed.success and print "item"
    for (const item in data.processed.success) {
      if (Object.prototype.hasOwnProperty.call(data.processed.success, item)) {
        message += "\n- " + data.processed.success[item].item;
      }
    }
  }

  // Add a line break if there are both successful and failed items
  if (data.processed.success.length > 0 && data.processed.errors.length > 0) {
    message += "\n\n";
  }

  // Show a list of failed items if there are any
  if (data.processed.errors.length > 0) {
    message +=
      "Failed to add " +
      data.processed.errors.length +
      " " +
      type +
      (data.processed.errors.length !== 1 ? "s" : "") +
      ":\n";

    // Loop over data.processed.errors and print "item: error"
    for (const item in data.processed.errors) {
      if (Object.prototype.hasOwnProperty.call(data.processed.errors, item)) {
        let error = data.processed.errors[item].error;
        // Replace some error messages with a more user-friendly text
        if (error.indexOf("UNIQUE constraint failed") > -1) {
          error = "Already present";
        }

        message += "\n- " + data.processed.errors[item].item + ": " + error;
      }
    }
  }

  // Show the warning message
  const total = data.processed.success.length + data.processed.errors.length;
  const processed = "(" + total + " " + type + (total !== 1 ? "s" : "") + " processed)";
  showAlert(
    "warning",
    "fas fa-exclamation-triangle",
    "Some " + type + (items.length !== 1 ? "s" : "") + " could not be added " + processed,
    message
  );
}

// Callback function for the loading overlay timeout
function loadingOverlayTimeoutCallback(reloadAfterTimeout) {
  // Try to ping FTL to see if it finished restarting
  $.ajax({
    url: "/api/info/login",
    method: "GET",
    cache: false,
    dataType: "json",
  })
    .done(function () {
      // FTL is running again, hide loading overlay
      NProgress.done();
      if (reloadAfterTimeout) {
        location.reload();
      } else {
        WaitMe.hideAll();
      }
    })
    .fail(function () {
      // FTL is not running yet, try again in 500ms
      setTimeout(loadingOverlayTimeoutCallback, 500, reloadAfterTimeout);
    });
}

function loadingOverlay(reloadAfterTimeout = false) {
  NProgress.start();
  new WaitMe(".wrapper", {
    effect: "bounce",
    text: "Pi-hole is currently applying your changes...",
    bg: "rgba(0,0,0,0.7)",
    color: "#fff",
    maxSize: "",
    textPos: "vertical",
  });
  // Start checking for FTL status after 2 seconds
  setTimeout(loadingOverlayTimeoutCallback, 2000, reloadAfterTimeout);

  return true;
}

// Function that calls a function only if the page is currently visible. This is
// useful to prevent unnecessary API calls when the page is not visible (e.g.
// when the user is on another tab).
function callIfVisible(func) {
  if (document.hidden) {
    // Page is not visible, try again in 1 second
    globalThis.setTimeout(callIfVisible, 1000, func);
    return;
  }

  // Page is visible, call function instead
  func();
}

// Timer that calls a function after <interval> milliseconds but only if the
// page is currently visible. We cancel possibly running timers for the same
// function before starting a new one to prevent multiple timers running at
// the same time causing unnecessary identical API calls when the page is
// visible again.
function setTimer(func, interval) {
  // Cancel possibly running timer
  globalThis.clearTimeout(func.timer);
  // Start new timer
  func.timer = globalThis.setTimeout(callIfVisible, interval, func);
}

// Same as setTimer() but calls the function every <interval> milliseconds
function setInter(func, interval) {
  // Cancel possibly running timer
  globalThis.clearTimeout(func.timer);
  // Start new timer
  func.timer = globalThis.setTimeout(callIfVisible, interval, func);
  // Restart timer
  globalThis.setTimeout(setInter, interval, func, interval);
}

globalThis.utils = (function () {
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
    validateMAC: validateMAC,
    validateHostname: validateHostname,
    addFromQueryLog: addFromQueryLog,
    addTD: addTD,
    toPercent: toPercent,
    colorBar: colorBar,
    checkMessages: checkMessages,
    changeBulkDeleteStates: changeBulkDeleteStates,
    doLogout: doLogout,
    renderTimestamp: renderTimestamp,
    renderTimespan: renderTimespan,
    htmlPass: htmlPass,
    changeTableButtonStates: changeTableButtonStates,
    getCSSval: getCSSval,
    parseQueryString: parseQueryString,
    hexEncode: hexEncode,
    hexDecode: hexDecode,
    listsAlert: listAlert,
    loadingOverlay: loadingOverlay,
    setTimer: setTimer,
    setInter: setInter,
  };
})();
