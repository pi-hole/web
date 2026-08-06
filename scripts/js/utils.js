/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false, apiFailure: false, updateFtlInfo: false, NProgress:false, WaitMe:false, TomSelect: false, bootstrap: false */

"use strict";

$(() => {
  // CSRF protection for AJAX requests, this has to be configured globally
  // because we are using the jQuery $.ajax() function directly in some cases
  // Furthermore, has this to be done before any AJAX request is made so that
  // the CSRF token is sent along with each request to the API
  $.ajaxSetup({
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
  });
});

/**
 * Decode a base64 string to UTF-8 text using native browser APIs
 * This is the replacement for the deprecated atob() function
 * @param {string} base64 - Base64 encoded string
 * @returns {string} Decoded UTF-8 string
 */
function base64ToString(base64) {
  // Remove padding and whitespace
  const cleanBase64 = base64.replaceAll(/[=\s]/gu, "");
  const base64Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  // Decode base64 to bytes
  const bytes = [];
  for (let i = 0; i < cleanBase64.length; i += 4) {
    const encoded1 = base64Chars.indexOf(cleanBase64[i]);
    const encoded2 = base64Chars.indexOf(cleanBase64[i + 1]);
    const encoded3 = base64Chars.indexOf(cleanBase64[i + 2]);
    const encoded4 = base64Chars.indexOf(cleanBase64[i + 3]);

    /* eslint-disable no-bitwise -- Bitwise operations required for base64 decoding */
    bytes.push((encoded1 << 2) | (encoded2 >> 4));
    if (encoded3 !== -1) {
      bytes.push(((encoded2 & 15) << 4) | (encoded3 >> 2));
    }

    if (encoded4 !== -1) {
      bytes.push(((encoded3 & 3) << 6) | encoded4);
    }
    /* eslint-enable no-bitwise */
  }

  // Decode bytes as UTF-8
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Credit: https://stackoverflow.com/a/4835406
function escapeHtml(text) {
  // Return early when text is not a string
  if (typeof text !== "string") {
    return text;
  }

  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };

  return text.replaceAll(/[&<>"']/gu, m => map[m]);
}

function unescapeHtml(text) {
  if (text === null) {
    return null;
  }

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
    /&(?:amp|lt|gt|quot|#039|Uuml|uuml|Auml|auml|Ouml|ouml|szlig);/gu,
    m => map[m]
  );
}

function padNumber(num) {
  return ("00" + num).substr(-2, 2);
}

let showAlertBox = null;
function getToastContainer() {
  const existing =
    document.getElementById("toast-container") || document.querySelector(".toast-container");

  if (existing !== null) {
    return existing;
  }

  const container = document.createElement("div");
  container.className = "toast-container position-fixed top-0 end-0 p-3";
  container.id = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "true");
  container.style.zIndex = "9999";
  document.body.append(container);

  return container;
}

function createToastElement(state) {
  const toast = document.createElement("div");
  toast.className = "toast align-items-center border-0 shadow rounded overflow-hidden";
  toast.dataset.toastType = state.type;
  toast.setAttribute("role", state.role);
  toast.setAttribute("aria-live", state.live);
  toast.setAttribute("aria-atomic", state.ariaAtomic);

  const content = document.createElement("div");
  content.className = `toast-content ${state.className}`;

  const layout = document.createElement("div");
  layout.className = "d-flex align-items-start p-3";

  const body = document.createElement("div");
  body.className = "d-flex flex-grow-1 gap-2";

  if (state.icon !== "") {
    const icon = document.createElement("i");
    icon.className = `${state.icon} mt-1`;
    icon.setAttribute("aria-hidden", "true");
    body.append(icon);
  }

  const text = document.createElement("div");
  text.className = "toast-text flex-grow-1";

  const title = document.createElement("strong");
  title.className = "d-block";
  title.innerHTML = state.title;

  const message = document.createElement("div");
  message.className = "toast-message";
  message.style.whiteSpace = "pre-line";
  message.style.overflowWrap = "anywhere";
  message.innerHTML = state.message;

  text.append(title, message);
  body.append(text);
  layout.append(body);

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = `${state.closeButtonClass} ms-2 mt-1`;
  closeButton.dataset.bsDismiss = "toast";
  closeButton.setAttribute("aria-label", "Close");
  layout.append(closeButton);

  content.append(layout);
  toast.append(content);

  return toast;
}

function showAlert(type, icon, title, message, toast) {
  const alertState = {
    title: "&nbsp;<strong>" + escapeHtml(title) + "</strong><br>",
    message: escapeHtml(message),
    icon,
    type,
    className: "",
    animation: true,
    delay: 5000, // default value
    autohide: true,
    role: "status",
    live: "polite",
    ariaAtomic: "true",
    closeButtonClass: "btn-close",
  };

  switch (type) {
    case "info":
      alertState.icon = icon !== null && icon.length > 0 ? icon : "fas fa-clock";
      alertState.className = "text-bg-info";
      break;
    case "success":
      alertState.className = "text-bg-success";
      alertState.closeButtonClass += " btn-close-white";
      break;
    case "warning":
      alertState.icon = "fas fa-exclamation-triangle";
      alertState.delay *= 2;
      alertState.className = "text-bg-warning";
      break;
    case "error":
      alertState.icon = "fas fa-times";
      if (title.length === 0) {
        alertState.title = "&nbsp;<strong>Error, something went wrong!</strong><br>";
      }

      alertState.delay *= 2;
      alertState.className = "text-bg-danger";
      alertState.role = "alert";
      alertState.live = "assertive";
      alertState.closeButtonClass += " btn-close-white";

      // If the message is an API object, nicely format the error message
      // Try to parse message as JSON
      try {
        const data = JSON.parse(message);
        console.log(data); // eslint-disable-line no-console
        if (data.error !== undefined) {
          alertState.title = "&nbsp;<strong>" + escapeHtml(data.error.message) + "</strong><br>";

          if (data.error.hint !== null) {
            alertState.message = escapeHtml(data.error.hint);
          }
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

  const container = getToastContainer();

  const controller = toast === undefined ? (type === "info" ? null : showAlertBox) : toast;

  const toastController = controller ?? {
    element: createToastElement(alertState),
    instance: null,
    hideTimer: null,
    alertState,
    update(partialState) {
      this.alertState = { ...this.alertState, ...partialState };
      this.render();
      this.show();
      return this;
    },
    render() {
      this.element.dataset.toastType = this.alertState.type;
      this.element.className = "toast align-items-center border-0 shadow rounded overflow-hidden";
      this.element.setAttribute("role", this.alertState.role);
      this.element.setAttribute("aria-live", this.alertState.live);
      this.element.setAttribute("aria-atomic", this.alertState.ariaAtomic);

      const content = this.element.querySelector(".toast-content");
      const body = this.element.querySelector(".d-flex.flex-grow-1.gap-2");
      const text = this.element.querySelector(".toast-text");
      const closeButton = this.element.querySelector("button[data-bs-dismiss='toast']");

      if (content !== null) {
        content.className = `toast-content ${this.alertState.className}`;
      }

      if (body !== null) {
        body.replaceChildren();

        if (this.alertState.icon !== "") {
          const iconElement = document.createElement("i");
          iconElement.className = `${this.alertState.icon} mt-1`;
          iconElement.setAttribute("aria-hidden", "true");
          body.append(iconElement);
        }

        if (text !== null) {
          text.replaceChildren();

          const titleElement = document.createElement("strong");
          titleElement.className = "d-block";
          titleElement.innerHTML = this.alertState.title;

          const messageElement = document.createElement("div");
          messageElement.className = "toast-message";
          messageElement.style.whiteSpace = "pre-line";
          messageElement.style.overflowWrap = "anywhere";
          messageElement.innerHTML = this.alertState.message;

          text.append(titleElement, messageElement);
          body.append(text);
        }
      }

      if (closeButton !== null) {
        closeButton.className = `${this.alertState.closeButtonClass} ms-2 mt-1`;
      }
    },
    clearTimer() {
      if (this.hideTimer === null) {
        return;
      }

      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    },
    scheduleHide() {
      this.clearTimer();
      if (!this.alertState.autohide) {
        return;
      }

      this.hideTimer = setTimeout(() => {
        this.hide();
      }, this.alertState.delay);
    },
    ensureInstance() {
      this.instance = bootstrap.Toast.getOrCreateInstance(this.element, {
        autohide: false,
      });
      return this.instance;
    },
    show() {
      if (!this.element.isConnected) {
        container.prepend(this.element);
      }

      this.ensureInstance().show();
      this.scheduleHide();
      return this;
    },
    hide() {
      this.clearTimer();
      if (this.instance !== null) {
        this.instance.hide();
      }

      return this;
    },
    dispose() {
      this.clearTimer();
      if (this.instance !== null) {
        this.instance.dispose();
        this.instance = null;
      }

      this.element.remove();
      if (showAlertBox === this) {
        showAlertBox = null;
      }

      return this;
    },
  };

  toastController.element.addEventListener("hidden.bs.toast", () => {
    toastController.clearTimer();
    if (toastController.instance !== null) {
      toastController.instance.dispose();
      toastController.instance = null;
    }

    toastController.element.remove();
    if (showAlertBox === toastController) {
      showAlertBox = null;
    }
  });

  toastController.render();

  if (toast === undefined) {
    if (type === "info") {
      // Create a new notification for info boxes
      showAlertBox = toastController;
      return toastController.show();
    }

    if (showAlertBox !== null) {
      // Update existing notification for other boxes (if available)
      return showAlertBox.update(alertState);
    }

    // Create a new notification for other boxes if no previous info box exists
    return toastController.show();
  }

  if (toast === null) {
    // Always create a new toast
    return toastController.show();
  }

  // Update existing toast
  return toast.update(alertState);
}

function datetime(date, html, humanReadable) {
  if (date === 0 && humanReadable) {
    return "Never";
  }

  const format =
    html === false ? "Y-MM-DD HH:mm:ss z" : "Y-MM-DD [<br class='d-xl-none'>]HH:mm:ss z";
  const timestr = moment.unix(Math.floor(date)).format(format).trim();
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
  const ip = $("#select") ? $("#select").val() : null;
  if (ip !== null && ip !== "custom") {
    $("#ip-custom").prop("disabled", true);
  }
}

// Pi-hole IPv4/CIDR validator by DL6ER, see regexr.com/50csh
function validateIPv4CIDR(ip) {
  // One IPv4 element is 8bit: 0 - 255
  const ipv4elem = "(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]?|0)";

  // CIDR for IPv4 is 1 - 32 bit (optional)
  const v4cidr = "(?:\\/(?:[1-9]|[1-2][0-9]|3[0-2])){0,1}";

  // Build the complete IPv4/CIDR validator
  // Format: xxx.xxx.xxx.xxx[/yy] where each xxx is 0-255 and optional yy is 1-32
  const ipv4validator = new RegExp(
    `^${ipv4elem}\\.${ipv4elem}\\.${ipv4elem}\\.${ipv4elem}${v4cidr}$`,
    "u"
  );

  return ipv4validator.test(ip);
}

function validateIPv4(ip) {
  // Add pseudo-CIDR to the IPv4
  const ipv4WithCIDR = ip.includes("/") ? ip : ip + "/32";
  // Validate the IPv4/CIDR
  return validateIPv4CIDR(ipv4WithCIDR);
}

// Pi-hole IPv6/CIDR validator by DL6ER, see regexr.com/50csn
function validateIPv6CIDR(ip) {
  // One IPv6 element is 16bit: 0000 - FFFF
  const ipv6elem = "[0-9a-f]{1,4}";

  // CIDR for IPv6 is 1-128 bit (optional)
  const v6cidr = "(?:\\/(?:[1-9]|[1-9][0-9]|1[0-1][0-9]|12[0-8])){0,1}";

  const ipv6validator = new RegExp(
    // eslint-disable-next-line regexp/no-useless-non-capturing-group, regexp/no-unused-capturing-group, regexp/prefer-named-capture-group
    `^(((?:${ipv6elem}))*((?::${ipv6elem}))*::((?:${ipv6elem}))*((?::${ipv6elem}))*|((?:${ipv6elem}))((?::${ipv6elem})){7})${v6cidr}$`,
    "iu"
  );

  return ipv6validator.test(ip);
}

function validateIPv6(ip) {
  // Add pseudo-CIDR to the IPv6
  const ipv6WithCIDR = ip.includes("/") ? ip : ip + "/128";
  // Validate the IPv6/CIDR
  return validateIPv6CIDR(ipv6WithCIDR);
}

function validateIPv6Brackets(ip) {
  const trimmedIp = ip.trim();
  // Check if the IPv6 is enclosed in brackets and return in case of failure
  if (!trimmedIp.startsWith("[") || !trimmedIp.endsWith("]")) {
    return false;
  }

  // Strip brackets before validating the IPv6
  const ipWithoutBrackets = trimmedIp.slice(1, -1);
  // Validate the ip
  return validateIPv6(ipWithoutBrackets);
}

function validatePort(port) {
  // Ports containing spaces are not valid
  if (port.trim() !== port) {
    return false;
  }

  // Check if the port is an integer and within the valid network port range
  const portNum = Number(port);
  return Number.isSafeInteger(portNum) && portNum >= 1 && portNum <= 65_535;
}

// Validates the IPv4 server address used by dns.revServers, with an optional port
function validateIPv4WithPort(ip) {
  // If a slash is present, its a network range, not a server IP
  if (ip.includes("/")) {
    return false;
  }

  // The port is optional
  // If no "#" is present, validate just the IP
  if (!ip.includes("#")) {
    return validateIPv4(ip);
  }

  const parts = ip.split("#");
  if (parts.length !== 2) {
    return false;
  }

  const [ipv4, port] = parts;

  // Validate IP and port
  return validateIPv4(ipv4) && validatePort(port);
}

// Validates the IPv6 server address used by dns.revServers, with an optional port
function validateIPv6WithPort(ip) {
  // If a slash is present, its a network range, not a server IP
  if (ip.includes("/")) {
    return false;
  }

  // The port is optional
  // If no "#" is present, validate just the IP
  if (!ip.includes("#")) {
    return validateIPv6(ip);
  }

  const parts = ip.split("#");
  if (parts.length !== 2) {
    return false;
  }

  const [ipv6, port] = parts;

  // Validate IP and port
  return validateIPv6(ipv6) && validatePort(port);
}

function validateMAC(mac) {
  // Format: xx:xx:xx:xx:xx:xx where each xx is 0-9 or a-f (case insensitive)
  // Also allows dashes as separator, e.g. xx-xx-xx-xx-xx-xx
  // eslint-disable-next-line regexp/no-useless-non-capturing-group, regexp/prefer-named-capture-group
  const macvalidator = /^(?:[\da-f]{2}([:-]))(?:[\da-f]{2}\1){4}[\da-f]{2}$/iu;
  return macvalidator.test(mac.trim());
}

function validateHostname(name) {
  const namevalidator = /[^<>;"]/u;
  return namevalidator.test(name.trim());
}

function validateHostnameStrict(name) {
  // Hostnames must not contain spaces, commas, or characters invalid in DNS names
  const hostnameValidator =
    /^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/u;
  return hostnameValidator.test(name.trim());
}

/**
 * Create a Tom Select multi-select out of a <select multiple> element, with
 * "Select all"/"Select none" actions injected into the dropdown (bootstrap-
 * select used to provide this via its actionsBox option).
 * @param {HTMLElement|jQuery} selectEl - The <select multiple> element (or a jQuery wrapper around it)
 * @param {object} [options] - Extra options merged into the Tom Select config
 * @returns {TomSelect} The created Tom Select instance
 */
function createGroupSelect(selectEl, options = {}) {
  const el = selectEl instanceof HTMLElement ? selectEl : selectEl[0];
  const allValues = [...el.options].map(option => option.value);

  const ts = new TomSelect(el, {
    plugins: ["remove_button"],
    create: false,
    placeholder: "none selected",
    // Tom Select keeps the placeholder visible on multi-selects by default;
    // hide it once at least one group is selected so the "none selected"
    // hint does not sit below the selected item chips.
    hidePlaceholder: true,
    // Render the dropdown into <body> instead of nesting it in the table
    // cell, since ancestors like .table-responsive/.card clip overflow and
    // would otherwise cut it off (bootstrap-select used container: "body"
    // for the same reason).
    dropdownParent: "body",
    ...options,
  });

  const actionsBox = document.createElement("div");
  actionsBox.className = "ts-actions-box";
  actionsBox.innerHTML =
    '<div class="btn-group btn-group-sm">' +
    '<button type="button" class="btn btn-secondary btn-sm select-all">All</button>' +
    '<button type="button" class="btn btn-secondary btn-sm select-none">None</button>' +
    "</div>";
  actionsBox.querySelector(".select-all").addEventListener("click", () => {
    ts.setValue(allValues);
  });
  actionsBox.querySelector(".select-none").addEventListener("click", () => {
    ts.clear();
  });
  ts.dropdown.prepend(actionsBox);

  return ts;
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

  // Return if not available
  if (data === null) {
    return null;
  }

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
  const listtype = list === "allow" ? "Allowlist" : "Denylist";

  disableAll();
  showAlert("info", "", "Adding from Query Log", `Adding ${domain} to the ${listtype}...`);

  $.ajax({
    url: document.body.dataset.apiurl + "/domains/" + list + "/exact",
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
      enableAll();
      if ("domains" in response && response.domains.length > 0) {
        // Success
        showAlert(
          "success",
          "fas fa-plus",
          "Added from Query Log",
          `${domain} successfully added to the ${listtype}`
        );

        // Update domains counter in the menu
        updateFtlInfo();
      } else {
        // Failure
        showAlert("error", "", `Failure adding ${domain} to ${listtype}`, response.message);
      }
    },
    error(xhr) {
      // A duplicate domain (or any other database error) comes back as an
      // HTTP error carrying a JSON body - show its message instead of the
      // generic network error, e.g. "The item is already present"
      let apiError = xhr.responseJSON && xhr.responseJSON.error;
      if (!apiError && xhr.responseText) {
        try {
          apiError = JSON.parse(xhr.responseText).error;
        } catch {
          // Not a JSON response, treat as a genuine network error
        }
      }

      let errorMsg = "Timeout or Network Connection Error!";
      if (apiError) {
        errorMsg = apiError.hint || apiError.message;
      }

      enableAll();
      showAlert("error", "", `Failure adding ${domain} to ${listtype}`, errorMsg);
    },
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
  $.ajax({
    url: document.body.dataset.apiurl + "/info/messages/count",
    method: "GET",
    dataType: "json",
  })
    .done(data => {
      if (data.count > 0) {
        const more = '\nAccess "Tools/Pi-hole diagnosis" for further details.';
        const title =
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
    .fail(data => {
      $(".warning-count").addClass("hidden");
      apiFailure(data);
    });
}

function doLogout(url) {
  $.ajax({
    url: document.body.dataset.apiurl + "/auth",
    method: "DELETE",
  }).always(() => {
    location.assign(url);
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
    for (const el of selectAllElements) {
      el.classList.remove("hidden");
    }

    for (const el of selectMoreElements) {
      el.classList.add("hidden");
    }

    for (const el of removeAllElements) {
      el.classList.add("hidden");
    }

    for (const el of deleteSelectedElements) {
      el.classList.add("hidden");
    }
  } else if (selectedRows >= pageLength || selectedRows === allRows) {
    // Whole page is selected (or all available messages were selected)
    for (const el of selectAllElements) {
      el.classList.add("hidden");
    }

    for (const el of selectMoreElements) {
      el.classList.add("hidden");
    }

    for (const el of removeAllElements) {
      el.classList.remove("hidden");
    }

    for (const el of deleteSelectedElements) {
      el.classList.remove("hidden");
    }
  } else {
    // Some rows are selected, but not all
    for (const el of selectAllElements) {
      el.classList.add("hidden");
    }

    for (const el of selectMoreElements) {
      el.classList.remove("hidden");
    }

    for (const el of removeAllElements) {
      el.classList.add("hidden");
    }

    for (const el of deleteSelectedElements) {
      el.classList.remove("hidden");
    }
  }
}

function getCSSval(cssclass, cssproperty) {
  const elem = $("<div class='" + cssclass + "'></div>");
  const val = elem.appendTo("body").css(cssproperty);
  elem.remove();
  return val;
}

function parseQueryString() {
  const params = new URLSearchParams(location.search);
  return Object.fromEntries(params);
}

function hexEncode(text) {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }

  return [...text].map(char => char.codePointAt(0).toString(16).padStart(4, "0")).join("");
}

function hexDecode(text) {
  if (typeof text !== "string" || text.length === 0) {
    return "";
  }

  const hexes = text.match(/.{1,4}/gu);
  if (!hexes || hexes.length === 0) {
    return "";
  }

  return hexes.map(hex => String.fromCodePoint(Number.parseInt(hex, 16))).join("");
}

function listsAlert(type, items, data) {
  // Show simple success message if there is no "processed" object in "data" or
  // if all items were processed successfully
  const successLength = data.processed.success.length;

  if (data.processed === undefined || successLength === items.length) {
    showAlert(
      "success",
      "fas fa-plus",
      "Successfully added " + type + (items.length !== 1 ? "s" : ""),
      items.join(", ")
    );
    return;
  }

  const errorsLength = data.processed.errors.length;

  // Show a more detailed message if there is a "processed" object in "data" and
  // not all items were processed successfully
  let message = "";

  // Show a list of successful items if there are any
  if (successLength > 0) {
    message +=
      "Successfully added " + successLength + " " + type + (successLength !== 1 ? "s" : "") + ":";

    // Loop over data.processed.success and print "item"
    for (const item of Object.values(data.processed.success)) {
      message += "\n- " + item.item;
    }
  }

  // Add a line break if there are both successful and failed items
  if (successLength > 0 && errorsLength > 0) {
    message += "\n\n";
  }

  // Show a list of failed items if there are any
  if (errorsLength > 0) {
    message +=
      "Failed to add " + errorsLength + " " + type + (errorsLength !== 1 ? "s" : "") + ":\n";

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
  const processed = "(" + total + " " + type + (total !== 1 ? "s" : "") + " processed)";
  showAlert(
    "warning",
    "fas fa-exclamation-triangle",
    "Some " + type + (items.length !== 1 ? "s" : "") + " could not be added " + processed,
    message
  );
}

let waitMe = null;
// Callback function for the loading overlay timeout
function loadingOverlayTimeoutCallback(reloadAfterTimeout) {
  // Try to ping FTL to see if it finished restarting
  $.ajax({
    url: document.body.dataset.apiurl + "/info/login",
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
        waitMe.hide();
      }
    })
    .fail(() => {
      // FTL is not running yet, try again in 500ms
      setTimeout(loadingOverlayTimeoutCallback, 500, reloadAfterTimeout);
    });
}

function loadingOverlay(reloadAfterTimeout = false) {
  NProgress.start();
  waitMe = new WaitMe(".app-wrapper", {
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
    setTimeout(callIfVisible, 1000, func);
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
  clearTimeout(func.timer);
  // Start new timer
  func.timer = setTimeout(callIfVisible, interval, func);
}

// Same as setTimer() but calls the function every <interval> milliseconds
function setInter(func, interval) {
  // Cancel possibly running timer
  clearTimeout(func.timer);
  // Start new timer
  func.timer = setTimeout(callIfVisible, interval, func);
  // Restart timer
  setTimeout(setInter, interval, func, interval);
}

/**
 * Toggle or set the collapse state of a card element
 * @param {HTMLElement} card - The card element
 * @param {boolean} [expand=true] - Whether to expand (true) or collapse (false) the card
 */
// Not using the AdminLTE API so that the expansion is not animated
// Otherwise, we could use `CardWidget.getOrCreateInstance(customCard).expand()`
function toggleBoxCollapse(card, expand = true) {
  if (!card) {
    return;
  }

  card.classList.toggle("collapsed-card", !expand);
}

globalThis.utils = (function () {
  return {
    escapeHtml,
    unescapeHtml,
    padNumber,
    showAlert,
    datetime,
    datetimeRelative,
    disableAll,
    enableAll,
    validateIPv4CIDR,
    validateIPv4,
    validateIPv6CIDR,
    validateIPv6,
    validateIPv6Brackets,
    validatePort,
    validateIPv4WithPort,
    validateIPv6WithPort,
    createGroupSelect,
    stateSaveCallback,
    stateLoadCallback,
    validateMAC,
    validateHostname,
    validateHostnameStrict,
    addFromQueryLog,
    addTD,
    toPercent,
    colorBar,
    checkMessages,
    doLogout,
    renderTimestamp,
    renderTimespan,
    changeTableButtonStates,
    getCSSval,
    parseQueryString,
    hexEncode,
    hexDecode,
    listsAlert,
    loadingOverlay,
    setTimer,
    setInter,
    toggleBoxCollapse,
    base64ToString,
  };
})();
