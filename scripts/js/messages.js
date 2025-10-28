/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils: false */

"use strict";

let table;
const toasts = {};

$(() => {
  const url = document.body.dataset.apiurl + "/info/messages";
  table = $("#messagesTable").DataTable({
    ajax: {
      url,
      type: "GET",
      dataSrc: "messages",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, width: "15px" },
      { data: "timestamp", width: "8%", render: utils.renderTimestamp },
      { data: "type", width: "8%" },
      { data: "html", orderable: false, render: (data, _type) => data },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 1,
        orderable: false,
        className: "select-checkbox",
        render() {
          return "";
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback() {
      $('button[id^="deleteMessage_"]').on("click", deleteMessage);

      // Hide buttons if all messages were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data.id);
      const button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteMessage_' +
        data.id +
        '" data-del-id="' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(4)", row).html(button);
    },
    select: {
      style: "multi",
      selector: "td:not(:last-child)",
      info: false,
    },
    buttons: [
      {
        text: '<span class="far fa-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectAll",
        action() {
          table.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action() {
          table.rows({ page: "current" }).select();
        },
      },
      {
        extend: "selectNone",
        text: '<span class="far fa-check-square"></span>',
        titleAttr: "Deselect All",
        className: "btn-sm datatable-bt removeAll",
      },
      {
        text: '<span class="far fa-trash-alt"></span>',
        titleAttr: "Delete Selected",
        className: "btn-sm datatable-bt deleteSelected",
        action() {
          // For each ".selected" row ...
          $("tr.selected").each(function () {
            // ... delete the row identified by "data-id".
            delMsg($(this).attr("data-id"));
          });
        },
      },
    ],
    dom:
      "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
      "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
      "<'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No issues found.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("messages-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("messages-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Reset visibility of ID column
      data.columns[0].visible = false;

      // Apply loaded state to table
      return data;
    },
  });
  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });
});

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteMessage() {
  // Passes the button data-del-id attribute as ID
  delMsg($(this).attr("data-del-id"));
}

function delMsg(id) {
  id = Number.parseInt(id, 10);
  utils.disableAll();
  toasts[id] = utils.showAlert("info", "", "Deleting message...", "ID: " + id, null);

  $.ajax({
    url: document.body.dataset.apiurl + "/info/messages/" + id,
    method: "DELETE",
  })
    .done(response => {
      utils.enableAll();
      if (response === undefined) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted message",
          "ID: " + id,
          toasts[id]
        );
        table.row(id).remove();

        table.draw(false).ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting message: " + id,
          response.message,
          toasts[id]
        );
      }

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeTableButtonStates(table);
    })
    .done(
      utils.checkMessages() // Update icon warnings count
    )
    .fail((jqXHR, exception) => {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting message: " + id,
        jqXHR.responseText,
        toasts[id]
      );
      console.log(exception); // eslint-disable-line no-console
    });
}
