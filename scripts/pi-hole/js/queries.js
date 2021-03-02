/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false, utils:false */

var tableApi;
var cursor = null;
var tableFilters = [];
var colTypes = ["time", "query type", "domain", "client", "status", "reply type"];

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") !== -1) {
    alert("An error occured while loading the data: Connection refused. Is FTL running?");
  } else {
    alert("An unknown error occured while loading the data.\n" + xhr.responseText);
  }

  $("#all-queries_processing").hide();
  tableApi.clear();
  tableApi.draw();
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

  tableApi = $("#all-queries").DataTable({
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
      //      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    autoWidth: false,
    processing: false,
    order: [[0, "desc"]],
    columns: [
      {
        data: "time",
        width: "15%",
        render: function (data, type) {
          if (type === "display") {
            return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        }
      },
      { data: "type", width: "4%" },
      { data: "domain", width: "30%", render: $.fn.dataTable.render.text() },
      { data: "client", width: "14%", type: "ip-address", render: $.fn.dataTable.render.text() },
      { data: "status", width: "14%" },
      { data: "reply", width: "8%" },
      { data: null, width: "10%" }
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
      // DNSSEC status
      var dnssecStatus;
      switch (data.dnssec) {
        case "SECURE":
          dnssecStatus = '<br><span class="text-green">SECURE</span>';
          break;
        case "INSECURE":
          dnssecStatus = '<br><span class="text-orange">INSECURE</span>';
          break;
        case "BOGUS":
          dnssecStatus = '<br><span class="text-red">BOGUS</span>';
          break;
        case "ABANDONED":
          dnssecStatus = '<br><span class="text-red">ABANDONED</span>';
          break;
        case "UNKNOWN":
          dnssecStatus = '<br><span class="text-orange">UNKNOWN</span>';
          break;
        default:
          // No DNSSEC
          dnssecStatus = "";
      }

      // Query status
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
          fieldtext = "Forwarded to<br>" + data.upstream + dnssecStatus;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Deny</button>';
          break;
        case "CACHE":
          colorClass = "text-green";
          fieldtext = "Cached" + dnssecStatus;
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

      fieldtext += '<input type="hidden" name="id" value="' + data.status + '">';

      if (colorClass !== false) {
        $(row).addClass(colorClass);
      }

      $("td:eq(4)", row).html(fieldtext);
      $("td:eq(6)", row).html(buttontext);

      if (regexLink) {
        $("td:eq(4)", row).hover(
          function () {
            this.title = "Click to show matching regex filter";
            this.style.color = "#72afd2";
          },
          function () {
            this.style.color = "";
          }
        );
        $("td:eq(4)", row).off(); // Release any possible previous onClick event handlers
        $("td:eq(4)", row).click(function () {
          var newTab = window.open("groups-domains.php?domainid=" + data.regex, "_blank");
          if (newTab) {
            newTab.focus();
          }
        });
        $("td:eq(4)", row).addClass("text-underline pointer");
      }

      // Substitute domain by "." if empty
      var domain = data.domain === 0 ? "." : data.domain;

      if (isCNAME) {
        // Add domain in CNAME chain causing the query to have been blocked
        $("td:eq(2)", row).text(domain + "\n(blocked " + data.cname + ")");
      } else {
        $("td:eq(2)", row).text(domain);
      }

      // Check for existence of sixth column and display only if not Pi-holed
      var replytext =
        data.reply.type + '<input type="hidden" name="id" value="' + data.reply.type + '">';

      if (data.reply.time >= 0) {
        replytext += " (" + data.reply.time.toFixed(1) + "ms)";
      }

      $("td:eq(5)", row).html(replytext);
    },
    initComplete: function () {
      var api = this.api();

      // Query type IPv4 / IPv6
      api
        .$("td:eq(1)")
        .click(function (event) {
          addColumnFilter(event, 1, this.textContent);
        })
        .hover(
          function () {
            $(this).addClass("pointer").attr("title", tooltipText(1, this.textContent));
          },
          function () {
            $(this).removeClass("pointer");
          }
        );

      // Domain
      api
        .$("td:eq(2)")
        .click(function (event) {
          addColumnFilter(event, 2, this.textContent.split("\n")[0]);
        })
        .hover(
          function () {
            $(this).addClass("pointer").attr("title", tooltipText(2, this.textContent));
          },
          function () {
            $(this).removeClass("pointer");
          }
        );

      // Client
      api
        .$("td:eq(3)")
        .click(function (event) {
          addColumnFilter(event, 3, this.textContent);
        })
        .hover(
          function () {
            $(this).addClass("pointer").attr("title", tooltipText(3, this.textContent));
          },
          function () {
            $(this).removeClass("pointer");
          }
        );

      // Status
      api
        .$("td:eq(4)")
        .click(function (event) {
          var id = this.children.id.value;
          var text = this.textContent;
          addColumnFilter(event, 4, id + "#" + text);
        })
        .hover(
          function () {
            $(this).addClass("pointer").attr("title", tooltipText(4, this.textContent));
          },
          function () {
            $(this).removeClass("pointer");
          }
        );

      // Reply type
      api
        .$("td:eq(5)")
        .click(function (event) {
          var id = this.children.id.value;
          var text = this.textContent.split(" ")[0];
          addColumnFilter(event, 5, id + "#" + text);
        })
        .hover(
          function () {
            $(this).addClass("pointer").attr("title", tooltipText(5, this.textContent));
          },
          function () {
            $(this).removeClass("pointer");
          }
        );

      // Disable autocorrect in the search box
      var input = $("input[type=search]");
      if (input !== null) {
        input.attr("autocomplete", "off");
        input.attr("autocorrect", "off");
        input.attr("autocapitalize", "off");
        input.attr("spellcheck", false);
        input.attr("placeholder", "Type / Domain / Client");
      }
    }
  });

  resetColumnsFilters();

  $("#all-queries tbody").on("click", "button", function () {
    var tr = $(this).parents("tr");
    var permitted = tr[0].classList.contains("text-green");
    var blocked = tr[0].classList.contains("text-red");
    var data = tableApi.row(tr).data();
    if (permitted) {
      utils.addFromQueryLog(data.domain, "deny");
    } else if (blocked) {
      utils.addFromQueryLog(data.domain, "allow");
    }
  });

  $("#resetButton").click(function () {
    tableApi.search("");
    resetColumnsFilters();
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
  //  tableApi.columns().every(function () {
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
  tableApi.clear();
  tableApi.draw();
}

function tooltipText(index, text) {
  if (index === 5) {
    // Strip reply time from tooltip text
    text = text.split(" ")[0];
  }

  if (index in tableFilters && tableFilters[index].length > 0) {
    return "Click to remove " + colTypes[index] + ' "' + text + '" from filter.';
  }

  return "Click to add " + colTypes[index] + ' "' + text + '" to filter.';
}

function addColumnFilter(event, colID, filterstring) {
  // If the below modifier keys are held down, do nothing
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (tableFilters[colID] === filterstring) {
    filterstring = "";
  }

  tableFilters[colID] = filterstring;

  applyColumnFiltering();
}

function resetColumnsFilters() {
  tableFilters.forEach(function (value, index) {
    tableFilters[index] = "";
  });

  // Clear filter reset button
  applyColumnFiltering();
}

function applyColumnFiltering() {
  var showReset = false;
  tableFilters.forEach(function (value, index) {
    // Prepare regex filter string
    var regex = "";

    // Split filter string if we received a combined ID#Name column
    var valArr = value.split("#");
    if (valArr.length > 0) {
      value = valArr[0];
    }

    if (value.length > 0) {
      // Exact matching
      regex = "^" + value + "$";

      // Add background color
      tableApi.$("td:eq(" + index + ")").addClass("highlight");

      // Remember to show reset button
      showReset = true;
    } else {
      // Clear background color
      tableApi.$("td:eq(" + index + ")").removeClass("highlight");
    }

    // Apply filtering on this column (regex may be empty -> no filtering)
    tableApi.column(index).search(regex, true, true);
  });

  if (showReset) {
    $("#resetButton").removeClass("hidden");
  } else {
    $("#resetButton").addClass("hidden");
  }

  // Trigger table update
  tableApi.draw();
}
