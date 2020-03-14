/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var token = $("#token").html();

$(document).ready(function() {
  $("#btnAdd").on("click", addGroup);

  table = $("#groupsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_groups", token: token },
      type: "POST"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "name" },
      { data: "enabled", searchable: false },
      { data: "description" },
      { data: null, width: "60px", orderable: false }
    ],
    drawCallback: function() {
      $('button[id^="deleteGroup_"]').on("click", deleteGroup);
    },
    rowCallback: function(row, data) {
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added) +
        "\nLast modified: " +
        utils.datetime(data.date_modified) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(0)", row).html(
        '<input id="name_' + data.id + '" title="' + tooltip + '" class="form-control">'
      );
      var nameEl = $("#name_" + data.id, row);
      nameEl.val(data.name);
      nameEl.on("change", editGroup);

      var disabled = data.enabled === 0;
      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status_' + data.id + '"' + (disabled ? "" : " checked") + ">"
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
      descEl.val(desc);
      descEl.on("change", editGroup);

      $("td:eq(3)", row).empty();
      if (data.id !== 0) {
        var button =
          '<button class="btn btn-danger btn-xs" type="button" id="deleteGroup_' +
          data.id +
          '">' +
          '<span class="glyphicon glyphicon-trash"></span>' +
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
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      data = JSON.parse(data);
      // Always start on the first page to show most recent queries
      data.start = 0;
      // Always start with empty search field
      data.search.search = "";
      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    }
  });

  table.on("order.dt", function() {
    var order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").show();
    } else {
      $("#resetButton").hide();
    }
  });
  $("#resetButton").on("click", function() {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").hide();
  });
});

function addGroup() {
  var name = $("#new_name").val();
  var desc = $("#new_desc").val();

  utils.disableAll();
  utils.showAlert("info", "", "Adding group...", name);

  if (name.length === 0) {
    utils.showAlert("warning", "", "Warning", "Please specify a group name");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_group", name: name, desc: desc, token: token },
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "glyphicon glyphicon-plus", "Successfully added group", name);
        $("#new_name").val("");
        $("#new_desc").val("");
        table.ajax.reload();
      } else {
        utils.showAlert("error", "", "Error while adding new group", response.message);
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new group", jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editGroup() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var name = tr.find("#name_" + id).val();
  var status = tr.find("#status_" + id).is(":checked") ? 1 : 0;
  var desc = tr.find("#desc_" + id).val();

  var done = "edited";
  var not_done = "editing";
  switch (elem) {
    case "status_" + id:
      if (status === 0) {
        done = "disabled";
        not_done = "disabling";
      } else if (status === 1) {
        done = "enabled";
        not_done = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of";
      not_done = "editing name of";
      break;
    case "desc_" + id:
      done = "edited description of";
      not_done = "editing description of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing group...", name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_group",
      id: id,
      name: name,
      desc: desc,
      status: status,
      token: token
    },
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "Successfully " + done + " group",
          name
        );
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while " + not_done + " group with ID " + id,
          response.message
        );
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + not_done + " group with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteGroup() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var name = tr.find("#name_" + id).val();

  utils.disableAll();
  utils.showAlert("info", "", "Deleting group...", name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_group", id: id, token: token },
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "Successfully deleted group ",
          name
        );
        table
          .row(tr)
          .remove()
          .draw(false);
      } else {
        utils.showAlert("error", "", "Error while deleting group with ID " + id, response.message);
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting group with ID " + id, jqXHR.responseText);
      console.log(exception);
    }
  });
}
