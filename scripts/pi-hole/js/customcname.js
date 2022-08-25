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
  $("#btnAdd").on("click", addCustomCNAME);

  table = $("#customCNAMETable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/customcname.php",
      data: { action: "get", token: token },
      type: "POST",
    },
    columns: [{}, {}, { orderable: false, searchable: false }],
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row) {
          return (
            '<button type="button" class="btn btn-danger btn-xs deleteCustomCNAME" data-domain=\'' +
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
      utils.stateSaveCallback("LocalCNAMETable", data);
    },
    stateLoadCallback: function () {
      return utils.stateLoadCallback("LocalCNAMETable");
    },
    drawCallback: function () {
      $(".deleteCustomCNAME").on("click", deleteCustomCNAME);
    },
  });

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
});

function addCustomCNAME() {
  var domain = utils.escapeHtml($("#domain").val());
  var target = utils.escapeHtml($("#target").val());

  utils.disableAll();
  utils.showAlert("info", "", "Adding custom CNAME record...", "");

  $.ajax({
    url: "scripts/pi-hole/php/customcname.php",
    method: "post",
    dataType: "json",
    data: { action: "add", domain: domain, target: target, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-check-circle",
          "Custom CNAME added",
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
      utils.showAlert("error", "fas fa-times", "Error while adding custom CNAME record", "");
    },
  });
}

function deleteCustomCNAME() {
  var domain = $(this).attr("data-domain");
  var target = $(this).attr("data-target");

  utils.disableAll();
  utils.showAlert("info", "", "Deleting custom CNAME record...", "");

  $.ajax({
    url: "scripts/pi-hole/php/customcname.php",
    method: "post",
    dataType: "json",
    data: { action: "delete", domain: domain, target: target, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-check-circle",
          "Custom CNAME deleted",
          domain + ": " + target
        );
        table.ajax.reload();
      } else {
        utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "fas fa-times", "Error while deleting custom CNAME record", "");
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
