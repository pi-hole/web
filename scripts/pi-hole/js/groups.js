/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false, updateFtlInfo:false */

var table,
  idNames = {};

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else {
    alert("An unknown error occurred while loading the data.\n" + xhr.responseText);
  }

  table.clear();
  table.draw();
}

$(function () {
  $("#btnAdd").on("click", addGroup);

  table = $("#groupsTable").DataTable({
    processing: true,
    ajax: {
      url: "/api/groups",
      error: handleAjaxError,
      dataSrc: "groups",
      type: "GET",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, orderable: false, width: "15px" },
      { data: "name" },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 1,
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
      // Hide buttons if all groups were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      $('button[id^="deleteGroup_"]').on("click", deleteGroup);
    },
    rowCallback: function (row, data) {
      idNames[data.id] = data.name;
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added, false) +
        "\nLast modified: " +
        utils.datetime(data.date_modified, false) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(1)", row).html(
        '<input id="name_' + data.id + '" title="' + tooltip + '" class="form-control">'
      );
      var nameEl = $("#name_" + data.id, row);
      nameEl.val(utils.unescapeHtml(data.name));
      nameEl.on("change", editGroup);

      $("td:eq(2)", row).html(
        '<input type="checkbox" id="enabled_' +
          data.id +
          '"' +
          (data.enabled ? " checked" : "") +
          ">"
      );
      var enabledEl = $("#enabled_" + data.id, row);
      enabledEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px",
      });
      enabledEl.on("change", editGroup);

      $("td:eq(3)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var comment = data.comment !== null ? data.comment : "";
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(utils.unescapeHtml(comment));
      commentEl.on("change", editGroup);

      $("td:eq(4)", row).empty();
      if (data.id !== 0) {
        var button =
          '<button type="button" class="btn btn-danger btn-xs" id="deleteGroup_' +
          data.id +
          '" data-del-id="' +
          data.id +
          '">' +
          '<span class="far fa-trash-alt"></span>' +
          "</button>";
        $("td:eq(4)", row).html(button);
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
          delItems(ids);
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
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("groups-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("groups-table");

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

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  if (input !== null) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", false);
  }

  table.on("init select deselect", function () {
    utils.changeBulkDeleteStates(table);
  });

  table.on("order.dt", function () {
    var order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").removeClass("hidden");
    } else {
      $("#resetButton").addClass("hidden");
    }
  });

  $("#resetButton").on("click", function () {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").addClass("hidden");
  });
});

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteGroup() {
  // Passes the button data-del-id attribute as ID
  const ids = [parseInt($(this).attr("data-del-id"), 10)];
  delItems(ids);
}

function delItems(ids) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  for (const id of ids) {
    // Exploit prevention: Return early for non-numeric IDs
    if (typeof id !== "number") return;
  }

  // Get first element from array
  const id = ids[0];
  const name = idNames[id];

  // Remove first element from array
  ids.shift();

  utils.disableAll();
  const idstring = ids.join(", ");
  utils.showAlert("info", "", "Deleting group...", name);

  $.ajax({
    url: "/api/groups/" + name,
    method: "delete",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted group: ", name);
      table.row(id).remove().draw(false);
      if (ids.length > 0) {
        // Recursively delete all remaining items
        delItems(ids);
        return;
      }

      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeBulkDeleteStates(table);

      // Update number of groups in the sidebar
      updateFtlInfo();
    })
    .fail(function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting group(s): " + idstring, data.responseText);
      console.log(exception); // eslint-disable-line no-console
    });
}

function addGroup() {
  const comment = utils.escapeHtml($("#new_comment").val());

  // Check if the user wants to add multiple groups (space or newline separated)
  // If so, split the input and store it in an array
  var names = utils
    .escapeHtml($("#new_name"))
    .val()
    .split(/[\s,]+/);
  // Remove empty elements
  names = names.filter(function (el) {
    return el !== "";
  });
  const groupStr = JSON.stringify(names);

  utils.disableAll();
  utils.showAlert("info", "", "Adding group(s)...", groupStr);

  if (names.length === 0) {
    // enable the ui elements again
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a group name");
    return;
  }

  $.ajax({
    url: "/api/groups",
    method: "post",
    dataType: "json",
    data: JSON.stringify({
      name: names,
      comment: comment,
      enabled: true,
    }),
    success: function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully added group(s)", groupStr);
      $("#new_name").val("");
      $("#new_comment").val("");
      table.ajax.reload();
      table.rows().deselect();
      $("#new_name").focus();
      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new group", data.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editGroup() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const id = tr.attr("data-id");
  const oldName = idNames[id];
  const name = utils.escapeHtml(tr.find("#name_" + id).val());
  const enabled = tr.find("#enabled_" + id).is(":checked");
  const comment = utils.escapeHtml(tr.find("#comment_" + id).val());

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "enabled_" + id:
      if (enabled === false) {
        done = "disabled";
        notDone = "disabling";
      } else if (enabled === true) {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of";
      notDone = "editing name of";
      break;
    case "comment_" + id:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    default:
      alert("bad element ( " + elem + " ) or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing group...", oldName);
  $.ajax({
    url: "/api/groups/" + oldName,
    method: "put",
    dataType: "json",
    data: JSON.stringify({
      name: name,
      comment: comment,
      enabled: enabled,
    }),
    success: function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-pencil-alt", "Successfully " + done + " group", oldName);
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + " group with name " + oldName,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
