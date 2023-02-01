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

function htmlPass(data, type) {
  return data;
}

$(function () {
  var ignoreNonfatal = localStorage
    ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") === "true"
    : false;
  var url = "/api/info/messages" + (ignoreNonfatal ? "?filter_dnsmasq_warnings=true" : "");
  table = $("#messagesTable").DataTable({
    ajax: {
      url: url,
      type: "GET",
      dataSrc: "messages",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, width: "15px" },
      { data: "timestamp", width: "8%", render: renderTimestamp },
      { data: "type", width: "8%" },
      { data: "html", orderable: false, render: htmlPass },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 1,
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
      $('button[id^="deleteMessage_"]').on("click", deleteMessage);

      // Hide buttons if all messages were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      var button =
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
        action: function () {
          table.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action: function () {
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
        action: function () {
          // For each ".selected" row ...
          var ids = [];
          $("tr.selected").each(function () {
            // ... add the row identified by "data-id".
            ids.push(parseInt($(this).attr("data-id"), 10));
          });
          // Delete all selected rows at once
          delMsg(ids);
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
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("messages-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("messages-table");
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
  table.on("init select deselect", function () {
    changeButtonStates();
  });
});

// Show only the appropriate buttons
function changeButtonStates() {
  var allRows = table.rows({ filter: "applied" }).data().length;
  var pageLength = table.page.len();
  var selectedRows = table.rows(".selected").data().length;

  if (selectedRows === 0) {
    // Nothing selected
    $(".selectAll").removeClass("hidden");
    $(".selectMore").addClass("hidden");
    $(".removeAll").addClass("hidden");
    $(".deleteSelected").addClass("hidden");
  } else if (selectedRows >= pageLength || selectedRows === allRows) {
    // Whole page is selected (or all available messages were selected)
    $(".selectAll").addClass("hidden");
    $(".selectMore").addClass("hidden");
    $(".removeAll").removeClass("hidden");
    $(".deleteSelected").removeClass("hidden");
  } else {
    // Some rows are selected, but not all
    $(".selectAll").addClass("hidden");
    $(".selectMore").removeClass("hidden");
    $(".removeAll").addClass("hidden");
    $(".deleteSelected").removeClass("hidden");
  }
}

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteMessage() {
  // Passes the button data-del-id attribute as ID
  var ids = [parseInt($(this).attr("data-del-id"), 10)];

  // Check input validity
  if (!Array.isArray(ids)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (var id in ids) {
    if (Object.hasOwnProperty.call(ids, id) && typeof ids[id] !== "number") return;
    delMsg(ids);
  }
}

function delMsg(id) {

  utils.disableAll();
  utils.showAlert("info", "", "Deleting message...");

  $.ajax({
    url: "/api/info/messages/" + id,
    method: "DELETE"
  })
    .done(function (response) {
      utils.enableAll();
      console.log(response);
      if (response === undefined) {
        utils.showAlert("success", "far fa-trash-alt", "Successfully deleted message", "");
        table.row(id).remove().draw(false).ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting message: " + id,
          response.message
        );
      }

      // Clear selection after deletion
      table.rows().deselect();
      changeButtonStates();
    })
    .done(
      utils.checkMessages // Update icon warnings count
    )
    .fail(function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting message: " + id,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}
