/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */
var table;
var token = $("#token").text();

function renderTimestamp(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    return utils.datetime(data);
  }

  // Sorting content
  return data;
}

function multline(input) {
  return input.split(",").join("\n");
}

function renderMessage(data, type, row) {
  // Display and search content
  switch (row.type) {
    case "REGEX":
      return (
        'Encountered an error when processing <a href="groups-domains.php?domainid=' +
        row.blob3 +
        '">' +
        row.blob1 +
        " regex filter with ID " +
        row.blob3 +
        "</a>:<pre>" +
        row.blob2 +
        "</pre>Error message: <pre>" +
        row.message +
        "</pre>"
      );

    case "SUBNET":
      return (
        "Client <code>" +
        row.message +
        "</code> is managed by " +
        row.blob1 +
        " groups (database IDs [" +
        row.blob3 +
        "]):<pre>" +
        multline(row.blob2) +
        "</pre>" +
        "FTL chose the most recent entry <pre>" +
        row.blob4 +
        "</pre> to get the group configuration for this client."
      );

    case "HOSTNAME":
      // eslint-disable-next-line unicorn/no-new-array
      var hint = new Array(row.blob2 + row.message.length + 3).join(" ");
      return (
        "Hostname contains invalid character <code>" +
        decodeURIComponent(escape(row.blob1))[row.blob2] +
        "</code>:<pre>" +
        hint +
        "&darr;\n" +
        row.message +
        ": " +
        decodeURIComponent(escape(row.blob1)) +
        "\n" +
        hint +
        "&uarr;</pre>"
      );

    case "DNSMASQ_CONFIG":
      return "FTL failed to start due to " + row.message;

    case "RATE_LIMIT":
      return (
        "Client " +
        row.message +
        " has been rate-limited (current config allows up to " +
        parseInt(row.blob1, 10) +
        " queries in " +
        parseInt(row.blob2, 10) +
        " seconds)"
      );

    default:
      return "Unknown message type<pre>" + JSON.stringify(row) + "</pre>";
  }
}

$(function () {
  table = $("#messagesTable").DataTable({
    ajax: {
      url: "api_db.php?messages",
      data: { token: token },
      type: "POST",
      dataSrc: "messages",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "timestamp", width: "8%", render: renderTimestamp },
      { data: "type", width: "8%" },
      { data: "message", orderable: false, render: renderMessage },
      { data: "blob1", visible: false },
      { data: "blob2", visible: false },
      { data: "blob3", visible: false },
      { data: "blob4", visible: false },
      { data: "blob5", visible: false },
      { data: null, width: "80px", orderable: false },
    ],
    drawCallback: function () {
      $('button[id^="deleteMessage_"]').on("click", deleteMessage);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteMessage_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(3)", row).html(button);
    },
    dom:
      "<'row'<'col-sm-4'l><'col-sm-8'f>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No issues found.",
    },
    stateSave: true,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("messages-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("messages-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Reset visibility of ID and blob columns
      var hiddenCols = [0, 4, 5, 6, 7, 8];
      for (var key in hiddenCols) {
        if (Object.prototype.hasOwnProperty.call(hiddenCols, key)) {
          data.columns[hiddenCols[key]].visible = false;
        }
      }

      // Apply loaded state to table
      return data;
    },
  });
});

function deleteMessage() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");

  utils.disableAll();
  utils.showAlert("info", "", "Deleting message with ID " + parseInt(id, 10), "...");
  $.ajax({
    url: "scripts/pi-hole/php/message.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_message", id: id, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "far fa-trash-alt", "Successfully deleted message # ", id);
        table.row(tr).remove().draw(false).ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting message with ID " + id,
          response.message
        );
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting message with ID " + id,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
