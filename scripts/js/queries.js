/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false, REFRESH_INTERVAL:false */

"use strict";

// These values are provided by the API
// We initialize them as null and populate them during page init.
let beginningOfTime = null; // seconds since epoch
// endOfTime should be the end of today (local), in seconds since epoch
const endOfTime = moment().endOf("day").unix();
// endOfEpoch to allow live updates to continue beyond end of day
const endOfEpoch = 2_147_483_647; // Jan 19, 2038, 03:14 in seconds
let from = null;
let until = null;

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
let doDNSSEC = false;

// Check if pihole is validiting DNSSEC
function getDnssecConfig() {
  $.getJSON(document.body.dataset.apiurl + "/config/dns/dnssec", data => {
    doDNSSEC = data.config.dns.dnssec;

    // redraw the table to show the icons when the API call returns
    $("#all-queries").DataTable().draw();
  });
}

function initDateRangePicker(data) {
  // earliest_timestamp is provided in seconds since epoch
  // We have two sources: earliest_timestamp_disk (on-disk) and earliest_timestamp (in-memory)
  // Use whichever is smallest and non-zero
  const diskTimestamp = Number(data.earliest_timestamp_disk);
  const memoryTimestamp = Number(data.earliest_timestamp);

  // Filter out zero/invalid timestamps
  const validTimestamps = [diskTimestamp, memoryTimestamp].filter(ts => ts > 0);

  // Use the smallest valid timestamp, or null if none exist
  beginningOfTime = validTimestamps.length > 0 ? Math.min(...validTimestamps) : null;

  // Round down to nearest 5-minute segment (300 seconds) if valid
  if (beginningOfTime !== null) {
    beginningOfTime = Math.floor(beginningOfTime / 300) * 300;
  }

  // If from/until were not provided via GET, default them
  // Only use defaults if beginningOfTime is valid
  if (beginningOfTime !== null) {
    from ??= beginningOfTime;
    until ??= endOfTime;
  }

  // If there's no valid data in the database, disable the datepicker
  if (beginningOfTime === null) {
    $("#querytime").prop("disabled", true);
    $("#querytime").addClass("disabled");
    $("#querytime-note").text("ℹ️ No data in the database");
    return;
  }

  const minDateMoment = moment.unix(beginningOfTime);
  const maxDateMoment = moment.unix(endOfTime);
  const earliestDateStr = minDateMoment.format(dateformat);
  $("#querytime-note").text(`Earliest date: ${earliestDateStr}`);

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
        Today: [moment().startOf("day"), maxDateMoment],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [moment().subtract(6, "days").startOf("day"), maxDateMoment],
        "Last 30 Days": [moment().subtract(29, "days").startOf("day"), maxDateMoment],
        "This Month": [moment().startOf("month"), maxDateMoment],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        "This Year": [moment().startOf("year"), maxDateMoment],
        "All Time": [minDateMoment, maxDateMoment],
      },
      // Don't allow selecting dates outside the database range
      minDate: minDateMoment,
      maxDate: maxDateMoment,
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: true,
    },
    (startt, endt) => {
      // Update global variables
      // Convert milliseconds (JS) to seconds (API)
      from = moment(startt).utc().valueOf() / 1000;
      until = moment(endt).utc().valueOf() / 1000;
    }
  );
}

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else {
    alert("An unknown error occurred while loading the data.\n" + xhr.responseText);
  }

  $("#all-queries_processing").hide();
  table.clear();
  table.draw();
}

function parseQueryStatus(data) {
  // Parse query status
  let fieldtext;
  let buttontext;
  let icon = null;
  let colorClass = false;
  let blocked = false;
  let isCNAME = false;
  switch (data.status) {
    case "GRAVITY":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (gravity)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      blocked = true;
      break;
    case "FORWARDED":
      colorClass = "text-green";
      icon = "fa-solid fa-cloud-download-alt";
      fieldtext =
        (data.reply.type !== "UNKNOWN" ? "Forwarded, reply from " : "Forwarded to ") +
        data.upstream;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "CACHE":
      colorClass = "text-green";
      icon = "fa-solid fa-database";
      fieldtext = "Served from cache";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "REGEX":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (regex)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      blocked = true;
      break;
    case "DENYLIST":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (exact)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      blocked = true;
      break;
    case "EXTERNAL_BLOCKED_IP":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (external, IP)";
      buttontext = "";
      blocked = true;
      break;
    case "EXTERNAL_BLOCKED_NULL":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (external, NULL)";
      buttontext = "";
      blocked = true;
      break;
    case "EXTERNAL_BLOCKED_NXRA":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (external, NXRA)";
      buttontext = "";
      blocked = true;
      break;
    case "QUERY_EXTERNAL_BLOCKED_EDE15":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (external, EDE15)";
      buttontext = "";
      blocked = true;
      break;
    case "GRAVITY_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (gravity, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      blocked = true;
      break;
    case "REGEX_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (regex denied, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      blocked = true;
      break;
    case "DENYLIST_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (exact denied, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green btn-whitelist"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      blocked = true;
      break;
    case "RETRIED":
      colorClass = "text-green";
      icon = "fa-solid fa-redo"; // fa-repeat
      fieldtext = "Retried";
      buttontext = "";
      break;
    case "RETRIED_DNSSEC":
      colorClass = "text-green";
      icon = "fa-solid fa-redo"; // fa-repeat
      fieldtext = "Retried (ignored)";
      buttontext = "";
      break;
    case "IN_PROGRESS":
      colorClass = "text-green";
      icon = "fa-solid fa-hourglass-half";
      fieldtext = "Already forwarded, awaiting reply";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "CACHE_STALE":
      colorClass = "text-green";
      icon = "fa-solid fa-infinity";
      fieldtext = "Served by cache optimizer";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red btn-blacklist"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "SPECIAL_DOMAIN":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = data.status;
      buttontext = "";
      blocked = true;
      break;
    default:
      colorClass = "text-orange";
      icon = "fa-solid fa-question";
      fieldtext = data.status;
      buttontext = "";
  }

  const matchText =
    colorClass === "text-green" ? "allowed" : colorClass === "text-red" ? "blocked" : "matched";

  return {
    fieldtext,
    buttontext,
    colorClass,
    icon,
    isCNAME,
    matchText,
    blocked,
  };
}

function formatReplyTime(replyTime, type) {
  if (type === "display") {
    // Units:
    //  - seconds if replytime >= 1 second
    //  - milliseconds if reply time >= 100 µs
    //  - microseconds otherwise
    return replyTime < 1e-4
      ? (1e6 * replyTime).toFixed(1) + " µs"
      : replyTime < 1
        ? (1e3 * replyTime).toFixed(1) + " ms"
        : replyTime.toFixed(1) + " s";
  }

  // else: return the number itself (for sorting and searching)
  return replyTime;
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
      icon = "fa-solid fa-exclamation-triangle";
      color = "text-red";
      break;
    case "ABANDONED":
      icon = "fa-solid fa-exclamation-triangle";
      color = "text-red";
      break;
    default:
      // No DNSSEC or UNKNOWN
      text = "N/A";
      color = "";
      icon = "";
  }

  return { text, icon, color };
}

function formatInfo(data) {
  // Parse Query Status
  const dnssec = parseDNSSEC(data);
  const queryStatus = parseQueryStatus(data);
  const divStart = '<div class="col-xl-2 col-lg-4 col-md-6 col-12 overflow-wrap">';
  let statusInfo = "";
  if (queryStatus.colorClass !== false) {
    statusInfo =
      divStart +
      "Query Status:&nbsp;&nbsp;" +
      '<strong><span class="' +
      queryStatus.colorClass +
      '">' +
      queryStatus.fieldtext +
      "</span></strong></div>";
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

  let cnameInfo = "";
  if (queryStatus.isCNAME) {
    cnameInfo =
      divStart + "Query was blocked during CNAME inspection of&nbsp;&nbsp;" + data.cname + "</div>";
  }

  // Show TTL if applicable
  let ttlInfo = "";
  if (data.ttl > 0) {
    ttlInfo =
      divStart +
      "Time-to-live (TTL):&nbsp;&nbsp;" +
      moment.duration(data.ttl, "s").humanize() +
      " (" +
      data.ttl +
      "s)</div>";
  }

  // Show client information, show hostname only if available
  const ipInfo =
    data.client.name !== null && data.client.name.length > 0
      ? utils.escapeHtml(data.client.name) + " (" + data.client.ip + ")"
      : data.client.ip;
  const clientInfo = divStart + "Client:&nbsp;&nbsp;<strong>" + ipInfo + "</strong></div>";

  // Show DNSSEC status if applicable
  let dnssecInfo = "";
  if (dnssec.color !== "") {
    dnssecInfo =
      divStart +
      'DNSSEC status:&nbsp;&nbsp;<strong><span class="' +
      dnssec.color +
      '">' +
      dnssec.text +
      "</span></strong></div>";
  }

  // Show long-term database information if applicable
  let dbInfo = "";
  if (data.dbid !== false) {
    dbInfo = divStart + "Database ID:&nbsp;&nbsp;" + data.id + "</div>";
  }

  // Always show reply info, add reply delay if applicable
  let replyInfo = "";
  replyInfo =
    data.reply.type !== "UNKNOWN"
      ? divStart + "Reply:&nbsp;&nbsp;" + data.reply.type + "</div>"
      : divStart + "Reply:&nbsp;&nbsp;No reply received</div>";

  // Show extended DNS error if applicable
  let edeInfo = "";
  if (data.ede !== null && data.ede.text !== null) {
    edeInfo = divStart + "Extended DNS error:&nbsp;&nbsp;<strong";
    if (dnssec.color !== "") {
      edeInfo += ' class="' + dnssec.color + '"';
    }

    edeInfo += ">" + data.ede.text + "</strong></div>";
  }

  // Compile extra info for displaying
  return (
    '<div class="row">' +
    divStart +
    "Query received on:&nbsp;&nbsp;" +
    moment.unix(data.time).format("Y-MM-DD HH:mm:ss.SSS z") +
    "</div>" +
    clientInfo +
    dnssecInfo +
    edeInfo +
    statusInfo +
    cnameInfo +
    listInfo +
    ttlInfo +
    replyInfo +
    dbInfo +
    "</div>"
  );
}

function addSelectSuggestion(name, dict, data) {
  const obj = $("#" + name + "_filter");
  let value = "";
  obj.empty();

  // In order for the placeholder value to appear, we have to have a blank
  // <option> as the first option in our <select> control. This is because
  // the browser tries to select the first option by default. If our first
  // option were non-empty, the browser would display this instead of the
  // placeholder.
  obj.append($("<option />"));

  // Add GET parameter as first suggestion (if present and not already included)
  if (name in dict) {
    value = decodeURIComponent(dict[name]);
    if (!data.includes(value)) data.unshift(value);
  }

  // Add data obtained from API
  for (const text of Object.values(data)) {
    obj.append($("<option />").val(text).text(text));
  }

  // Select GET parameter (if present)
  if (name in dict) {
    obj.val(value);
  }
}

function getSuggestions(dict) {
  $.get(
    document.body.dataset.apiurl + "/queries/suggestions",
    data => {
      for (const filter of Object.values(filters)) {
        addSelectSuggestion(filter, dict, data.suggestions[filter]);
      }
    },
    "json"
  );
}

function parseFilters() {
  return Object.fromEntries(filters.map(filter => [filter, $(`#${filter}_filter`).val()]));
}

function filterOn(param, dict) {
  const typ = typeof dict[param];
  return param in dict && (typ === "number" || (typ === "string" && dict[param].length > 0));
}

function getAPIURL(filters) {
  let apiurl = document.body.dataset.apiurl + "/queries?";
  for (const [key, filter] of Object.entries(filters)) {
    if (filterOn(key, filters)) {
      if (!apiurl.endsWith("?")) apiurl += "&";
      apiurl += `${key}=${encodeURIComponent(filter)}`;
    }
  }

  // Omit from/until filtering if we cannot reach these times. This will speed
  // up the database lookups notably on slow devices. The API accepts timestamps
  // in seconds since epoch
  if (from > beginningOfTime) apiurl += "&from=" + from;
  if (until > beginningOfTime && until < endOfTime) apiurl += "&until=" + until;

  if ($("#disk").prop("checked")) apiurl += "&disk=true";

  return encodeURI(apiurl);
}

let liveMode = false;
$("#live").prop("checked", liveMode);
$("#live").on("click", function () {
  liveMode = $(this).prop("checked");
  until = endOfEpoch; // allow live updates to continue indefinitely
  liveUpdate();
});

function liveUpdate() {
  if (liveMode) {
    refreshTable();
  }
}

$(() => {
  // Do we want to show DNSSEC icons?
  getDnssecConfig();

  // Do we want to filter queries?
  const GETDict = utils.parseQueryString();

  for (const [sel, element] of Object.entries(filters)) {
    $(`#${element}_filter`).select2({
      width: "100%",
      tags: sel < 4, // Only the first four (client(IP/name), domain, upstream) are allowed to freely specify input
      placeholder: "Select...",
      allowClear: true,
    });
  }

  getSuggestions(GETDict);
  const apiURL = getAPIURL(GETDict);

  if ("from" in GETDict) {
    from = Number(GETDict.from);
  }

  if ("until" in GETDict) {
    until = Number(GETDict.until);
  }

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

        // Initialize the date picker (if not already done)
        if (beginningOfTime === null) {
          initDateRangePicker(json);
        }

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
          if (type === "display") {
            return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
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
      const state = utils.stateLoadCallback("query_log_table");
      // Default to 25 entries if "All" was previously selected
      if (state) state.length = state.length === -1 ? 25 : state.length;
      return state;
    },
    rowCallback(row, data) {
      const querystatus = parseQueryStatus(data);

      if (querystatus.icon !== false) {
        $("td:eq(1)", row).html(
          "<i class='fa fa-fw " +
            querystatus.icon +
            " " +
            querystatus.colorClass +
            "' title='" +
            utils.escapeHtml(querystatus.fieldtext) +
            "'></i>"
        );
      } else if (querystatus.colorClass !== false) {
        $(row).addClass(querystatus.colorClass);
      }

      // Define row background color
      $(row).addClass(querystatus.blocked === true ? "blocked-row" : "allowed-row");

      // Substitute domain by "." if empty
      let domain = data.domain === 0 ? "." : data.domain;

      // Prefix colored DNSSEC icon to domain text
      let dnssecIcon = "";
      if (doDNSSEC === true) {
        const dnssec = parseDNSSEC(data);
        dnssecIcon =
          '<i class="mr-2 fa fa-fw ' +
          dnssec.icon +
          " " +
          dnssec.color +
          '" title="DNSSEC: ' +
          dnssec.text +
          '"></i>';
      }

      // Escape HTML in domain
      domain = dnssecIcon + utils.escapeHtml(domain);

      if (querystatus.isCNAME) {
        // Add domain in CNAME chain causing the query to have been blocked
        data.cname = utils.escapeHtml(data.cname);
        $("td:eq(3)", row).html(domain + "\n(blocked " + data.cname + ")");
      } else {
        $("td:eq(3)", row).html(domain);
      }

      // Show hostname instead of IP if available
      if (data.client.name !== null && data.client.name !== "") {
        $("td:eq(4)", row).text(data.client.name);
      } else {
        $("td:eq(4)", row).text(data.client.ip);
      }

      // Show X-icon instead of reply time if no reply was received
      if (data.reply.type === "UNKNOWN") {
        $("td:eq(5)", row).html('<i class="fa fa-times"></i>');
      }

      if (querystatus.buttontext !== false) {
        $("td:eq(6)", row).html(querystatus.buttontext);
      }
    },
    initComplete() {
      this.api()
        .columns()
        .every(function () {
          // Skip columns that are not searchable
          const colIdx = this.index();
          const bSearchable = this.context[0].aoColumns[colIdx].bSearchable;
          if (!bSearchable) {
            return null;
          }

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

  // Add event listener for adding domains to the allow-/blocklist
  $("#all-queries tbody").on("click", "button", function (event) {
    const button = $(this);
    const tr = button.parents("tr");
    const allowButton = button[0].classList.contains("text-green");
    const denyButton = button[0].classList.contains("text-red");
    const data = table.row(tr).data();
    if (denyButton) {
      utils.addFromQueryLog(data.domain, "deny");
    } else if (allowButton) {
      utils.addFromQueryLog(data.domain, "allow");
    }
    // else: no (colorful) button, so nothing to do

    // Prevent tr click even tto be triggered for row from opening/closing
    event.stopPropagation();
  });

  // Add event listener for opening and closing details, except on rows with "details-row" class
  $("#all-queries tbody").on("click", "tr:not(.details-row)", function () {
    const tr = $(this);
    const row = table.row(tr);

    if (globalThis.getSelection().toString().length > 0) {
      // This event was triggered by a selection, so don't open the row
      return;
    }

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass("shown");
    } else {
      // Open this row. Add a class to the row
      row.child(formatInfo(row.data()), "details-row").show();
      tr.addClass("shown");
    }
  });

  $("#refresh").on("click", refreshTable);

  // Disable live mode when #disk is checked
  $("#disk").on("click", function () {
    if ($(this).prop("checked")) {
      $("#live").prop("checked", false);
      $("#live").prop("disabled", true);
      liveMode = false;
    } else {
      $("#live").prop("disabled", false);
    }
  });
});

function refreshTable() {
  // Set cursor to NULL so we pick up newer queries
  cursor = null;

  // Clear table
  table.clear();

  // Source data from API
  const filters = parseFilters();
  filters.from = from;
  filters.until = until;
  const apiUrl = getAPIURL(filters);
  table.ajax.url(apiUrl).draw();
}
