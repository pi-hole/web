/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false, REFRESH_INTERVAL:false */

const beginningOfTime = 1262304000; // Jan 01 2010, 00:00 in seconds
const endOfTime = 2147483647; // Jan 19, 2038, 03:14 in seconds
var from = beginningOfTime;
var until = endOfTime;

var dateformat = "MMM Do YYYY, HH:mm";

var table = null;
var cursor = null;
var filters = [
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
    function (startt, endt) {
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
  var fieldtext,
    buttontext,
    icon = null,
    colorClass = false,
    blocked = false,
    isCNAME = false;
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
      fieldtext = "Forwarded to " + data.upstream;
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

  var matchText =
    colorClass === "text-green" ? "allowed" : colorClass === "text-red" ? "blocked" : "matched";

  return {
    fieldtext: fieldtext,
    buttontext: buttontext,
    colorClass: colorClass,
    icon: icon,
    isCNAME: isCNAME,
    matchText: matchText,
    blocked: blocked,
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

function formatInfo(data) {
  // DNSSEC status
  var dnssecStatus = data.dnssec,
    dnssecClass;
  switch (data.dnssec) {
    case "SECURE":
      dnssecClass = "text-green";
      break;
    case "INSECURE":
      dnssecClass = "text-orange";
      break;
    case "BOGUS":
      dnssecClass = "text-red";
      break;
    case "ABANDONED":
      dnssecClass = "text-red";
      break;
    default:
      // No DNSSEC or UNKNOWN
      dnssecStatus = "N/A";
      dnssecClass = false;
  }

  // Parse Query Status
  var queryStatus = parseQueryStatus(data);
  var divStart = '<div class="col-xl-2 col-lg-4 col-md-6 col-12 overflow-wrap">';
  var statusInfo = "";
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

  var listInfo = "",
    cnameInfo = "";
  if (data.list_id !== null && data.list_id !== -1) {
    // Some list matched - add link to search page

    var listLink =
      '<a href="search?domain=' +
      encodeURIComponent(data.domain) +
      '" target="_blank">search lists</a>';
    listInfo = divStart + "Query was " + queryStatus.matchText + ", " + listLink + "</div>";
  }

  if (queryStatus.isCNAME) {
    cnameInfo =
      divStart + "Query was blocked during CNAME inspection of&nbsp;&nbsp;" + data.cname + "</div>";
  }

  // Show TTL if applicable
  var ttlInfo = "";
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
  var ipInfo =
    data.client.name !== null && data.client.name.length > 0
      ? utils.escapeHtml(data.client.name) + " (" + data.client.ip + ")"
      : data.client.ip;
  var clientInfo = divStart + "Client:&nbsp;&nbsp;<strong>" + ipInfo + "</strong></div>";

  // Show DNSSEC status if applicable
  var dnssecInfo = "";
  if (dnssecClass !== false) {
    dnssecInfo =
      divStart +
      'DNSSEC status:&nbsp&nbsp;<strong><span class="' +
      dnssecClass +
      '">' +
      dnssecStatus +
      "</span></strong></div>";
  }

  // Show long-term database information if applicable
  var dbInfo = "";
  if (data.dbid !== false) {
    dbInfo = divStart + "Database ID:&nbsp;&nbsp;" + data.id + "</div>";
  }

  // Always show reply info, add reply delay if applicable
  var replyInfo = "";
  replyInfo =
    data.reply.type !== "UNKNOWN"
      ? divStart + "Reply:&nbsp&nbsp;" + data.reply.type + "</div>"
      : divStart + "Reply:&nbsp;&nbsp;No reply received</div>";

  // Compile extra info for displaying
  return (
    '<div class="row">' +
    divStart +
    "Query received on:&nbsp;&nbsp;" +
    moment.unix(data.time).format("Y-MM-DD HH:mm:ss.SSS z") +
    "</div>" +
    clientInfo +
    dnssecInfo +
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
  var obj = $("#" + name + "_filter"),
    value = "";
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
  for (var key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      continue;
    }

    var text = data[key];
    obj.append($("<option />").val(text).text(text));
  }

  // Select GET parameter (if present)
  if (name in dict) {
    obj.val(value);
  }
}

/*
function addChkboxSuggestion(name, data) {
  var obj = $("#" + name + "_filter");
  obj.empty();

  // Add data obtained from API
  for (var key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      continue;
    }

    var text = data[key];
    obj.append(
      '<div class="checkbox"><label><input type="checkbox" checked id="' +
        name +
        "_" +
        key +
        '">' +
        text +
        "</label></div>"
    );
  }
}
*/
function getSuggestions(dict) {
  $.get(
    "/api/queries/suggestions",
    function (data) {
      for (var key in filters) {
        if (Object.hasOwnProperty.call(filters, key)) {
          var f = filters[key];
          addSelectSuggestion(f, dict, data.suggestions[f]);
        }
      }
    },
    "json"
  );
}

function parseFilters() {
  var filter = {};
  for (var key in filters) {
    if (Object.hasOwnProperty.call(filters, key)) {
      var f = filters[key];
      filter[f] = $("#" + f + "_filter").val();
    }
  }

  return filter;
}

function filterOn(param, dict) {
  const typ = typeof dict[param];
  return param in dict && (typ === "number" || (typ === "string" && dict[param].length > 0));
}

function getAPIURL(filters) {
  var apiurl = "/api/queries?";
  for (var key in filters) {
    if (Object.hasOwnProperty.call(filters, key)) {
      var filter = filters[key];
      if (filterOn(key, filters)) {
        if (!apiurl.endsWith("?")) apiurl += "&";
        apiurl += key + "=" + encodeURIComponent(filter);
      }
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

var liveMode = false;
$("#live").prop("checked", liveMode);
$("#live").on("click", function () {
  liveMode = $(this).prop("checked");
  liveUpdate();
});

function liveUpdate() {
  if (liveMode) {
    refreshTable();
  }
}

$(function () {
  // Do we want to filter queries?
  var GETDict = utils.parseQueryString();

  for (var sel in filters) {
    if (Object.hasOwnProperty.call(filters, sel)) {
      var element = filters[sel];
      $("#" + element + "_filter").select2({
        width: "100%",
        tags: sel < 3, // Only the first three are allowed to freely specify input
        placeholder: "Select...",
        allowClear: true,
      });
    }
  }

  getSuggestions(GETDict);
  var apiurl = getAPIURL(GETDict);

  if ("from" in GETDict) {
    from = GETDict.from;
    $("#from").val(moment.unix(from).format("Y-MM-DD HH:mm:ss"));
  }

  if ("until" in GETDict) {
    until = GETDict.until;
    $("#until").val(moment.unix(until).format("Y-MM-DD HH:mm:ss"));
  }

  initDateRangePicker();

  table = $("#all-queries").DataTable({
    ajax: {
      url: apiurl,
      error: handleAjaxError,
      dataSrc: "queries",
      data: function (d) {
        if (cursor !== null) d.cursor = cursor;
      },
      dataFilter: function (d) {
        var json = jQuery.parseJSON(d);
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
        render: function (data, type) {
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
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    stateSave: true,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("query_log_table", data);
    },
    stateLoadCallback: function () {
      return utils.stateLoadCallback("query_log_table");
    },
    rowCallback: function (row, data) {
      var querystatus = parseQueryStatus(data);

      // Remove HTML from querystatus.fieldtext
      var rawtext = $("<div/>").html(querystatus.fieldtext).text();

      if (querystatus.icon !== false) {
        $("td:eq(1)", row).html(
          "<i class='fa fa-fw " +
            querystatus.icon +
            " " +
            querystatus.colorClass +
            "' title='" +
            rawtext +
            "'></i>"
        );
      } else if (querystatus.colorClass !== false) {
        $(row).addClass(querystatus.colorClass);
      }

      // Define row background color
      $(row).addClass(querystatus.blocked === true ? "blocked-row" : "allowed-row");

      // Substitute domain by "." if empty
      var domain = data.domain === 0 ? "." : data.domain;

      if (querystatus.isCNAME) {
        // Add domain in CNAME chain causing the query to have been blocked
        $("td:eq(3)", row).text(domain + "\n(blocked " + data.cname + ")");
      } else {
        $("td:eq(3)", row).text(domain);
      }

      // Show hostname instead of IP if available
      if (data.client.name !== null && data.client.name !== "") {
        $("td:eq(4)", row).text(data.client.name);
      } else {
        $("td:eq(4)", row).text(data.client.ip);
      }

      if (querystatus.buttontext !== false) {
        $("td:eq(6)", row).html(querystatus.buttontext);
      }
    },
    initComplete: function () {
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
    var button = $(this);
    var tr = button.parents("tr");
    var allowButton = button[0].classList.contains("text-green");
    var denyButton = button[0].classList.contains("text-red");
    var data = table.row(tr).data();
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
    var tr = $(this);
    var row = table.row(tr);

    if (window.getSelection().toString().length > 0) {
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
  var filters = parseFilters();
  filters.from = from;
  filters.until = until;
  var apiurl = getAPIURL(filters);
  table.ajax.url(apiurl).draw();
}
