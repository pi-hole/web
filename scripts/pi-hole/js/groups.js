/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, group_utils: false */

var table;

$(function () {
  $("#btnAdd").on("click", addGroup);

  table = $("#groupsTable").DataTable({
    ajax: {
      url: "/api/groups",
      dataSrc: "groups"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "name" },
      { data: "enabled", searchable: false },
      { data: "description" },
      { data: null, width: "60px", orderable: false }
    ],
    drawCallback: function () {
      $('button[id^="deleteGroup_"]').on("click", deleteGroup);
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added, false) +
        "\nLast modified: " +
        utils.datetime(data.date_modified, false) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(0)", row).html(
        '<code id="name_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          utils.escapeHtml(data.name) +
          "</code>"
      );

      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status_' +
          data.id +
          '"' +
          (data.enabled ? " checked" : "") +
          ">"
      );
      var statusEl = $("#status_" + data.id, row);
      statusEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      statusEl.on("change", editGroup);

      $("td:eq(2)", row).html('<input id="desc_' + data.id + '" class="form-control">');
      var desc = data.description !== null ? data.description : "";
      var descEl = $("#desc_" + data.id, row);
      descEl.val(utils.unescapeHtml(desc));
      descEl.on("change", editGroup);

      $("td:eq(3)", row).empty();
      if (data.id !== 0) {
        var button =
          '<button type="button" class="btn btn-danger btn-xs" id="deleteGroup_' +
          data.id +
          '">' +
          '<span class="far fa-trash-alt"></span>' +
          "</button>";
        $("td:eq(3)", row).html(button);
      }
    },
    dom:
      "<'row'<'col-sm-4'l><'col-sm-8'f>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
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
    }
  });

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  if (input !== null) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", false);
  }

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

function addGroup() {
  var nameEl = $("#new_name");
  var name = utils.escapeHtml(nameEl.val());
  var descEl = $("#new_desc");
  var desc = utils.escapeHtml(descEl.val());

  if (name.length === 0) {
    // enable the ui elements again
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a group name");
    return;
  }

  var data = JSON.stringify({
    item: name,
    description: desc,
    enabled: true
  });
  var url = "/api/groups/";
  group_utils.addEntry(url, name, "group", data, function () {
    nameEl.val("");
    descEl.val("");
    group_utils.reload(table);
  });
}

function editGroup() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var name = utils.escapeHtml(tr.find("#name_" + id).text());
  var enabled = tr.find("#status_" + id).is(":checked");
  var desc = utils.escapeHtml(tr.find("#desc_" + id).val());

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "status_" + id:
      if (enabled) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of";
      notDone = "editing name of";
      break;
    case "desc_" + id:
      done = "edited description of";
      notDone = "editing description of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  var data = JSON.stringify({
    name: name,
    description: desc,
    enabled: enabled
  });

  var url = "/api/groups/" + encodeURIComponent(name);
  group_utils.editEntry(url, name, "group", data, done, notDone, function () {
    group_utils.reload(table);
  });
}

function deleteGroup() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var name = utils.escapeHtml(tr.find("#name_" + id).text());

  var url = "/api/groups/" + encodeURIComponent(name);
  group_utils.delEntry(url, name, "group", function () {
    group_utils.reload(table);
  });
}
