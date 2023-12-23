/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var token = $("#token").text();

$(function () {
  $("#btnAdd").on("click", addCustomNS);

  table = $("#customNSTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/customns.php",
      data: { action: "get", token: token },
      type: "POST",
    },
    columns: [{}, {}, { orderable: false, searchable: false }],
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row) {
          return (
            '<button type="button" class="btn btn-danger btn-xs deleteCustomNS" data-domain=\'' +
            row[0] +
            "' data-target='" +
            row[1] +
            "'>" +
            '<span class="far fa-trash-alt"></span>' +
            "</button>"
          );
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    order: [[0, "asc"]],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("LocalNSTable", data);
    },
    stateLoadCallback: function () {
      return utils.stateLoadCallback("LocalNSTable");
    },
    drawCallback: function () {
      $(".deleteCustomNS").on("click", deleteCustomNS);
    },
  });

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
});

function addCustomNS() {
  var domain = utils.escapeHtml($("#domain").val());
  var target = utils.escapeHtml($("#target").val());

  utils.disableAll();
  utils.showAlert("info", "", "Adding custom NS record...", "");

  $.ajax({
    url: "scripts/pi-hole/php/customns.php",
    method: "post",
    dataType: "json",
    data: { action: "add", domain: domain, target: target, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-check-circle",
          "Custom NS added",
          domain + ": " + target
        );

        // Clean up field values and reload table data
        $("#domain").val("");
        $("#target").val("");
        table.ajax.reload();
        $("#domain").focus();
      } else {
        utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
      }
    },
    error: function () {
      utils.enableAll();
      utils.showAlert("error", "fas fa-times", "Error while adding custom NS record", "");
    },
  });
}

function deleteCustomNS() {
  var domain = $(this).attr("data-domain");
  var target = $(this).attr("data-target");

  utils.disableAll();
  utils.showAlert("info", "", "Deleting custom NS record...", "");

  $.ajax({
    url: "scripts/pi-hole/php/customns.php",
    method: "post",
    dataType: "json",
    data: { action: "delete", domain: domain, target: target, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-check-circle",
          "Custom NS deleted",
          domain + ": " + target
        );
        table.ajax.reload();
      } else {
        utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "fas fa-times", "Error while deleting custom NS record", "");
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
