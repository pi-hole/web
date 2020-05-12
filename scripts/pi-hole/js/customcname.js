/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

var table;

function showAlert(type, message) {
  var alertElement = null;
  var messageElement = null;

  switch (type) {
    case "info":
      alertElement = $("#alInfo");
      break;
    case "success":
      alertElement = $("#alSuccess");
      break;
    case "warning":
      alertElement = $("#alWarning");
      messageElement = $("#warn");
      break;
    case "error":
      alertElement = $("#alFailure");
      messageElement = $("#err");
      break;
    default:
      return;
  }

  if (messageElement !== null) messageElement.html(message);

  alertElement.fadeIn(200);
  alertElement.delay(8000).fadeOut(2000);
}

$(document).ready(function () {
  $("#btnAdd").on("click", addCustomCNAME);

  table = $("#customCNAMETable").DataTable({
    ajax: "scripts/pi-hole/php/customcname.php?action=get",
    columns: [{}, {}, { orderable: false, searchable: false }],
    columnDefs: [
      {
        targets: 2,
        render: function (data, type, row) {
          return (
            '<button class="btn btn-danger btn-xs deleteCustomCNAME" type="button" data-domain=\'' +
            row[0] +
            "' data-target='" +
            row[1] +
            "'>" +
            '<span class="far fa-trash-alt"></span>' +
            "</button>"
          );
        }
      }
    ],
    drawCallback: function () {
      $(".deleteCustomCNAME").on("click", deleteCustomCNAME);
    }
  });
  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
});

function addCustomCNAME() {
  var target = $("#target").val();
  var domain = $("#domain").val();

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/customcname.php",
    method: "post",
    dataType: "json",
    data: { action: "add", target: target, domain: domain },
    success: function (response) {
      if (response.success) {
        showAlert("success");
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function () {
      showAlert("error", "Error while adding this custom CNAME record");
    }
  });
}

function deleteCustomCNAME() {
  var target = $(this).attr("data-target");
  var domain = $(this).attr("data-domain");

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/customcname.php",
    method: "post",
    dataType: "json",
    data: { action: "delete", domain: domain, target: target },
    success: function (response) {
      if (response.success) {
        showAlert("success");
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function (jqXHR, exception) {
      showAlert("error", "Error while deleting this custom CNAME record");
      console.log(exception);
    }
  });
}
