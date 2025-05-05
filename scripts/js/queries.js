/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false, REFRESH_INTERVAL:false */

"use strict";

const beginningOfTime = 1_262_304_000; // Jan 01 2010, 00:00 in seconds
const endOfTime = 2_147_483_647; // Jan 19, 2038, 03:14 in seconds
let from = beginningOfTime;
let until = endOfTime;

const dateformat = "MMM Do YYYY, HH:mm";

let table = null;
let cursor = null;
const filters = [
  "client_ip",
  "client_name",
  "domain",
  "upstream",
  "type",
  "status",
  "reply",
  "dnssec",
];

function initDateRangePicker() {
  $("#querytime").daterangepicker(
    {
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: { format: dateformat },
      startDate: moment(from * 1000), // convert to milliseconds since epoch
      endDate: moment(until * 1000), // convert to milliseconds since epoch
      ranges: {
        "Last 10 Minutes": [moment().subtract(10, "minutes"), moment()],
        "Last Hour": [moment().subtract(1, "hours"), moment()],
        Today: [moment().startOf("day"), moment().endOf("day")],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [moment().subtract(6, "days"), moment().endOf("day")],
        "Last 30 Days": [moment().subtract(29, "days"), moment().endOf("day")],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        "This Year": [moment().startOf("year"), moment().endOf("year")],
        "All Time": [moment(beginningOfTime * 1000), moment(endOfTime * 1000)], // convert to milliseconds since epoch
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: true,
    },
    (startTime, endTime) => {
      // Update global variables
      // Convert milliseconds (JS) to seconds (API)
      from = moment(startTime).utc().valueOf() / 1000;
      until = moment(endTime).utc().valueOf() / 1000;
    }
  );
}

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else {
    alert(`An unknown error occurred while loading the data.\n${xhr.responseText}`);
  }

  document.getElementById("all-queries_processing")?.classList.add("d-none");
  table.clear();
  table.draw();
}

function parseQueryStatus(data) {
  // Status configuration object
  const statusConfig = {
    GRAVITY: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (gravity)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      blocked: true,
    },
    FORWARDED: {
      colorClass: "text-green",
      icon: "fa-solid fa-cloud-download-alt",
      fieldText: data =>
        (data.reply.type !== "UNKNOWN" ? "Forwarded, reply from " : "Forwarded to ") +
        data.upstream,
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>',
    },
    CACHE: {
      colorClass: "text-green",
      icon: "fa-solid fa-database",
      fieldText: "Served from cache",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>',
    },
    REGEX: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (regex)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      blocked: true,
    },
    DENYLIST: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (exact)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      blocked: true,
    },
    EXTERNAL_BLOCKED_IP: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (external, IP)",
      blocked: true,
    },
    EXTERNAL_BLOCKED_NULL: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (external, NULL)",
      blocked: true,
    },
    EXTERNAL_BLOCKED_NXRA: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (external, NXRA)",
      blocked: true,
    },
    QUERY_EXTERNAL_BLOCKED_EDE15: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (external, EDE15)",
      blocked: true,
    },
    GRAVITY_CNAME: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (gravity, CNAME)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      isCNAME: true,
      blocked: true,
    },
    REGEX_CNAME: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (regex denied, CNAME)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      isCNAME: true,
      blocked: true,
    },
    DENYLIST_CNAME: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: "Blocked (exact denied, CNAME)",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>',
      isCNAME: true,
      blocked: true,
    },
    RETRIED: {
      colorClass: "text-green",
      icon: "fa-solid fa-redo",
      fieldText: "Retried",
    },
    RETRIED_DNSSEC: {
      colorClass: "text-green",
      icon: "fa-solid fa-redo",
      fieldText: "Retried (ignored)",
    },
    IN_PROGRESS: {
      colorClass: "text-green",
      icon: "fa-solid fa-hourglass-half",
      fieldText: "Already forwarded, awaiting reply",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>',
    },
    CACHE_STALE: {
      colorClass: "text-green",
      icon: "fa-solid fa-infinity",
      fieldText: "Served by cache optimizer",
      buttonHtml:
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>',
    },
    SPECIAL_DOMAIN: {
      colorClass: "text-red",
      icon: "fa-solid fa-ban",
      fieldText: data => data.status,
      blocked: true,
    },
  };

  // Default values for unknown status
  const defaults = {
    colorClass: "text-orange",
    icon: "fa-solid fa-question",
    fieldText: data.status,
    buttonHtml: "",
    blocked: false,
    isCNAME: false,
  };

  // Get configuration for this status or use defaults
  const config = statusConfig[data.status] || defaults;

  // Handle dynamic fieldText if it's a function
  const fieldText =
    typeof config.fieldText === "function" ? config.fieldText(data) : config.fieldText;

  const result = {
    fieldText,
    buttonHtml: config.buttonHtml || "",
    colorClass: config.colorClass,
    icon: config.icon,
    isCNAME: config.isCNAME || false,
    blocked: config.blocked || false,
  };

  // Determine match text based on color class
  if (result.colorClass === "text-green") {
    result.matchText = "allowed";
  } else if (result.colorClass === "text-red") {
    result.matchText = "blocked";
  } else {
    result.matchText = "matched";
  }

  return result;
}

function formatReplyTime(time, type) {
  // If type is not display, return the number itself (for sorting and searching)
  if (type !== "display") return time;

  // Units:
  //  - seconds if time >= 1 second
  //  - milliseconds if time >= 100 µs
  //  - microseconds otherwise
  if (time < 1e-4) {
    return `${(1_000_000 * time).toFixed(1)} µs`;
  }

  if (time < 1) {
    return `${(1000 * time).toFixed(1)} ms`;
  }

  return `${time.toFixed(1)} s`;
}

// Parse DNSSEC status
function parseDNSSEC(data) {
  let icon = ""; // Icon to display
  let color = ""; // Class to apply to text
  let text = data.dnssec; // Text to display

  switch (text) {
    case "SECURE":
      icon = "fa-solid fa-lock";
      color = "text-green";
      break;
    case "INSECURE":
      icon = "fa-solid fa-lock-open";
      color = "text-orange";
      break;
    case "BOGUS":
    case "ABANDONED":
      icon = "fa-solid fa-exclamation-triangle";
      color = "text-red";
      break;
    default:
      // No DNSSEC or UNKNOWN
      text = "N/A";
  }

  return { text, icon, color };
}

function formatInfo(data) {
  const queryStatus = parseQueryStatus(data);
  const divStart = '<div class="col-xl-2 col-lg-4 col-md-6 col-12 overflow-wrap">';
  let statusInfo = "";
  if (queryStatus.colorClass !== false) {
    statusInfo =
      `${divStart}Query Status:&nbsp;&nbsp;` +
      `<strong class="${queryStatus.colorClass}">${queryStatus.fieldText}</strong></div>`;
  }

  let listInfo = "";
  if (data.list_id !== null && data.list_id !== -1) {
    // Some list matched - add link to search page
    const searchLink =
      data.domain !== "hidden"
        ? `, <a href="search?domain=${encodeURIComponent(queryStatus.isCNAME ? data.cname : data.domain)}" target="_blank">search lists</a>`
        : "";
    listInfo = `${divStart}Query was ${queryStatus.matchText}${searchLink}</div>`;
  }

  const cnameInfo = queryStatus.isCNAME
    ? `${divStart}Query was blocked during CNAME inspection of&nbsp;&nbsp;${data.cname}</div>`
    : "";

  // Show TTL if applicable
  const ttlInfo =
    data.ttl > 0
      ? `${divStart}Time-to-live (TTL):&nbsp;&nbsp;${moment.duration(data.ttl, "s").humanize()} (${data.ttl}s)</div>`
      : "";

  // Show client information, show hostname only if available
  const ipInfo =
    data.client.name !== null && data.client.name.length > 0
      ? `${utils.escapeHtml(data.client.name)} (${data.client.ip})`
      : data.client.ip;
  const clientInfo = `${divStart}Client:&nbsp;&nbsp;<strong>${ipInfo}</strong></div>`;

  // Show DNSSEC status if applicable
  const dnssec = parseDNSSEC(data);
  const dnssecInfo =
    dnssec.color !== ""
      ? `${divStart}DNSSEC status:&nbsp;&nbsp;<strong class="${dnssec.color}">${dnssec.text}</strong></div>`
      : "";

  // Show long-term database information if applicable
  const dbInfo = data.dbid !== false ? `${divStart}Database ID:&nbsp;&nbsp;${data.id}</div>` : "";

  // Always show reply info, add reply delay if applicable
  const replyInfo =
    data.reply.type !== "UNKNOWN"
      ? `${divStart}Reply:&nbsp;&nbsp;${data.reply.type}</div>`
      : `${divStart}Reply:&nbsp;&nbsp;No reply received</div>`;

  // Show extended DNS error if applicable
  const edeInfo =
    data.ede && data.ede.text
      ? `${divStart}Extended DNS error:&nbsp;&nbsp;<strong${dnssec.color ? ` class="${dnssec.color}"` : ""}>${data.ede.text}</strong></div>`
      : "";

  const receiveTime = moment.unix(data.time).format("Y-MM-DD HH:mm:ss.SSS z");

  // Compile extra info for displaying
  return (
    `<div class="row">${divStart}Query received on:&nbsp;&nbsp;${receiveTime}</div>` +
    `${clientInfo}${dnssecInfo}${edeInfo}${statusInfo}${cnameInfo}${listInfo}${ttlInfo}${replyInfo}${dbInfo}</div>`
  );
}

function addSelectSuggestion(name, dict, data) {
  const filterElement = document.getElementById(`${name}_filter`);
  if (!filterElement) return;

  let value = "";
  filterElement.innerHTML = "";

  // In order for the placeholder value to appear, we have to have a blank
  // <option> as the first option in our <select> control. This is because
  // the browser tries to select the first option by default. If our first
  // option were non-empty, the browser would display this instead of the
  // placeholder.
  const option = document.createElement("option");
  filterElement.append(option);

  // Add GET parameter as first suggestion (if present and not already included)
  if (name in dict) {
    value = decodeURIComponent(dict[name]);
    if (!data.includes(value)) data.unshift(value);
  }

  // Add data obtained from API
  for (const text of Object.values(data)) {
    const option = document.createElement("option");
    option.value = text;
    option.textContent = text;
    filterElement.append(option);
  }

  // Select GET parameter (if present)
  if (name in dict) {
    filterElement.value = value;
  }
}

function getSuggestions(dict) {
  $.get(
    `${document.body.dataset.apiurl}/queries/suggestions`,
    data => {
      for (const filter of Object.values(filters)) {
        addSelectSuggestion(filter, dict, data.suggestions[filter]);
      }
    },
    "json"
  );
}

function parseFilters() {
  return Object.fromEntries(
    filters.map(filter => [filter, document.getElementById(`${filter}_filter`).value])
  );
}

function getApiUrl(filters) {
  const baseUrl = `${document.body.dataset.apiurl}/queries`;
  const params = new URLSearchParams();

  for (const [key, filter] of Object.entries(filters)) {
    const isKeyInFilters =
      key in filters &&
      (typeof filters[key] === "number" ||
        (typeof filters[key] === "string" && filters[key].length > 0));

    if (isKeyInFilters) {
      params.set(key, filter);
    }
  }

  // Omit from/until filtering if we cannot reach these times. This will speed
  // up the database lookups notably on slow devices. The API accepts timestamps
  // in seconds since epoch
  if (from > beginningOfTime) params.set("from", from);
  if (until > beginningOfTime && until < endOfTime) params.set("until", until);

  if (document.getElementById("disk").checked) params.set("disk", "true");

  return `${baseUrl}?${params.toString()}`;
}

let liveMode = false;
const liveCheckbox = document.getElementById("live");
liveCheckbox.checked = liveMode;

liveCheckbox.addEventListener("click", event => {
  liveMode = event.currentTarget.checked;
  liveUpdate();
});

function liveUpdate() {
  if (liveMode) {
    refreshTable();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  for (const [sel, element] of Object.entries(filters)) {
    $(`#${element}_filter`).select2({
      width: "100%",
      tags: sel < 4, // Only the first four (client(IP/name), domain, upstream) are allowed to freely specify input
      placeholder: "Select...",
      allowClear: true,
    });
  }

  // Do we want to filter queries?
  const queryParams = utils.parseQueryString();

  getSuggestions(queryParams);
  const apiURL = getApiUrl(queryParams);

  if (Object.hasOwn(queryParams, "from")) {
    from = queryParams.from;
  }

  if (Object.hasOwn(queryParams, "until")) {
    until = queryParams.until;
  }

  initDateRangePicker();

  table = $("#all-queries").DataTable({
    ajax: {
      url: apiURL,
      error: handleAjaxError,
      dataSrc: "queries",
      data(d) {
        if (cursor !== null) d.cursor = cursor;
      },
      dataFilter(d) {
        const json = JSON.parse(d);
        cursor = json.cursor; // Extract cursor from original data
        if (liveMode) {
          utils.setTimer(liveUpdate, REFRESH_INTERVAL.query_log);
        }

        return d;
      },
    },
    serverSide: true,
    dom:
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    autoWidth: false,
    processing: false,
    order: [[0, "desc"]],
    columns: [
      {
        data: "time",
        width: "10%",
        render(data, type) {
          return type === "display"
            ? moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z")
            : data;
        },
        searchable: false,
      },
      { data: "status", width: "1%", searchable: false },
      { data: "type", width: "1%", searchable: false },
      { data: "domain", width: "45%" },
      { data: "client.ip", width: "29%", type: "ip-address" },
      { data: "reply.time", width: "4%", render: formatReplyTime, searchable: false },
      { data: null, width: "10%", sortable: false, searchable: false },
    ],
    lengthMenu: [
      [10, 25, 50, 100, 500, 1000],
      [10, 25, 50, 100, 500, 1000],
    ],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("query_log_table", data);
    },
    stateLoadCallback() {
      return utils.stateLoadCallback("query_log_table");
    },
    rowCallback(row, data) {
      const tds = row.querySelectorAll("td");
      const queryStatus = parseQueryStatus(data);

      if (queryStatus.icon !== false) {
        const classes = `${queryStatus.icon} ${queryStatus.colorClass}`;
        const title = utils.escapeHtml(queryStatus.fieldText);
        tds[1].innerHTML = `<i class="fa fa-fw ${classes}" title="${title}"></i>`;
      } else if (queryStatus.colorClass !== false) {
        row.classList.add(queryStatus.colorClass);
      }

      // Define row background color
      row.classList.add(queryStatus.blocked === true ? "blocked-row" : "allowed-row");

      // Prefix colored DNSSEC icon to domain text
      const dnssec = parseDNSSEC(data);
      const dnssecIconHtml = `<i class="mr-2 fa fa-fw ${dnssec.icon} ${dnssec.color}" title="DNSSEC: ${dnssec.text}"></i>`;

      // Substitute domain by "." if empty and escape domain
      const domain = data.domain === 0 ? "." : dnssecIconHtml + utils.escapeHtml(data.domain);

      // Add domain in CNAME chain causing the query to have been blocked
      if (queryStatus.isCNAME) {
        data.cname = utils.escapeHtml(data.cname);
        tds[3].innerHTML = `${domain}\n(blocked ${data.cname})`;
      } else {
        tds[3].innerHTML = domain;
      }

      // Show hostname instead of IP if available
      tds[4].textContent =
        data.client.name !== null && data.client.name !== "" ? data.client.name : data.client.ip;

      // Show X-icon instead of reply time if no reply was received
      if (data.reply.type === "UNKNOWN") {
        tds[5].innerHTML = '<i class="fa fa-times"></i>';
      }

      if (queryStatus.buttonHtml !== false) {
        tds[6].innerHTML = queryStatus.buttonHtml;
      }
    },
    initComplete() {
      this.api()
        .columns()
        .every(function () {
          // Skip columns that are not searchable
          const colIdx = this.index();
          const bSearchable = this.context[0].aoColumns[colIdx].bSearchable;
          if (!bSearchable) return null;

          // Replace footer text with input field for searchable columns
          const input = document.createElement("input");
          input.placeholder = this.footer().textContent;
          this.footer().replaceChildren(input);

          // Event listener for user input
          input.addEventListener("keyup", () => {
            if (this.search() !== this.value) {
              this.search(input.value).draw();
            }
          });

          return null;
        });
    },
  });

  // Add event listener for both row details and buttons in a single handler
  document.querySelector("#all-queries tbody").addEventListener("click", event => {
    const tr = event.target.closest("tr");

    // If no tr found or it has the details-row class, exit
    if (!tr || tr.classList.contains("details-row")) return;

    // Handle button clicks
    const button = event.target.closest("button");
    if (button) {
      // Get row data from DataTables API
      const data = table.row(tr).data();

      // Process based on button type
      if (button.classList.contains("btn-whitelist")) {
        utils.addFromQueryLog(data.domain, "allow");
      } else if (button.classList.contains("btn-blacklist")) {
        utils.addFromQueryLog(data.domain, "deny");
      }

      return;
    }

    // Handle row click for expanding details
    // Skip if text is selected
    if (globalThis.getSelection().toString().length > 0) return;

    // Get the DataTables row
    const row = table.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.classList.remove("shown");
    } else {
      // Open this row and add class
      row.child(formatInfo(row.data()), "details-row").show();
      tr.classList.add("shown");
    }
  });

  document.getElementById("refresh").addEventListener("click", refreshTable);

  // Disable live mode when #disk is checked
  document.getElementById("disk").addEventListener("click", event => {
    const liveCheckbox = document.getElementById("live");
    if (event.currentTarget.checked) {
      liveCheckbox.checked = false;
      liveCheckbox.disabled = true;
      liveMode = false;
    } else {
      liveCheckbox.disabled = false;
    }
  });
});

function refreshTable() {
  // Set cursor to null so we pick up newer queries
  cursor = null;

  // Clear table
  table.clear();

  // Source data from API
  const filters = parseFilters();
  filters.from = from;
  filters.until = until;
  const apiUrl = getApiUrl(filters);
  table.ajax.url(apiUrl).draw();
}
