/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global utils:false, apiFailure:false */

var tableApi;

// How many IPs do we show at most per device?
const MAXIPDISPLAY = 3;
const DAY_IN_SECONDS = 24 * 60 * 60;

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (xhr.responseText.indexOf("Connection refused") === -1) {
    alert("An unknown error occurred while loading the data.\n" + xhr.responseText);
  } else {
    alert("An error occurred while loading the data: Connection refused. Is FTL running?");
  }

  $("#network-entries_processing").hide();
  tableApi.clear();
  tableApi.draw();
}

function getTimestamp() {
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
    (1 - ratio) * rgb1[0] + ratio * rgb2[0],
    (1 - ratio) * rgb1[1] + ratio * rgb2[1],
    (1 - ratio) * rgb1[2] + ratio * rgb2[2],
  ];
}

function parseColor(input) {
  var match = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

  if (match) {
    return [match[1], match[2], match[3]];
  }
}

function deleteNetworkEntry() {
  const tr = $(this).closest("tr");
  const id = tr.attr("data-id");
  const hwaddr = tr.attr("data-hwaddr");

  utils.disableAll();
  utils.showAlert("info", "", "Deleting network table entry...");
  $.ajax({
    url: "/api/network/devices/" + id,
    method: "DELETE",
    success: function () {
      utils.enableAll();
      utils.showAlert(
        "success",
        "far fa-trash-alt",
        "Successfully deleted network table entry",
        hwaddr
      );
      tableApi.row(tr).remove().draw(false).ajax.reload(null, false);
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting network table entry with ID " + id,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

$(function () {
  tableApi = $("#network-entries").DataTable({
    rowCallback: function (row, data) {
      var color;
      var index;
      var maxiter;
      var iconClasses;
      var lastQuery = parseInt(data.lastQuery, 10);
      var diff = getTimestamp() - lastQuery;
      var networkRecent = $(".network-recent").css("background-color");
      var networkOld = $(".network-old").css("background-color");
      var networkOlder = $(".network-older").css("background-color");
      var networkNever = $(".network-never").css("background-color");

      if (lastQuery > 0) {
        if (diff <= DAY_IN_SECONDS) {
          // Last query came in within the last 24 hours
          // Color: light-green to light-yellow
          var ratio = Number(diff) / DAY_IN_SECONDS;
          color = rgbToHex(mixColors(ratio, parseColor(networkRecent), parseColor(networkOld)));
          iconClasses = "fas fa-check";
        } else {
          // Last query was longer than 24 hours ago
          // Color: light-orange
          color = networkOlder;
          iconClasses = "fas fa-question";
        }
      } else {
        // This client has never sent a query to Pi-hole, color light-red
        color = networkNever;
        iconClasses = "fas fa-times";
      }

      // Set determined background color
      $(row).css("background-color", color);
      $("td:eq(6)", row).html('<i class="' + iconClasses + '"></i>');

      // Insert "Never" into Last Query field when we have
      // never seen a query from this device
      if (data.lastQuery === 0) {
        $("td:eq(4)", row).html("Never");
      }

      // Set number of queries to localized string (add thousand separators)
      $("td:eq(5)", row).html(data.numQueries.toLocaleString());

      var ips = [];
      maxiter = Math.min(data.ips.length, MAXIPDISPLAY);
      for (index = 0; index < maxiter; index++) {
        var ip = data.ips[index];
        if (ip.name !== null && ip.name.length > 0)
          ips.push(
            '<a href="queries.lp?client_ip=' + ip.ip + '">' + ip.ip + " (" + ip.name + ")</a>"
          );
        else ips.push('<a href="queries.lp?client_ip=' + ip.ip + '">' + ip.ip + "</a>");
      }

      if (data.ips.length > MAXIPDISPLAY) {
        // We hit the maximum above, add "..." to symbolize we would
        // have more to show here
        ips.push("...");
      }

      $("td:eq(0)", row).html(ips.join("<br>"));
      $("td:eq(0)", row).on("hover", function () {
        this.title = data.ips.join("\n");
      });

      // MAC + Vendor field if available
      if (data.macVendor && data.macVendor.length > 0) {
        $("td:eq(1)", row).html(
          utils.escapeHtml(data.hwaddr) + "<br/>" + utils.escapeHtml(data.macVendor)
        );
      }

      // Make mock MAC addresses italics and add title
      if (data.hwaddr.startsWith("ip-")) {
        $("td:eq(1)", row).css("font-style", "italic");
        $("td:eq(1)", row).attr("title", "Mock MAC address");
      }

      // Add delete button
      $(row).attr("data-id", data.id);
      $(row).attr("data-hwaddr", data.hwaddr);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteNetworkEntry_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(7)", row).html(button);
    },
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: {
      url: "/api/network/devices",
      type: "GET",
      dataType: "json",
      data: {
        max_devices: 999,
        max_addresses: 25,
      },
      error: handleAjaxError,
      dataSrc: "devices",
    },
    autoWidth: false,
    processing: true,
    order: [[6, "desc"]],
    columns: [
      { data: "id", visible: false },
      { data: "ips[].ip", type: "ip-address", width: "25%" },
      { data: "hwaddr", width: "10%" },
      { data: "interface", width: "4%" },
      {
        data: "firstSeen",
        width: "8%",
        render: function (data, type) {
          if (type === "display") {
            return utils.datetime(data);
          }

          return data;
        },
      },
      {
        data: "lastQuery",
        width: "8%",
        render: function (data, type) {
          if (type === "display") {
            return utils.datetime(data);
          }

          return data;
        },
      },
      { data: "numQueries", width: "9%", render: $.fn.dataTable.render.text() },
      { data: "", width: "6%", orderable: false },
      { data: "", width: "6%", orderable: false },
    ],

    drawCallback: function () {
      $('button[id^="deleteNetworkEntry_"]').on("click", deleteNetworkEntry);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("network_table", data);
    },
    stateLoadCallback: function () {
      return utils.stateLoadCallback("network_table");
    },
    columnDefs: [
      {
        targets: [-1, -2],
        data: null,
        defaultContent: "",
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
  });
  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
});
