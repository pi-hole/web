/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Precord see LICENSE file for your rights under this license. */

/* global utils: false, apiFailure:false */

var dnsRecordsTable = null;
var customCNAMETable = null;

function hostsDomain(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  const name = data.substring(data.indexOf(" ") + 1);
  return name;
}

function hostsIP(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  const ip = data.substring(0, data.indexOf(" "));
  return ip;
}

function CNAMEdomain(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[0];
}

function CNAMEtarget(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[1];
}

function CNAMEttl(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr.length > 2 ? CNAMEarr[2] : "-";
}

$(function () {
  dnsRecordsTable = $("#dnsRecordsTable").DataTable({
    ajax: {
      url: "/api/config/dns/hosts",
      type: "GET",
      dataSrc: "config.dns.hosts",
    },
    order: [[0, "asc"]],
    columns: [
      { data: null, render: hostsDomain },
      { data: null, type: "ip-address", render: hostsIP },
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
      $(row).attr("data-id", data);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteRecord' +
        utils.hexEncode(data) +
        '" data-tag="' +
        data +
        '" data-type="hosts">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(2)", row).html(button);
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
    processing: true,
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
      { data: null, render: CNAMEdomain },
      { data: null, render: CNAMEtarget },
      { data: null, render: CNAMEttl },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteCNAME"]').on("click", deleteRecord);

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteCNAME' +
        utils.hexEncode(data) +
        '" data-tag="' +
        data +
        '" data-type="cname">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(3)", row).html(button);
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
    processing: true,
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
  // Get the tags
  var tags = [$(this).attr("data-tag")];
  var types = [$(this).attr("data-type")];

  // Check input validity
  if (!Array.isArray(tags)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (var tag in tags) {
    if (Object.hasOwnProperty.call(tags, tag)) {
      if (types[0] === "hosts") delHosts(tags);
      else delCNAME(tags);
    }
  }
}

function delHosts(elem) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting DNS record...");
  const url = "/api/config/dns/hosts/" + encodeURIComponent(elem);

  $.ajax({
    url: url,
    method: "DELETE",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted DNS record", "");
      dnsRecordsTable.ajax.reload(null, false);
    })
    .fail(function (data, exception) {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while deleting DNS record: <code>" + utils.escapeHtml(elem) + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function delCNAME(elem) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting local CNAME record...");
  const url = "/api/config/dns/cnameRecords/" + encodeURIComponent(elem);

  $.ajax({
    url: url,
    method: "DELETE",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted local CNAME record", "");
      customCNAMETable.ajax.reload(null, false);
    })
    .fail(function (data, exception) {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while deleting CNAME record: <code>" + utils.escapeHtml(elem) + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

$(document).ready(function () {
  $("#btnAdd-host").on("click", function () {
    const elem = $("#Hip").val() + " " + $("#Hdomain").val();
    const url = "/api/config/dns/hosts/" + encodeURIComponent(elem);
    $.ajax({
      url: url,
      method: "PUT",
    })
      .done(function () {
        utils.enableAll();
        utils.showAlert("success", "far fa-plus", "Successfully added DNS record", "");
        dnsRecordsTable.ajax.reload(null, false);
      })
      .fail(function (data, exception) {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while deleting DNS record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });

  $("#btnAdd-cname").on("click", function () {
    var elem = $("#Cdomain").val() + "," + $("#Ctarget").val();
    var ttlVal = parseInt($("#Cttl").val(), 10);
    if (isFinite(ttlVal) && ttlVal >= 0) elem += "," + ttlVal;
    const url = "/api/config/dns/cnameRecords/" + encodeURIComponent(elem);
    $.ajax({
      url: url,
      method: "PUT",
    })
      .done(function () {
        utils.enableAll();
        utils.showAlert("success", "far fa-plus", "Successfully added CNAME record", "");
        dnsRecordsTable.ajax.reload(null, false);
      })
      .fail(function (data, exception) {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while deleting CNAME record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });
});
