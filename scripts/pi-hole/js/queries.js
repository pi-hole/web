/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false */

var beginningOfTime = 0; // Jan 01 1970, 00:00
var endOfTime = 2147483647 * 1000; // Jan 19, 2038, 03:14
var from = beginningOfTime;
var until = endOfTime;

var dateformat = "MMMM Do YYYY, HH:mm";

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

$(function () {
  $("#querytime").daterangepicker(
    {
      timePicker: true,
      timePickerIncrement: 5,
      timePicker24Hour: true,
      locale: { format: dateformat },
      startDate: moment(beginningOfTime),
      endDate: moment(endOfTime),
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
        "All Time": [moment(beginningOfTime), moment(endOfTime)],
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: true,
    },
    function (startt, endt) {
      from = moment(startt).utc().valueOf() / 1000;
      until = moment(endt).utc().valueOf() / 1000;
    }
  );
});

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else {
    alert("An unknown error occured while loading the data.\n" + xhr.responseText);
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
    isCNAME = false,
    regexLink = false;
  switch (data.status) {
    case "GRAVITY":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (gravity)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "FORWARDED":
      colorClass = "text-green";
      icon = "fa-solid fa-cloud-download-alt";
      fieldtext = "Forwarded to " + data.upstream;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "CACHE":
      colorClass = "text-green";
      icon = "fa-regular fa-database";
      fieldtext = "Served from cache";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "REGEX":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(regex)";
      regexLink = data.regex > 0;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "DENYLIST":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(exact)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "EXTERNAL_BLOCKED_IP":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(external, IP)";
      buttontext = "";
      break;
    case "EXTERNAL_BLOCKED_NULL":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(external, NULL)";
      buttontext = "";
      break;
    case "EXTERNAL_BLOCKED_NXRA":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(external, NXRA)";
      buttontext = "";
      break;
    case "GRAVITY_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked (gravity, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      break;
    case "REGEX_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(regex diened, CNAME)";
      regexLink = data.regex > 0;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      break;
    case "DENYLIST_CNAME":
      colorClass = "text-red";
      icon = "fa-solid fa-ban";
      fieldtext = "Blocked <br class='hidden-lg'>(exact diened, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
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
      fieldtext = "Retried <br class='hidden-lg'>(ignored)";
      buttontext = "";
      break;
    case "IN_PROGRESS":
      colorClass = "text-green";
      icon = "fa-solid fa-redo";
      fieldtext = "Already forwarded";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "CACHE_STALE":
      colorClass = "text-green";
      icon = "fa-solid fa-infinity";
      fieldtext = "Served by cache optimizer";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    default:
      colorClass = "text-orange";
      icon = "fa-solid fa-question";
      fieldtext = data.status;
      buttontext = "";
  }

  return {
    fieldtext: fieldtext,
    buttontext: buttontext,
    colorClass: colorClass,
    icon: icon,
    isCNAME: isCNAME,
    regexLink: regexLink,
  };
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
  var divStart = '<div class="col-xl-2 col-lg-4 col-md-6 col-12">';
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

  var regexInfo = "",
    cnameInfo = "";
  if (queryStatus.regexLink) {
    var regexLink =
      '<a href="groups-domains.php?domainid=' +
      data.regex +
      'target="_blank">Regex ID ' +
      data.regex +
      "</a>";
    regexInfo = divStart + "Query was blocked by:</td><td>" + regexLink + "</div>";
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
  if (data.reply.type !== "UNKNOWN") {
    replyInfo = divStart + "Reply:&nbsp&nbsp;" + data.reply.type;
    if (data.reply.time >= 0 && data.reply.type !== "UNKNOWN") {
      replyInfo +=
        " (" +
        (data.reply.time < 1
          ? (1e3 * data.reply.time).toFixed(1) + " ms)"
          : data.reply.time.toFixed(1) + " s)");
    }

    replyInfo += "</div>";
  } else {
    replyInfo = divStart + "Reply:&nbsp;&nbsp;No reply received</div>";
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
    statusInfo +
    cnameInfo +
    regexInfo +
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
  return param in dict && typeof dict[param] === "string" && dict[param].length > 0;
}

function getAPIURL(dict) {
  var apiurl = "/api/queries?";
  for (var key in filters) {
    if (Object.hasOwnProperty.call(filters, key)) {
      var filter = filters[key];
      if (filterOn(filter, dict)) apiurl += "&" + filter + "=" + dict[filter];
    }
  }

  // Omit from/until filtering if we cannot reach these times. This will speed
  // up the database lookups notably on slow devices.
  if (from > beginningOfTime) apiurl += "&from=" + from;
  if (until > beginningOfTime && until < endOfTime) apiurl += "&until=" + until;

  if ($("#disk").prop("checked")) apiurl += "&disk=true";

  return encodeURI(apiurl);
}

$(function () {
  // Do we want to filter queries?
  var GETDict = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

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
      },
      { data: "status", width: "1%" },
      { data: "type", width: "5%" },
      { data: "domain", width: "50%" },
      { data: "client.ip", width: "34%", type: "ip-address", render: $.fn.dataTable.render.text() },
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
    },
  });

  $("#all-queries tbody").on("click", "button", function () {
    var tr = $(this).parents("tr");
    var permitted = tr[0].classList.contains("text-green");
    var blocked = tr[0].classList.contains("text-red");
    var data = table.row(tr).data();
    if (permitted) {
      utils.addFromQueryLog(data.domain, "deny");
    } else if (blocked) {
      utils.addFromQueryLog(data.domain, "allow");
    }
  });

  // Add event listener for opening and closing details
  $("#all-queries tbody").on("click", "tr", function () {
    var tr = $(this);
    var row = table.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass("shown");
    } else {
      // Open this row
      row.child(formatInfo(row.data())).show();
      tr.addClass("shown");
    }
  });

  $("#refresh").on("click", refreshTable);
});

function refreshTable() {
  // Set cursor to NULL so we pick up newer queries
  cursor = null;

  // Clear table
  table.clear();

  // Source data from API
  var filters = parseFilters();
  var apiurl = getAPIURL(filters);
  table.ajax.url(apiurl).draw();
}
