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

$(document).ready(function() {
  $("#btnAdd").on("click", addCustomDNS);

  table = $("#customDNSTable").DataTable({
    ajax: "scripts/pi-hole/php/customdns.php?action=get",
    columns: [{}, {}, { orderable: false, searchable: false }],
    columnDefs: [
      {
        targets: 2,
        render: function(data, type, row) {
          return (
            '<button class="btn btn-danger btn-xs deleteCustomDNS" type="button" data-domain=\'' +
            row[0] +
            "' data-ip='" +
            row[1] +
            "'>" +
            '<span class="glyphicon glyphicon-trash"></span>' +
            "</button>"
          );
        }
      }
    ],
    drawCallback: function() {
      $(".deleteCustomDNS").on("click", deleteCustomDNS);
    }
  });
});

function addCustomDNS() {
  var ip = $("#ip").val();
  var domain = $("#domain").val();

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/customdns.php",
    method: "post",
    dataType: "json",
    data: { action: "add", ip: ip, domain: domain },
    success: function(response) {
      if (response.success) {
        showAlert("success");
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function() {
      showAlert("error", "Error while adding this custom DNS entry");
    }
  });
}

function deleteCustomDNS() {
  var ip = $(this).attr("data-ip");
  var domain = $(this).attr("data-domain");

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/customdns.php",
    method: "post",
    dataType: "json",
    data: { action: "delete", domain: domain, ip: ip },
    success: function(response) {
      if (response.success) {
        showAlert("success");
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "Error while deleting this custom DNS entry");
      console.log(exception);
    }
  });
}
