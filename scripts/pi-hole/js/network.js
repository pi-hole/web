/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global moment:false */

var tableApi;

var APIstring = "api_db.php?network";

// How many IPs do we show at most per device?
var MAXIPDISPLAY = 3;

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") >= 0) {
    alert("An error occured while loading the data: Connection refused. Is FTL running?");
  } else {
    alert("An unknown error occured while loading the data.\n" + xhr.responseText);
  }

  $("#network-entries_processing").hide();
  tableApi.clear();
  tableApi.draw();
}

function getTimestamp() {
  if (!Date.now) {
    Date.now = function() {
      return new Date().getTime();
    };
  }

  return Math.floor(Date.now() / 1000);
}

function valueToHex(c) {
  var hex = Math.round(c).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(values) {
  return "#" + valueToHex(values[0]) + valueToHex(values[1]) + valueToHex(values[2]);
}

function mixColors(ratio, rgb1, rgb2) {
  return [
    (1.0 - ratio) * rgb1[0] + ratio * rgb2[0],
    (1.0 - ratio) * rgb1[1] + ratio * rgb2[1],
    (1.0 - ratio) * rgb1[2] + ratio * rgb2[2]
  ];
}

$(document).ready(function() {
  tableApi = $("#network-entries").DataTable({
    rowCallback: function(row, data) {
      var color,
        mark,
        lastQuery = parseInt(data.lastQuery);
      if (lastQuery > 0) {
        var diff = getTimestamp() - lastQuery;
        if (diff <= 86400) {
          // Last query came in within the last 24 hours (24*60*60 = 86400)
          // Color: light-green to light-yellow
          var ratio = Number(diff) / 86400;
          var lightgreen = [0xe7, 0xff, 0xde];
          var lightyellow = [0xff, 0xff, 0xdf];
          color = rgbToHex(mixColors(ratio, lightgreen, lightyellow));
          mark = "&#x2714;";
        } else {
          // Last query was longer than 24 hours ago
          // Color: light-orange
          color = "#ffedd9";
          mark = "<strong>?</strong>";
        }
      } else {
        // This client has never sent a query to Pi-hole, color light-red
        color = "#ffbfaa";
        mark = "&#x2718;";
      }

      // Set determined background color
      $(row).css("background-color", color);
      $("td:eq(7)", row).html(mark);

      // Insert "Never" into Last Query field when we have
      // never seen a query from this device
      if (data.lastQuery === 0) {
        $("td:eq(5)", row).html("Never");
      }

      // Set hostname to "unknown" if not available
      if (!data.name || data.name.length === 0) {
        $("td:eq(3)", row).html("<em>unknown</em>");
      }

      // Set number of queries to localized string (add thousand separators)
      $("td:eq(6)", row).html(data.numQueries.toLocaleString());

      var ips = [];
      var maxiter = Math.min(data.ip.length, MAXIPDISPLAY);
      for (var index = 0; index < maxiter; index++) {
        var ip = data.ip[index];
        ips.push('<a href="queries.php?client=' + ip + '">' + ip + "</a>");
      }

      if (data.ip.length > MAXIPDISPLAY) {
        // We hit the maximum above, add "..." to symbolize we would
        // have more to show here
        ips.push("...");
      }

      $("td:eq(0)", row).html(ips.join("<br>"));
      $("td:eq(0)", row).hover(function() {
        this.title = data.ip.join("\n");
      });

      // MAC + Vendor field if available
      if (data.macVendor && data.macVendor.length > 0) {
        $("td:eq(1)", row).html(data.hwaddr + "<br/>" + data.macVendor);
      }

      // Hide mock MAC addresses
      if (data.hwaddr.startsWith("ip-")) {
        $("td:eq(1)", row).text("N/A");
      }
    },
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: { url: APIstring, error: handleAjaxError, dataSrc: "network" },
    autoWidth: false,
    processing: true,
    order: [[5, "desc"]],
    columns: [
      { data: "ip", type: "ip-address", width: "10%", render: $.fn.dataTable.render.text() },
      { data: "hwaddr", width: "10%", render: $.fn.dataTable.render.text() },
      { data: "interface", width: "4%", render: $.fn.dataTable.render.text() },
      { data: "name", width: "15%", render: $.fn.dataTable.render.text() },
      {
        data: "firstSeen",
        width: "8%",
        render: function(data, type) {
          if (type === "display") {
            return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        }
      },
      {
        data: "lastQuery",
        width: "8%",
        render: function(data, type) {
          if (type === "display") {
            return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");
          }

          return data;
        }
      },
      { data: "numQueries", width: "9%", render: $.fn.dataTable.render.text() },
      { data: "", width: "6%", orderable: false }
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("network_table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("network_table");
      // Return if not available
      if (data === null) {
        return null;
      }

      data = JSON.parse(data);
      // Always start on the first page
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
    ]
  });
});
