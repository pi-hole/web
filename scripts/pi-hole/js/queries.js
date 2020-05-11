/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false */

var tableApi;

function add(domain, list) {
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

  var listtype;
  if (list === "white") {
    listtype = "Whitelist";
  } else {
    listtype = "Blacklist";
  }

  alProcessing.children(alDomain).html(domain);
  alProcessing.children(alList).html(listtype);
  alertModal.modal("show");

  // add Domain to List after Modal has faded in
  alertModal.one("shown.bs.modal", function() {
    $.ajax({
      url: "scripts/pi-hole/php/add.php",
      method: "post",
      data: { domain: domain, list: list, token: token },
      success: function(response) {
        alProcessing.hide();
        if (
          response.indexOf("not a valid argument") >= 0 ||
          response.indexOf("is not a valid domain") >= 0 ||
          response.indexOf("Wrong token") >= 0
        ) {
          // Failure
          alNetworkErr.hide();
          alCustomErr.html(response.replace("[✗]", ""));
          alFailure.fadeIn(1000);
          setTimeout(function() {
            alertModal.modal("hide");
          }, 3000);
        } else {
          // Success
          alSuccess.children(alDomain).html(domain);
          alSuccess.children(alList).html(listtype);
          alSuccess.fadeIn(1000);
          setTimeout(function() {
            alertModal.modal("hide");
          }, 2000);
        }
      },
      error: function() {
        // Network Error
        alProcessing.hide();
        alNetworkErr.show();
        alFailure.fadeIn(1000);
        setTimeout(function() {
          alertModal.modal("hide");
        }, 3000);
      }
    });
  });

  // Reset Modal after it has faded out
  alertModal.one("hidden.bs.modal", function() {
    alProcessing.show();
    alSuccess.add(alFailure).hide();
    alProcessing
      .add(alSuccess)
      .children(alDomain)
      .html("")
      .end()
      .children(alList)
      .html("");
    alCustomErr.html("");
  });
}

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") >= 0) {
    alert("An error occured while loading the data: Connection refused. Is FTL running?");
  } else {
    alert("An unknown error occured while loading the data.\n" + xhr.responseText);
  }

  $("#all-queries_processing").hide();
  tableApi.clear();
  tableApi.draw();
}

function autofilter() {
  return $("#autofilter").prop("checked");
}

$(document).ready(function() {
  // Do we want to filter queries?
  var GETDict = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function(item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

  var APIstring = "api.php?getAllQueries";

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
  else if (!("all" in GETDict)) {
    APIstring += "=100";
  }

  tableApi = $("#all-queries").DataTable({
    rowCallback: function(row, data) {
      // DNSSEC status
      var dnssec_status;
      switch (data[5]) {
        case "1":
          dnssec_status = '<br><span class="text-green">SECURE</span>';
          break;
        case "2":
          dnssec_status = '<br><span class="text-orange">INSECURE</span>';
          break;
        case "3":
          dnssec_status = '<br><span class="text-red">BOGUS</span>';
          break;
        case "4":
          dnssec_status = '<br><span class="text-red">ABANDONED</span>';
          break;
        case "5":
          dnssec_status = '<br><span class="text-orange">UNKNOWN</span>';
          break;
        default:
          // No DNSSEC
          dnssec_status = "";
      }

      // Query status
      var blocked,
        fieldtext,
        buttontext,
        colorClass,
        isCNAME = false,
        regexLink = false;

      switch (data[4]) {
        case "1":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked (gravity)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          break;
        case "2":
          blocked = false;
          colorClass = "text-green";
          fieldtext = "OK <br class='hidden-lg'>(forwarded)" + dnssec_status;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Blacklist</button>';
          break;
        case "3":
          blocked = false;
          colorClass = "text-green";
          fieldtext = "OK <br class='hidden-lg'>(cached)" + dnssec_status;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Blacklist</button>';
          break;
        case "4":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(regex blacklist)";

          if (data.length > 9 && data[9] > 0) {
            regexLink = true;
          }

          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          break;
        case "5":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(exact blacklist)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          break;
        case "6":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(external, IP)";
          buttontext = "";
          break;
        case "7":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(external, NULL)";
          buttontext = "";
          break;
        case "8":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(external, NXRA)";
          buttontext = "";
          break;
        case "9":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked (gravity, CNAME)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          isCNAME = true;
          break;
        case "10":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(regex blacklist, CNAME)";

          if (data.length > 9 && data[9] > 0) {
            regexLink = true;
          }

          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          isCNAME = true;
          break;
        case "11":
          blocked = true;
          colorClass = "text-red";
          fieldtext = "Blocked <br class='hidden-lg'>(exact blacklist, CNAME)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          isCNAME = true;
          break;
        default:
          blocked = false;
          colorClass = "text-black";
          fieldtext = "Unknown (" + parseInt(data[4]) + ")";
          buttontext = "";
      }

      $(row).addClass(colorClass);
      $("td:eq(4)", row).html(fieldtext);
      $("td:eq(6)", row).html(buttontext);

      if (regexLink) {
        $("td:eq(4)", row).hover(
          function() {
            this.title = "Click to show matching regex filter";
            this.style.color = "#72afd2";
          },
          function() {
            this.style.color = "";
          }
        );
        $("td:eq(4)", row).off(); // Release any possible previous onClick event handlers
        $("td:eq(4)", row).click(function() {
          var new_tab = window.open("groups-domains.php?domainid=" + data[9], "_blank");
          if (new_tab) {
            new_tab.focus();
          }
        });
        $("td:eq(4)", row).addClass("underline");
        $("td:eq(4)", row).addClass("pointer");
      }

      // Substitute domain by "." if empty
      var domain = data[2];
      if (domain.length === 0) {
        domain = ".";
      }

      if (isCNAME) {
        var CNAME_domain = data[8];
        // Add domain in CNAME chain causing the query to have been blocked
        $("td:eq(2)", row).text(domain + "\n(blocked " + CNAME_domain + ")");
      } else {
        $("td:eq(2)", row).text(domain);
      }

      // Check for existence of sixth column and display only if not Pi-holed
      var replytext;
      if (data.length > 6 && !blocked) {
        switch (data[6]) {
          case "0":
            replytext = "N/A";
            break;
          case "1":
            replytext = "NODATA";
            break;
          case "2":
            replytext = "NXDOMAIN";
            break;
          case "3":
            replytext = "CNAME";
            break;
          case "4":
            replytext = "IP";
            break;
          case "5":
            replytext = "DOMAIN";
            break;
          case "6":
            replytext = "RRNAME";
            break;
          case "7":
            replytext = "SERVFAIL";
            break;
          case "8":
            replytext = "REFUSED";
            break;
          case "9":
            replytext = "NOTIMP";
            break;
          case "10":
            replytext = "upstream error";
            break;
          default:
            replytext = "? (" + parseInt(data[6]) + ")";
        }
      } else {
        replytext = "-";
      }

      $("td:eq(5)", row).addClass("text-black");
      $("td:eq(5)", row).html(replytext);

      if (data.length > 7 && data[7] > 0) {
        var content = $("td:eq(5)", row).html();
        $("td:eq(5)", row).html(content + " (" + (0.1 * data[7]).toFixed(1) + "ms)");
      }
    },
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: {
      url: APIstring,
      error: handleAjaxError,
      dataSrc: function(data) {
        var dataIndex = 0;
        return data.data.map(function(x) {
          x[0] = x[0] * 1e6 + dataIndex++;
          return x;
        });
      }
    },
    autoWidth: false,
    processing: true,
    order: [[0, "desc"]],
    columns: [
      {
        width: "15%",
        render: function(data, type) {
          if (type === "display") {
            return moment
              .unix(Math.floor(data / 1e6))
              .format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        }
      },
      { width: "4%" },
      { width: "36%", render: $.fn.dataTable.render.text() },
      { width: "8%", render: $.fn.dataTable.render.text() },
      { width: "14%", orderData: 4 },
      { width: "8%", orderData: 6 },
      { width: "10%", orderData: 4 }
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("query_log_table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("query_log_table");
      // Return if not available
      if (data === null) {
        return null;
      }

      data = JSON.parse(data);
      // Always start on the first page to show most recent queries
      data.start = 0;
      // Always start with empty search field
      data.search.search = "";
      // Apply loaded state to table
      return data;
    },
    columnDefs: [
      {
        targets: -1,
        data: null,
        defaultContent: ""
      }
    ],
    initComplete: function() {
      var api = this.api();
      // Query type IPv4 / IPv6
      api.$("td:eq(1)").click(function() {
        if (autofilter()) {
          api.search(this.textContent).draw();
          $("#resetButton").show();
        }
      });
      api.$("td:eq(1)").hover(
        function() {
          if (autofilter()) {
            this.title = "Click to show only " + this.textContent + " queries";
            this.style.color = "#72afd2";
          } else {
            this.title = "";
            this.style.color = "";
          }
        },
        function() {
          this.style.color = "";
        }
      );
      api.$("td:eq(1)").css("cursor", "pointer");
      // Domain
      api.$("td:eq(2)").click(function() {
        if (autofilter()) {
          var domain = this.textContent.split("\n")[0];
          api.search(domain).draw();
          $("#resetButton").show();
        }
      });
      api.$("td:eq(2)").hover(
        function() {
          if (autofilter()) {
            var domain = this.textContent.split("\n")[0];
            this.title = "Click to show only queries with domain " + domain;
            this.style.color = "#72afd2";
          } else {
            this.title = "";
            this.style.color = "";
          }
        },
        function() {
          this.style.color = "";
        }
      );
      api.$("td:eq(2)").css("cursor", "pointer");
      // Client
      api.$("td:eq(3)").click(function() {
        if (autofilter()) {
          api.search(this.textContent).draw();
          $("#resetButton").show();
        }
      });
      api.$("td:eq(3)").hover(
        function() {
          if (autofilter()) {
            this.title = "Click to show only queries made by " + this.textContent;
            this.style.color = "#72afd2";
          } else {
            this.title = "";
            this.style.color = "";
          }
        },
        function() {
          this.style.color = "";
        }
      );
      api.$("td:eq(3)").css("cursor", "pointer");
    }
  });

  $("#all-queries tbody").on("click", "button", function() {
    var data = tableApi.row($(this).parents("tr")).data();
    if (data[4] === "2" || data[4] === "3") {
      add(data[2], "black");
    } else {
      add(data[2], "white");
    }
  });

  $("#resetButton").click(function() {
    tableApi.search("").draw();
    $("#resetButton").hide();
  });

  var chkbox_data = localStorage.getItem("query_log_filter_chkbox");
  if (chkbox_data !== null) {
    // Restore checkbox state
    $("#autofilter").prop("checked", chkbox_data === "true");
  } else {
    // Initialize checkbox
    $("#autofilter").prop("checked", true);
    localStorage.setItem("query_log_filter_chkbox", true);
  }

  $("#autofilter").click(function() {
    localStorage.setItem("query_log_filter_chkbox", $("#autofilter").prop("checked"));
  });
});
