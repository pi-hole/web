/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/*
  global moment:false, Chart:false, htmlLegendPlugin:false, customTooltips:false,
  doughnutTooltip:false, apiFailure: false, updateFtlInfo: false, NProgress:false, WaitMe:false
*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // CSRF protection for AJAX requests, this has to be configured globally
  // because we are using the jQuery $.ajax() function directly in some cases
  // Furthermore, this has to be done before any AJAX request is made so that
  // the CSRF token is sent along with each request to the API
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
  $.ajaxSetup({
    headers: { "X-CSRF-TOKEN": csrfToken },
  });
});

/**
 * A wrapper around the fetch API with CSRF token handling
 * @param {string} url - The URL to fetch from
 * @param {Object} options - The fetch options
 * @param {string} [options.method='GET'] - The HTTP method to use
 * @param {Object} [options.headers={}] - Additional headers to send
 * @param {any} [options.body=null] - The request body
 * @param {boolean} [options.handleFailure=true] - Whether to automatically handle failures with apiFailure
 * @param {boolean} [options.json=true] - Whether to parse the response as JSON
 * @param {Object} [options...rest] - Any other fetch options to pass through
 * @returns {Promise<Object|Response>} - JSON response or Response object based on json parameter
 */
async function fetchFactory(
  url,
  { method = "GET", headers = {}, body = null, handleFailure = true, json = true, ...rest } = {}
) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

  const response = await fetch(url, {
    method,
    headers: {
      "X-CSRF-TOKEN": csrfToken,
      ...headers,
    },
    body,
    ...rest,
  });

  if (response.ok) return json === true ? response.json() : response;
  if (handleFailure === true) return apiFailure(response);
}

// Credit: https://stackoverflow.com/a/4835406
function escapeHtml(text) {
  // Return early when text is not a string
  if (typeof text !== "string") return text;

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replaceAll(/[&<>"']/g, m => map[m]);
}

function unescapeHtml(text) {
  if (text === null) return null;

  const map = {
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

  return text.replaceAll(
    /&(?:amp|lt|gt|quot|#039|Uuml|uuml|Auml|auml|Ouml|ouml|szlig);/g,
    m => map[m]
  );
}

let showAlertBox = null;

function showAlert({
  type,
  icon = undefined,
  title = "",
  message = "",
  toast = undefined,
  timeout = 5000,
}) {
  const options = {
    title: `<strong class="ml-1">${escapeHtml(title)}</strong><br>`,
    message: escapeHtml(message),
    icon,
  };
  const settings = {
    type,
    delay: timeout,
    mouse_over: "pause",
    animate: {
      enter: "animate__animated animate__fadeInDown",
      exit: "animate__animated animate__fadeOutUp",
    },
  };

  switch (type) {
    case "info":
      options.icon = icon ?? "fas fa-clock";

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
        const data = JSON.parse(message);
        console.log(data); // eslint-disable-line no-console
        if (data.error !== undefined) {
          options.title = `&nbsp;<strong>${escapeHtml(data.error.message)}</strong><br>`;

          if (data.error.hint !== null) options.message = escapeHtml(data.error.hint);
        }
      } catch {
        // Do nothing
      }

      break;
    default:
      // Case not handled, do nothing
      console.log(`Unknown alert type: ${type}`); // eslint-disable-line no-console
      return;
  }

  if (toast === undefined) {
    if (type === "info") {
      // Create a new notification for info boxes
      showAlertBox = $.notify(options, settings);
      return showAlertBox;
    }

    if (showAlertBox !== null) {
      // Update existing notification for other boxes (if available)
      showAlertBox.update(options);
      showAlertBox.update(settings);
      return showAlertBox;
    }

    // Create a new notification for other boxes if no previous info box exists
    return $.notify(options, settings);
  }

  if (toast === null) {
    // Always create a new toast
    return $.notify(options, settings);
  }

  // Update existing toast
  toast.update(options);
  toast.update(settings);
  return toast;
}

function datetime(date, html, humanReadable) {
  if (date === 0 && humanReadable) {
    return "Never";
  }

  const format =
    html === false ? "Y-MM-DD HH:mm:ss z" : "Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z";
  const timeStr = moment.unix(Math.floor(date)).format(format).trim();
  return humanReadable
    ? `<span title="${timeStr}">${moment.unix(Math.floor(date)).fromNow()}</span>`
    : timeStr;
}

function datetimeRelative(date) {
  return moment.unix(Math.floor(date)).fromNow();
}

function disableAll() {
  for (const element of document.querySelectorAll("input, select, button, textarea")) {
    element.disabled = true;
  }
}

function enableAll() {
  for (const element of document.querySelectorAll("input, select, button, textarea")) {
    element.removeAttribute("disabled");
  }

  // Enable custom input field only if applicable
  const ipCustomElem = document.getElementById("ip-custom");
  const selectElem = document.getElementById("select");
  const ip = selectElem ? selectElem.value : null;

  if (ip !== null && ip !== "custom" && ipCustomElem !== null) {
    ipCustomElem.disabled = true;
  }
}

// Pi-hole IPv4/CIDR validator by DL6ER, see regexr.com/50csh
function validateIPv4CIDR(ip) {
  // One IPv4 element is 8bit: 0 - 255
  const ipv4elem = "(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)";

  // CIDR for IPv4 is 1 - 32 bit (optional)
  const v4cidr = "(\\/([1-9]|[1-2][0-9]|3[0-2])){0,1}";

  // Build the complete IPv4/CIDR validator
  // Format: xxx.xxx.xxx.xxx[/yy] where each xxx is 0-255 and optional yy is 1-32
  const ipv4validator = new RegExp(
    `^${ipv4elem}\\.${ipv4elem}\\.${ipv4elem}\\.${ipv4elem}${v4cidr}$`
  );

  return ipv4validator.test(ip);
}

// Pi-hole IPv6/CIDR validator by DL6ER, see regexr.com/50csn
function validateIPv6CIDR(ip) {
  // One IPv6 element is 16bit: 0000 - FFFF
  const ipv6elem = "[0-9A-Fa-f]{1,4}";

  // CIDR for IPv6 is 1-128 bit (optional)
  const v6cidr = "(\\/([1-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8])){0,1}";

  const ipv6validator = new RegExp(
    `^(((?:${ipv6elem}))*((?::${ipv6elem}))*::((?:${ipv6elem}))*((?::${ipv6elem}))*|((?:${ipv6elem}))((?::${ipv6elem})){7})${v6cidr}$`
  );

  return ipv6validator.test(ip);
}

function validateMAC(mac) {
  const macvalidator = /^([\da-fA-F]{2}:){5}([\da-fA-F]{2})$/;
  return macvalidator.test(mac);
}

function validateHostname(name) {
  const namevalidator = /[^<>;"]/;
  return namevalidator.test(name);
}

// set bootstrap-select defaults
function setBsSelectDefaults() {
  $.fn.selectpicker.Constructor.DEFAULTS = {
    ...$.fn.selectpicker.Constructor.DEFAULTS,
    noneSelectedText: "none selected",
    selectedTextFormat: "count > 1",
    actionsBox: true,
    width: "fit",
    container: "body",
    dropdownAlignRight: "auto",
    selectAllText: "All",
    deselectAllText: "None",
    countSelectedText: (num, total) =>
      num === total ? `All selected (${num})` : `${num} selected`,
  };
}

const backupStorage = {};
function stateSaveCallback(itemName, data) {
  if (localStorage === null) {
    backupStorage[itemName] = JSON.stringify(data);
  } else {
    localStorage.setItem(itemName, JSON.stringify(data));
  }
}

function stateLoadCallback(itemName) {
  let data;
  // Receive previous state from client's local storage area
  if (localStorage === null) {
    const item = backupStorage[itemName];
    data = item === "undefined" ? null : item;
  } else {
    data = localStorage.getItem(itemName);
  }

  // Return null if not available
  if (data === null) return null;

  // Parse JSON string
  data = JSON.parse(data);

  // Clear possible filtering settings
  for (const column of Object.values(data.columns)) {
    column.search.search = "";
  }

  // Always start on the first page to show most recent queries
  data.start = 0;
  // Always start with empty search field
  data.search.search = "";

  // Apply loaded state to table
  return data;
}

function addFromQueryLog(domain, list) {
  const alertModal = $("#alertModal");

  // Exit the function here if the Modal is already shown (multiple running interlock)
  if (alertModal.css("display") !== "none") return;

  const alProcessing = alertModal.find(".alProcessing");
  const alSuccess = alertModal.find(".alSuccess");
  const alFailure = alertModal.find(".alFailure");
  const alNetworkErr = alertModal.find(".alFailure #alNetErr");
  const alCustomErr = alertModal.find(".alFailure #alCustomErr");
  const alList = "#alList";
  const alDomain = "#alDomain";

  const listtype = list === "allow" ? "Allowlist" : "Denylist";

  alProcessing.children(alDomain).text(domain);
  alProcessing.children(alList).text(listtype);
  alertModal.modal("show");

  // add Domain to List after Modal has faded in
  alertModal.one("shown.bs.modal", () => {
    $.ajax({
      url: `${document.body.dataset.apiurl}/domains/${list}/exact`,
      method: "post",
      dataType: "json",
      processData: false,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify({
        domain,
        comment: "Added from Query Log",
        type: list,
        kind: "exact",
      }),
      success(response) {
        alProcessing.hide();
        if (Object.hasOwn(response, "domains") && response.domains.length > 0) {
          // Success
          alSuccess.children(alDomain).text(domain);
          alSuccess.children(alList).text(listtype);
          alSuccess.fadeIn(1000);
          // Update domains counter in the menu
          updateFtlInfo();
          setTimeout(() => {
            alertModal.modal("hide");
          }, 2000);
        } else {
          // Failure
          alNetworkErr.hide();
          alCustomErr.html(response.message);
          alFailure.fadeIn(1000);
          setTimeout(() => {
            alertModal.modal("hide");
          }, 10_000);
        }
      },
      error() {
        // Network Error
        alProcessing.hide();
        alNetworkErr.show();
        alFailure.fadeIn(1000);
        setTimeout(() => {
          alertModal.modal("hide");
        }, 8000);
      },
    });
  });

  // Reset Modal after it has faded out
  alertModal.one("hidden.bs.modal", () => {
    alProcessing.show();
    alSuccess.add(alFailure).hide();
    alProcessing.add(alSuccess).children(alDomain).html("").end().children(alList).html("");
    alCustomErr.html("");
  });
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
  const bar = `<div class="progress-bar ${cssClass}" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" style="width: ${percentage}%"></div>`;
  return `<div class="progress progress-sm" title="${title}">${bar}</div>`;
}

function checkMessages() {
  const ignoreNonfatal = localStorage
    ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") === "true"
    : false;

  fetchFactory(
    `${document.body.dataset.apiurl}/info/messages/count${ignoreNonfatal ? "?filter_dnsmasq_warnings=true" : ""}`,
    {
      headers: {
        Accept: "application/json",
      },
    }
  )
    .then(data => {
      const warningCountEls = document.querySelectorAll(".warning-count");
      if (data.count > 0) {
        const more = '\nAccess "Tools/Pi-hole diagnosis" for further details.';
        const title =
          data.count > 1
            ? `There are ${data.count} warnings.${more}`
            : `There is one warning.${more}`;

        for (const element of warningCountEls) {
          element.title = title;
          element.textContent = data.count;
          element.classList.remove("d-none");
        }
      } else {
        for (const element of warningCountEls) {
          element.classList.add("d-none");
        }
      }
    })
    .catch(error => {
      const warningCountEls = document.querySelectorAll(".warning-count");
      for (const element of warningCountEls) {
        element.classList.add("d-none");
      }

      apiFailure(error);
    });
}

function doLogout(url) {
  fetchFactory(`${document.body.dataset.apiurl}/auth`, {
    method: "DELETE",
    json: false,
  }).finally(() => {
    globalThis.location = url;
  });
}

function renderTimestamp(data, type) {
  // Display and search content, otherwise return raw data for sorting
  return type === "display" || type === "filter" ? datetime(data, false, false) : data;
}

function renderTimespan(data, type) {
  // Display and search content, otherwise return raw data for sorting
  return type === "display" || type === "filter" ? datetime(data, false, true) : data;
}

// Show only the appropriate delete buttons in datatables
function changeTableButtonStates(table) {
  const selectAllElements = document.querySelectorAll(".selectAll");
  const selectMoreElements = document.querySelectorAll(".selectMore");
  const removeAllElements = document.querySelectorAll(".removeAll");
  const deleteSelectedElements = document.querySelectorAll(".deleteSelected");

  const allRows = table.rows({ filter: "applied" }).data().length;
  const pageLength = table.page.len();
  const selectedRows = table.rows(".selected").data().length;

  if (selectedRows === 0) {
    // Nothing selected
    for (const el of selectAllElements) el.classList.remove("hidden");
    for (const el of selectMoreElements) el.classList.add("hidden");
    for (const el of removeAllElements) el.classList.add("hidden");
    for (const el of deleteSelectedElements) el.classList.add("hidden");
  } else if (selectedRows >= pageLength || selectedRows === allRows) {
    // Whole page is selected (or all available messages were selected)
    for (const el of selectAllElements) el.classList.add("hidden");
    for (const el of selectMoreElements) el.classList.add("hidden");
    for (const el of removeAllElements) el.classList.remove("hidden");
    for (const el of deleteSelectedElements) el.classList.remove("hidden");
  } else {
    // Some rows are selected, but not all
    for (const el of selectAllElements) el.classList.add("hidden");
    for (const el of selectMoreElements) el.classList.remove("hidden");
    for (const el of removeAllElements) el.classList.add("hidden");
    for (const el of deleteSelectedElements) el.classList.remove("hidden");
  }
}

// Get a CSS property value from a specified class
function getStylePropertyFromClass(className, propertyName) {
  // Find an element with the given class name
  let element = document.querySelector(`.${className}`);
  if (element) {
    return globalThis.getComputedStyle(element).getPropertyValue(propertyName).trim();
  }

  // Create a temporary element to get the CSS property value
  element = document.createElement("div");
  element.className = className;
  document.body.append(element);
  const value = getStylePropertyFromClass(className, propertyName);
  element.remove();
  return value;
}

function parseQueryString() {
  const params = new URLSearchParams(globalThis.location.search);
  return Object.fromEntries(params.entries());
}

function hexEncode(text) {
  if (typeof text !== "string" || text.length === 0) return "";

  return [...text].map(char => char.codePointAt(0).toString(16).padStart(4, "0")).join("");
}

function hexDecode(text) {
  if (typeof text !== "string" || text.length === 0) return "";

  const hexes = text.match(/.{1,4}/g);
  if (!hexes || hexes.length === 0) return "";

  return hexes.map(hex => String.fromCodePoint(Number.parseInt(hex, 16))).join("");
}

function listsAlert(type, items, data) {
  // Show simple success message if there is no "processed" object in "data" or
  // if all items were processed successfully
  const successLength = data.processed.success.length;
  const errorsLength = data.processed.errors.length;

  if (data.processed === undefined || successLength === items.length) {
    showAlert({
      type: "success",
      icon: "fas fa-plus",
      title: `Successfully added ${pluralize(items.length, type)}`,
      message: items.join(", "),
    });
    return;
  }

  // Show a more detailed message if there is a "processed" object in "data" and
  // not all items were processed successfully
  let message = "";

  // Show a list of successful items if there are any
  if (successLength > 0) {
    message += `Successfully added ${successLength} ${pluralize(successLength, type)}:`;

    // Loop over data.processed.success and print "item"
    for (const item of Object.values(data.processed.success)) {
      message += `\n- ${item.item}`;
    }
  }

  // Add a line break if there are both successful and failed items
  if (successLength > 0 && errorsLength > 0) {
    message += "\n\n";
  }

  // Show a list of failed items if there are any
  if (errorsLength > 0) {
    message += `Failed to add ${errorsLength} ${pluralize(errorsLength, type)}:\n`;

    // Loop over data.processed.errors and print "item: error"
    for (const errorItem of Object.values(data.processed.errors)) {
      let error = errorItem.error;
      // Replace some error messages with a more user-friendly text
      if (error.includes("UNIQUE constraint failed")) {
        error = "Already present";
      }

      message += `\n- ${errorItem.item}: ${error}`;
    }
  }

  // Show the warning message
  const total = successLength + errorsLength;
  const processed = `(${total} ${pluralize(total, type)} processed)`;
  showAlert({
    type: "warning",
    icon: "fas fa-exclamation-triangle",
    title: `Some ${pluralize(items.length, type)} could not be added ${processed}`,
    message,
  });
}

let waitMe = null;
// Callback function for the loading overlay timeout
function loadingOverlayTimeoutCallback(reloadAfterTimeout) {
  // Try to ping FTL to see if it finished restarting
  $.ajax({
    url: `${document.body.dataset.apiurl}/info/login`,
    method: "GET",
    cache: false,
    dataType: "json",
  })
    .done(() => {
      // FTL is running again, hide loading overlay
      NProgress.done();
      if (reloadAfterTimeout) {
        location.reload();
      } else {
        waitMe.hideAll();
      }
    })
    .fail(() => {
      // FTL is not running yet, try again in 500ms
      setTimeout(loadingOverlayTimeoutCallback, 500, reloadAfterTimeout);
    });
}

function loadingOverlay(reloadAfterTimeout = false) {
  NProgress.start();
  waitMe = new WaitMe(".wrapper", {
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

function isVisible(element) {
  return Boolean(
    element.offsetWidth || element.offsetHeight || element.getClientRects().length > 0
  );
}

// Simple pluralize function that returns a singular or plural form based on count
function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural || `${singular}s`;
}

function disableSearchAutocorrect(input = document.querySelector("input[type=search]")) {
  if (!input) return;

  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
}

function hideAlerts(selector = "[data-hide]") {
  const dataHideElements = document.querySelectorAll(selector);
  if (dataHideElements.length === 0) return;

  // Hide all elements with the data-hide attribute
  for (const element of dataHideElements) {
    element.addEventListener("click", () => {
      const hideClass = element.dataset.hide;
      const closestElement = element.closest(`.${hideClass}`);
      if (closestElement) $(closestElement).hide();
    });
  }
}

/**
 * Toggle or set the collapse state of a box element
 * @param {HTMLElement} box - The box element
 * @param {boolean} [expand=true] - Whether to expand (true) or collapse (false) the box
 */
// Not using the AdminLTE API so that the expansion is not animated
// Otherwise, we could use `$(customBox).boxWidget("expand")`
function toggleBoxCollapse(box, expand = true) {
  if (!box) return;

  const icon = box.querySelector(".btn-box-tool > i");
  const body = box.querySelector(".box-body");

  if (expand) {
    box.classList.remove("collapsed-box");
    if (icon) icon.classList.replace("fa-plus", "fa-minus");
    if (body) body.style = "";
  } else {
    box.classList.add("collapsed-box");
    if (icon) icon.classList.replace("fa-minus", "fa-plus");
    if (body) body.style.display = "none";
  }
}

/**
 * Factory function to create pie/doughnut charts with common configuration
 * @param {string} elementId - The DOM element id for the chart canvas
 * @param {Object} options - Chart options (legendContainerId, tooltipTitle, chartOptions)
 * @returns {Chart|null}
 */
function createPieChart(elementId, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  return new Chart(element.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          parsing: false,
        },
      ],
    },
    plugins: [htmlLegendPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: true,
      elements: {
        arc: {
          borderColor: getStylePropertyFromClass("box", "background-color"),
        },
      },
      plugins: {
        htmlLegend: {
          containerID: options.legendContainerId || "",
        },
        legend: {
          display: false,
        },
        tooltip: {
          enabled: false,
          external: customTooltips,
          callbacks: {
            title() {
              return options.tooltipTitle || "";
            },
            label: doughnutTooltip,
          },
        },
      },
      animation: {
        duration: 750,
      },
      ...options.chartOptions,
    },
  });
}

// Check if the obj is empty
function isEmptyObject(obj) {
  return obj === undefined || obj === null || Object.keys(obj).length === 0;
}

globalThis.utils = (function () {
  return {
    escapeHtml,
    unescapeHtml,
    showAlert,
    datetime,
    datetimeRelative,
    disableAll,
    enableAll,
    validateIPv4CIDR,
    validateIPv6CIDR,
    setBsSelectDefaults,
    stateSaveCallback,
    stateLoadCallback,
    validateMAC,
    validateHostname,
    addFromQueryLog,
    toPercent,
    colorBar,
    checkMessages,
    doLogout,
    renderTimestamp,
    renderTimespan,
    changeTableButtonStates,
    getStylePropertyFromClass,
    parseQueryString,
    hexEncode,
    hexDecode,
    listsAlert,
    loadingOverlay,
    setTimer,
    setInter,
    toggleBoxCollapse,
    isVisible,
    pluralize,
    fetchFactory,
    disableSearchAutocorrect,
    hideAlerts,
    createPieChart,
    isEmptyObject,
  };
})();
