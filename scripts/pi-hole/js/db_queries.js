/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false, utils:false */

var start__ = moment().subtract(7, "days");
var from = moment(start__).utc().valueOf() / 1000;
var end__ = moment();
var until = moment(end__).utc().valueOf() / 1000;
var instantquery = false;
var daterange;

var timeoutWarning = $("#timeoutWarning");
var reloadBox = $(".reload-box");
var datepickerManuallySelected = false;

var dateformat = "MMMM Do YYYY, HH:mm";

var replyTypes = [
  "N/A",
  "NODATA",
  "NXDOMAIN",
  "CNAME",
  "IP",
  "DOMAIN",
  "RRNAME",
  "SERVFAIL",
  "REFUSED",
  "NOTIMP",
  "upstream error",
  "DNSSEC",
  "NONE",
  "BLOB",
];

// Do we want to filter queries?
var GETDict = {};
window.location.search
  .substr(1)
  .split("&")
  .forEach(function (item) {
    GETDict[item.split("=")[0]] = item.split("=")[1];
  });

if ("from" in GETDict && "until" in GETDict) {
  from = parseInt(GETDict.from, 10);
  until = parseInt(GETDict.until, 10);
  start__ = moment(1000 * from);
  end__ = moment(1000 * until);
  instantquery = true;
}

$(function () {
  daterange = $("#querytime").daterangepicker(
    {
      timePicker: true,
      timePickerIncrement: 15,
      timePicker24Hour: true,
      locale: { format: dateformat },
      startDate: start__,
      endDate: end__,
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [moment().subtract(7, "days"), moment()],
        "Last 30 Days": [moment().subtract(30, "days"), moment()],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        "This Year": [moment().startOf("year"), moment()],
        "All Time": [moment(0), moment()],
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: false,
    },
    function (startt, endt) {
      from = moment(startt).utc().valueOf() / 1000;
      until = moment(endt).utc().valueOf() / 1000;
    }
  );
});

var tableApi, statistics;

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") !== -1) {
    alert("An error occurred while loading the data: Connection refused. Is FTL running?");
  } else {
    alert(
      "An unknown error occurred while loading the data.\n" +
        xhr.responseText +
        "\nCheck the server's log files (/var/log/lighttpd/error-pihole.log) for details.\n\nYou may need to increase PHP memory limit." +
        "\n\nYou can find more info in pi-hole's FAQ:\nhttps://docs.pi-hole.net/main/faq/#error-while-loading-data-from-the-long-term-database"
    );
  }

  $("#all-queries_processing").hide();
  tableApi.clear();
  tableApi.draw();
}

function getQueryTypes() {
  var queryType = [];
  if ($("#type_gravity").prop("checked")) {
    queryType.push(1);
  }

  if ($("#type_forwarded").prop("checked")) {
    queryType.push([2, 14]);
  }

  if ($("#type_cached").prop("checked")) {
    queryType.push(3);
  }

  if ($("#type_regex").prop("checked")) {
    queryType.push(4);
  }

  if ($("#type_blacklist").prop("checked")) {
    queryType.push(5);
  }

  if ($("#type_external").prop("checked")) {
    // Multiple IDs correspond to this status
    // We request queries with all of them
    queryType.push([6, 7, 8]);
  }

  if ($("#type_gravity_CNAME").prop("checked")) {
    queryType.push(9);
  }

  if ($("#type_regex_CNAME").prop("checked")) {
    queryType.push(10);
  }

  if ($("#type_blacklist_CNAME").prop("checked")) {
    queryType.push(11);
  }

  if ($("#type_retried").prop("checked")) {
    // Multiple IDs correspond to this status
    // We request queries with all of them
    queryType.push([12, 13]);
  }

  // 14 is defined above

  if ($("#type_dbbusy").prop("checked")) {
    queryType.push(15);
  }

  if ($("#type_special_domain").prop("checked")) {
    queryType.push(16);
  }

  return queryType.join(",");
}

var reloadCallback = function () {
  timeoutWarning.hide();
  statistics = [0, 0, 0, 0];
  var data = tableApi.rows().data();
  for (var i = 0; i < data.length; i++) {
    statistics[0]++; // TOTAL query
    if (data[i][4] === 1 || (data[i][4] > 4 && ![10, 12, 13, 14].includes(data[i][4]))) {
      statistics[2]++; // EXACT blocked
    } else if (data[i][4] === 3) {
      statistics[1]++; // CACHE query
    } else if (data[i][4] === 4 || data[i][4] === 10) {
      statistics[3]++; // REGEX blocked
    }
  }

  var formatter = new Intl.NumberFormat();
  $("h3#dns_queries").text(formatter.format(statistics[0]));
  $("h3#queries_blocked_exact").text(formatter.format(statistics[2]));
  $("h3#queries_wildcard_blocked").text(formatter.format(statistics[3]));

  var percent = 0;
  if (statistics[2] + statistics[3] > 0) {
    percent = (100 * (statistics[2] + statistics[3])) / statistics[0];
  }

  var percentage = formatter.format(Math.round(percent * 10) / 10);
  $("h3#queries_percentage_today").text(percentage + " %");
};

function refreshTableData() {
  timeoutWarning.show();
  reloadBox.hide();
  var APIstring = "api_db.php?getAllQueries&from=" + from + "&until=" + until;
  // Check if query type filtering is enabled
  var queryType = getQueryTypes();
  if (queryType !== "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16") {
    APIstring += "&types=" + queryType;
  }

  statistics = [0, 0, 0];
  tableApi.ajax.url(APIstring).load(reloadCallback);
}

$(function () {
  var APIstring = instantquery
    ? "api_db.php?getAllQueries&from=" + from + "&until=" + until
    : "api_db.php?getAllQueries=empty";

  // Check if query type filtering is enabled
  var queryType = getQueryTypes();
  if (queryType !== 63) {
    // 63 (0b00111111) = all possible query types are selected
    APIstring += "&types=" + queryType;
  }

  tableApi = $("#all-queries").DataTable({
    rowCallback: function (row, data) {
      var replyid = parseInt(data[6], 10);
      var dnssecStatus;
      switch (data[8]) {
        case 1:
          dnssecStatus = '<br><span class="text-green">SECURE';
          break;
        case 2:
          dnssecStatus = '<br><span class="text-orange">INSECURE';
          break;
        case 3:
          dnssecStatus = '<br><span class="text-red">BOGUS';
          break;
        case 4:
          dnssecStatus = '<br><span class="text-red">ABANDONED';
          break;
        case 5:
          dnssecStatus = '<br><span class="text-orange">UNKNOWN';
          break;
        default:
          // No DNSSEC
          dnssecStatus = "";
      }

      if (dnssecStatus.length > 0) {
        if (replyid === 7) dnssecStatus += " (refused upstream)";
        dnssecStatus += "</span>";
      }

      var fieldtext,
        buttontext = "",
        blocked = false;
      switch (data[4]) {
        case 1:
          fieldtext = "<span class='text-red'>Blocked (gravity)</span>";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 2:
          fieldtext =
            replyid === 0
              ? "<span class='text-green'>OK</span> (sent to <br class='hidden-lg'>"
              : "<span class='text-green'>OK</span> (answered by <br class='hidden-lg'>";
          fieldtext += (data.length > 5 && data[5] !== "N/A" ? data[5] : "") + ")" + dnssecStatus;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Blacklist</button>';
          break;
        case 3:
          fieldtext =
            "<span class='text-green'>OK</span> <br class='hidden-lg'>(cache)" + dnssecStatus;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Blacklist</button>';
          break;
        case 4:
          fieldtext = "<span class='text-red'>Blocked <br class='hidden-lg'>(regex blacklist)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 5:
          fieldtext = "<span class='text-red'>Blocked <br class='hidden-lg'>(exact blacklist)";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 6:
          fieldtext = "<span class='text-red'>Blocked <br class='hidden-lg'>(external, IP)";
          blocked = true;
          break;
        case 7:
          fieldtext =
            "<span class='text-red'>Blocked <br class='hidden-lg'>(external, NULL)</span>";
          blocked = true;
          break;
        case 8:
          fieldtext =
            "<span class='text-red'>Blocked <br class='hidden-lg'>(external, NXRA)</span>";
          blocked = true;
          break;
        case 9:
          fieldtext =
            "<span class='text-red'>Blocked <br class='hidden-lg'>(gravity, CNAME)</span>";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 10:
          fieldtext =
            "<span class='text-red'>Blocked <br class='hidden-lg'>(regex blacklist, CNAME)</span>";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 11:
          fieldtext =
            "<span class='text-red'>Blocked <br class='hidden-lg'>(exact blacklist, CNAME)</span>";
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-green"><i class="fas fa-check"></i> Whitelist</button>';
          blocked = true;
          break;
        case 12:
          fieldtext = "<span class='text-green'>Retried</span>";
          break;
        case 13:
          fieldtext = "<span class='text-green'>Retried</span> <br class='hidden-lg'>(ignored)";
          break;
        case 14:
          fieldtext =
            "<span class='text-green'>OK</span> <br class='hidden-lg'>(already forwarded)" +
            dnssecStatus;
          buttontext =
            '<button type="button" class="btn btn-default btn-sm text-red"><i class="fa fa-ban"></i> Blacklist</button>';
          break;
        case 15:
          fieldtext =
            "<span class='text-orange'>Blocked <br class='hidden-lg'>(database is busy)</span>";
          blocked = true;
          break;
        case 16:
          fieldtext =
            "<span class='text-orange'>Blocked <br class='hidden-lg'>(special domain)</span>";
          blocked = true;
          break;
        default:
          fieldtext = "Unknown (" + parseInt(data[4], 10) + ")";
      }

      // Cannot block internal queries of this type
      if ((data[1] === "DNSKEY" || data[1] === "DS") && data[3] === "pi.hole") buttontext = "";

      $(row).addClass(blocked === true ? "blocked-row" : "allowed-row");
      if (localStorage && localStorage.getItem("colorfulQueryLog_chkbox") === "true") {
        $(row).addClass(blocked === true ? "text-red" : "text-green");
      }

      // Check for existence of sixth column and display only if not Pi-holed
      var replytext =
        replyid >= 0 && replyid < replyTypes.length ? replyTypes[replyid] : "? (" + replyid + ")";

      replytext += '<input type="hidden" name="id" value="' + replyid + '">';

      $("td:eq(4)", row).html(fieldtext);
      $("td:eq(5)", row).html(replytext);
      $("td:eq(6)", row).html(buttontext);

      // Show response time only when reply is not N/A
      if (data.length > 7 && replyid !== 0) {
        $("td:eq(5)", row).append(" (" + (1000 * data[7]).toFixed(1) + "ms)");
      }

      // Substitute domain by "." if empty
      // This was introduced by https://github.com/pi-hole/AdminLTE/pull/1244 but is considered obsolete since
      // https://github.com/pi-hole/FTL/pull/1413. However, we keep the conversion here to keep user's
      // statistic accurat when they import older data with empty domain fields
      var domain = data[2];
      if (domain.length === 0) {
        domain = ".";
      }

      $("td:eq(2)", row).text(domain);
    },
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: {
      url: APIstring,
      error: handleAjaxError,
      dataSrc: function (data) {
        var dataIndex = 0;
        return data.data.map(function (x) {
          x[0] = x[0] * 1e6 + dataIndex++;
          return x;
        });
      },
    },
    autoWidth: false,
    processing: true,
    deferRender: true,
    order: [[0, "desc"]],
    columns: [
      {
        width: "12%",
        render: function (data, type) {
          if (type === "display") {
            return moment
              .unix(Math.floor(data / 1e6))
              .format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        },
      },
      { width: "9%" },
      { width: "36%" },
      { width: "10%", type: "ip-address" },
      { width: "15%" },
      { width: "9%" },
      { width: "9%" },
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    columnDefs: [
      {
        targets: -1,
        data: null,
        defaultContent: "",
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    initComplete: reloadCallback,
  });
  $("#all-queries tbody").on("click", "button", function () {
    var data = tableApi.row($(this).parents("tr")).data();
    if ([1, 4, 5, 9, 10, 11].indexOf(data[4]) !== -1) {
      utils.addFromQueryLog(data[2], "white");
    } else {
      utils.addFromQueryLog(data[2], "black");
    }
  });

  if (instantquery) {
    daterange.val(start__.format(dateformat) + " - " + end__.format(dateformat));
  }
});

$("#querytime").on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format(dateformat) + " to " + picker.endDate.format(dateformat));
  datepickerManuallySelected = true;
  refreshTableData();
});

$("input[id^=type]").change(function () {
  if (datepickerManuallySelected) {
    reloadBox.show();
  }
});

$(".bt-reload").click(function () {
  refreshTableData();
});
