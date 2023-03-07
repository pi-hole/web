/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false */

var apiSessionsTable = null;

function renderBool(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    var icon = "fa-xmark";
    if (data === true) {
      icon = "fa-check";
    }

    return '<i class="fa-solid ' + icon + '"></i>';
  }

  // Sorting content
  return data;
}

$(function () {
  apiSessionsTable = $("#APISessionsTable").DataTable({
    ajax: {
      url: "/api/auth/sessions",
      type: "GET",
      dataSrc: "sessions",
    },
    order: [[1, "asc"]],
    columns: [
      { data: null, width: "22px" },
      { data: "id" },
      { data: "valid", render: renderBool },
      { data: "login_at", render: utils.renderTimestamp },
      { data: "valid_until", render: utils.renderTimestamp },
      { data: "remote_addr", type: "ip-address" },
      { data: "user_agent" },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 0,
        orderable: false,
        className: "select-checkbox",
        render: function () {
          return "";
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteSession_"]').on("click", deleteSession);

      // Hide buttons if all messages were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.ip);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteSession_' +
        data.id +
        '" data-del-id="' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(7)", row).html(button);
      if (data.current_session) {
        $("td:eq(5)", row).html('<strong title="This is the current session">' + data.remote_addr + "</strong>");
      }
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
        action: function () {
          apiSessionsTable.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action: function () {
          apiSessionsTable.rows({ page: "current" }).select();
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
        action: function () {
          // For each ".selected" row ...
          var ids = [];
          $("tr.selected").each(function () {
            // ... add the row identified by "data-id".
            ids.push(parseInt($(this).attr("data-id"), 10));
          });
          // Delete all selected rows at once
          delSession(ids);
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
      emptyTable: "No active sessions found.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("api-sessions-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("api-sessions-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
  apiSessionsTable.on("init select deselect", function () {
    utils.changeTableButtonStates(apiSessionsTable);
  });
});

function deleteSession() {
  // Passes the button data-del-id attribute as ID
  var ids = [$(this).attr("data-del-is")];

  // Check input validity
  if (!Array.isArray(ids)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (var ip in ids) {
    if (Object.hasOwnProperty.call(ids, ip)) {
      delSession(ids);
    }
  }
}

function delSession(_ids) {
  alert("Deleteing sessions is not implemented yet");
}

function processWebServerConfig() {
  $.ajax({
    url: "/api/config/webserver?detailed=true",
  })
    .done(function (data) {
      setConfigValues("webserver", "webserver", data.config.webserver);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(document).ready(function () {
  processWebServerConfig();
});
