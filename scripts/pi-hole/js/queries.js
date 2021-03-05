/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false */

var table = null;
var cursor = null;

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") !== -1) {
    alert("An error occured while loading the data: Connection refused. Is FTL running?");
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
    colorClass = false,
    isCNAME = false,
    regexLink = false;
  switch (data.status) {
    case "GRAVITY":
      colorClass = "text-red";
      fieldtext = "Blocked (gravity)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "FORWARDED":
      colorClass = "text-green";
      fieldtext = "Forwarded to " + data.upstream;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "CACHE":
      colorClass = "text-green";
      fieldtext = "Cached";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    case "REGEX":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(regex)";
      regexLink = data.regex > 0;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "DENYLIST":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(exact)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      break;
    case "EXTERNAL_BLOCKED_IP":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(external, IP)";
      buttontext = "";
      break;
    case "EXTERNAL_BLOCKED_NULL":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(external, NULL)";
      buttontext = "";
      break;
    case "EXTERNAL_BLOCKED_NXRA":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(external, NXRA)";
      buttontext = "";
      break;
    case "GRAVITY_CNAME":
      colorClass = "text-red";
      fieldtext = "Blocked (gravity, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      break;
    case "REGEX_CNAME":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(regex diened, CNAME)";
      regexLink = data.regex > 0;
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      break;
    case "DENYLIST_CNAME":
      colorClass = "text-red";
      fieldtext = "Blocked <br class='hidden-lg'>(exact diened, CNAME)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Allow</button>';
      isCNAME = true;
      break;
    case "RETRIED":
      colorClass = "text-green";
      fieldtext = "Retried";
      buttontext = "";
      break;
    case "RETRIED_DNSSEC":
      colorClass = "text-green";
      fieldtext = "Retried <br class='hidden-lg'>(ignored)";
      buttontext = "";
      break;
    case "IN_PROGRESS":
      colorClass = "text-green";
      fieldtext = "OK <br class='hidden-lg'>(already forwarded)";
      buttontext =
        '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
      break;
    default:
      colorClass = false;
      fieldtext = data.status;
      buttontext = "";
  }

  return {
    fieldtext: fieldtext,
    buttontext: buttontext,
    colorClass: colorClass,
    isCNAME: isCNAME,
    regexLink: regexLink
  };
}

function formatInfo(data) {
  row = 0;
  // DNSSEC status
  var dnssecStatus, dnssecClass;
  switch (data.dnssec) {
    case "SECURE":
      dnssecStatus = "SECURE";
      dnssecClass = "text-green";
      break;
    case "INSECURE":
      dnssecStatus = "INSECURE";
      dnssecClass = "text-orange";
      break;
    case "BOGUS":
      dnssecStatus = "BOGUS";
      dnssecClass = "text-red";
      break;
    case "ABANDONED":
      dnssecStatus = "ABANDONED";
      dnssecClass = "text-red";
      break;
    case "UNKNOWN":
      dnssecStatus = "UNKNOWN";
      dnssecClass = "text-orange";
      break;
    default:
      // No DNSSEC
      dnssecStatus = "N/A";
      dnssecClass = false;
  }

  // Parse Query Status
  var queryStatus = parseQueryStatus(data);
  var regexInfo = "",
    cnameInfo = "";
  if (queryStatus.regexLink) {
    var regexLink =
      '<a href="groups-domains.php?domainid=' +
      data.regex +
      'target="_blank">Regex ID ' +
      data.regex +
      "</a>";
    regexInfo =
      '</td></tr><tr class="dataTables-child"><td>Query was blocked by:</td><td>' + regexLink;
  }

  if (queryStatus.isCNAME) {
    cnameInfo =
      '</td></tr><tr class="dataTables-child"><td>Query was blocked during CNAME inspection of</td><td>' +
      data.cname;
  }

  // Show TTL if applicable
  var ttlInfo = "";
  if (data.ttl > 0) {
    ttlInfo =
      '</td></tr><tr class="dataTables-child"><td>Time-to-live (TTL):</td><td>' + data.ttl + "s";
  }

  // Show TTL if applicable
  var dnssecInfo = "";
  if (data.dnssecClass !== false) {
    dnssecInfo =
      '</td></tr><tr class="dataTables-child"><td>DNSSEC status:</td><td class="' +
      dnssecClass +
      '">' +
      dnssecStatus;
  }

  // Show long-term database information if applicable
  var dbInfo = "";
  if (data.dbid !== false) {
    dbInfo = '</td></tr><tr class="dataTables-child"><td>Database ID:</td><td>' + data.dbid;
  }

  // Always show reply info, add reply delay if applicable
  var replyInfo =
    '</td></tr><tr class="dataTables-child"><td>Reply type:</td><td>' + data.reply.type;
  if (data.reply.time >= 0) {
    replyInfo +=
      '</td></tr><tr class="dataTables-child"><td>Reply delay:</td><td>' +
      data.reply.time.toFixed(1) +
      "ms";
  }

  // Compile extra info for displaying
  return (
    "<table><tbody>" +
    '<tr class="dataTables-child"><td>Query received on:&nbsp;&nbsp;</td><td>' +
    moment.unix(data.time).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss.SSS z") +
    '</td></tr><tr class="dataTables-child"><td>Query status:</td><td>' +
    queryStatus.fieldtext +
    cnameInfo +
    regexInfo +
    ttlInfo +
    dnssecInfo +
    dbInfo +
    replyInfo +
    "</td></tr></tbody></table>"
  );
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

  var APIstring = "/api/history/queries?";

  if ("from" in GETDict && "until" in GETDict) {
    APIstring += "&from=" + GETDict.from;
    APIstring += "&until=" + GETDict.until;
  } else if ("client" in GETDict) {
    APIstring += "&client=" + GETDict.client;
  } else if ("domain" in GETDict) {
    APIstring += "&domain=" + GETDict.domain;
  } else if ("querytype" in GETDict) {
    APIstring += "&querytype=" + GETDict.querytype;
  } else if ("forwarddest" in GETDict) {
    APIstring += "&forwarddest=" + GETDict.forwarddest;
  }
  // If we don't ask filtering and also not for all queries, just request the most recent 100 queries
  else if ("all" in GETDict) {
    APIstring += "n=-1";
  }

  if ("type" in GETDict) {
    APIstring += "&type=" + GETDict.type;
  }

  table = $("#all-queries").DataTable({
    ajax: {
      url: APIstring,
      error: handleAjaxError,
      dataSrc: "queries",
      data: function (d) {
        if (cursor !== null) d.cursor = cursor;
      },
      dataFilter: function (data) {
        var json = jQuery.parseJSON(data);
        cursor = json.recordsTotal; // Extract cursor from
        return data;
      }
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
        width: "20%",
        render: function (data, type) {
          if (type === "display") {
            return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        }
      },
      { data: "type", width: "5%" },
      { data: "domain", width: "40%" },
      { data: "client", width: "35%", type: "ip-address", render: $.fn.dataTable.render.text() }
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
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

      if (querystatus.colorClass !== false) {
        $(row).addClass(querystatus.colorClass);
      }

      // Substitute domain by "." if empty
      var domain = data.domain === 0 ? "." : data.domain;

      if (querystatus.isCNAME) {
        // Add domain in CNAME chain causing the query to have been blocked
        $("td:eq(2)", row).text(domain + "\n(blocked " + data.cname + ")");
      } else {
        $("td:eq(2)", row).text(domain);
      }
    }
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

  // function genSelect(which) {
  //   var arr = [],
  //     select = '<select><option value="">all</option>';
  //   if (which === "Type") arr = utils.typesList;
  //   else if (which === "Status") arr = utils.statusList;
  //   else if (which === "Reply") arr = utils.repliesList;
  //   for (var i = 0, l = arr.length; i < l; i++)
  //     select += '<option value="' + arr[i] + '">' + arr[i] + "</option>";
  //   select += "</select>";
  //   return select;
  // }
  //  // Add search fields
  //  $("#all-queries tfoot th").each(function () {
  //    var title = $(this).text();
  //    if (title === "Time" || title === "Action") $(this).html("");
  //    else if (title === "Type" /* || title === "Status" || title === "Reply" */)
  //      $(this).html(genSelect(title));
  //    else if (title === "Domain" || title === "Client")
  //      $(this).html('<input type="text" placeholder="Search ' + title + '" />');
  //    else $(this).html(""); // Clear field
  //  });
  //  var r = $("#all-queries tfoot tr");
  //  $("#all-queries thead").append(r);
  //  /* Apply the search for individual columns*/
  //  table.columns().every(function () {
  //    var that = this;
  //    $("input", this.header()).on("keydown", function (ev) {
  //      if (ev.keyCode === 13) {
  //        //only on enter keypress (code 13)
  //        that.search(this.value).draw();
  //      }
  //    });
  //  });
  $("#refresh").on("click", refreshTable);
});

function refreshTable() {
  cursor = null;
  table.clear();
  table.draw();
}
