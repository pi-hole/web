/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Precord see LICENSE file for your rights under this license. */

/* global utils: false */

var dnsRecordsTable = null;
var customCNAMETable = null;

$(function () {
  dnsRecordsTable = $("#dnsRecordsTable").DataTable({
    ajax: {
      url: "/api/config/dns/hosts",
      type: "GET",
      dataSrc: "config.dns.hosts",
    },
    order: [[0, "asc"]],
    columns: [
      { data: null },
      { data: null, type: "ip-address" },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteRecord"]').on("click", deleteRecord);

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.ip);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteRecord' +
        data.ip +
        '" data-del-ip="' +
        data.ip +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(2)", row).html(button);
      // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
      var ip = data.substring(0, data.indexOf(" "));
      // The name can be mulitple domains separated by spaces
      var name = data.substring(data.indexOf(" ") + 1);
      $("td:eq(0)", row).text(name);
      $("td:eq(1)", row).text(ip);
    },
    dom:
      "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No local DNS records defined.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("dns-records-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("dns-records-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });

  dnsRecordsTable = $("#customCNAMETable").DataTable({
    ajax: {
      url: "/api/config/dns/cnameRecords",
      type: "GET",
      dataSrc: "config.dns.cnameRecords",
    },
    order: [[0, "asc"]],
    columns: [
      { data: null },
      { data: null },
      { data: null },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteCNAME"]').on("click", delCNAMERecord);

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.ip);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteCNAME' +
        data.ip +
        '" data-del-ip="' +
        data.ip +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(3)", row).html(button);
      // Split record in format <cname>,<target>[,<TTL>]
      var splitted = data.split(",");
      $("td:eq(0)", row).text(splitted[0]);
      $("td:eq(1)", row).text(splitted[1]);
      if (splitted.length > 2) $("td:eq(2)", row).text(splitted[2]);
      else $("td:eq(2)", row).text("-");
    },
    dom:
      "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No local CNAME records defined.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("dns-cname-records-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("dns-cname-records-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
});

function deleteRecord() {
  // Passes the button data-del-id attribute as IP
  var ips = [$(this).attr("data-del-ip")];

  // Check input validity
  if (!Array.isArray(ips)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (var ip in ips) {
    if (Object.hasOwnProperty.call(ips, ip)) {
      delRecord(ips);
    }
  }
}

function delRecord(ip) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting DNS record...");

  $.ajax({
    url: "/api/dns/records/" + ip /* TODO */,
    method: "DELETE",
  })
    .done(function (response) {
      utils.enableAll();
      if (response === undefined) {
        utils.showAlert("success", "far fa-trash-alt", "Successfully deleted DNS record", "");
        dnsRecordsTable.ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while deleting DNS record: " + ip, response.record);
      }
    })
    .fail(function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting DNS record: " + ip, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    });
}

function delCNAMERecord(ip) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting local CNAME record...");

  $.ajax({
    url: "/api/CNAME/records/" + ip /* TODO */,
    method: "DELETE",
  })
    .done(function (response) {
      utils.enableAll();
      if (response === undefined) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted local CNAME record",
          ""
        );
        customCNAMETable.ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting local CNAME record: " + ip,
          response.record
        );
      }
    })
    .fail(function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting local CNAME record: " + ip,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

$(document).ready(function () {
  $("#btnAdd-host").on("click", function () {
    const elem = $("#Hip").val() + " " + $("#Hdomain").val();
    const path = "/api/config/dns/hosts/" + elem;
    $.ajax({
      url: path,
      method: "PUT",
    })
      .done(function (response) {
        utils.enableAll();
        if (response === undefined) {
          utils.showAlert("success", "far fa-plus", "Successfully added DNS record", "");
          dnsRecordsTable.ajax.reload(null, false);
        } else {
          utils.showAlert("error", "", "Error while adding DNS record", response.record);
        }
      })
      .fail(function (jqXHR, exception) {
        utils.enableAll();
        utils.showAlert("error", "", "Error while deleting DNS record", jqXHR.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });
  $("#btnAdd-cname").on("click", function () {
    var elem = $("#Cdomain").val() + "," + $("#Ctarget").val();
    var ttlVal = parseInt($("#Cttl").val(), 10);
    if (isFinite(ttlVal) && ttlVal >= 0) elem += "," + ttlVal;
    const path = "/api/config/dns/cnameRecords/" + elem;
    $.ajax({
      url: path,
      method: "PUT",
    })
      .done(function (response) {
        utils.enableAll();
        if (response === undefined) {
          utils.showAlert("success", "far fa-plus", "Successfully added CNAME record", "");
          dnsRecordsTable.ajax.reload(null, false);
        } else {
          utils.showAlert("error", "", "Error while adding CNAME record", response.record);
        }
      })
      .fail(function (jqXHR, exception) {
        utils.enableAll();
        utils.showAlert("error", "", "Error while deleting CNAME record", jqXHR.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });
});
