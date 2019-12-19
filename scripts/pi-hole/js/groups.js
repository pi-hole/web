var table;
const token = $("#token").html();
var info = null;

function showAlert(type, icon, title, message) {
  let opts = {};
  title = "&nbsp;<strong>" + title + "</strong><br>";
  switch (type) {
    case "info":
      opts = {
        type: "info",
        icon: "glyphicon glyphicon-time",
        title: title,
        message: message
      };
      info = $.notify(opts);
      break;
    case "success":
      opts = {
        type: "success",
        icon: icon,
        title: title,
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }
      break;
    case "warning":
      opts = {
        type: "warning",
        icon: "glyphicon glyphicon-warning-sign",
        title: title,
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }
      break;
    case "error":
      opts = {
        type: "danger",
        icon: "glyphicon glyphicon-remove",
        title: "Error, something went wrong!",
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }
      break;
    default:
      return;
  }
}

$(document).ready(function() {
  $("#btnAdd").on("click", addGroup);

  table = $("#groupsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_groups", token: token },
      type: "POST"
    },
    order: [[1, "asc"]],
    columns: [
      { data: "id", width: "60px" },
      { data: "enabled", searchable: false },
      { data: "name" },
      { data: "description" },
      { data: null, width: "60px", orderable: false }
    ],
    drawCallback: function(settings) {
      $(".deleteGroup").on("click", deleteGroup);
    },
    rowCallback: function(row, data) {
      const disabled = data.enabled === 0;
      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status"' +
          (disabled ? "" : " checked") +
          ">"
      );
      $("#status", row).bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      $('#status', row).on('change', editGroup);

      $("td:eq(2)", row).html('<input id="name" class="form-control">');
      $("#name", row).val(data.name);
      $('#name', row).on('change', editGroup);

      $("td:eq(3)", row).html('<input id="desc" class="form-control">');
      const desc = data.description !== null ? data.description : "";
      $("#desc", row).val(desc);
      $('#desc', row).on('change', editGroup);

      $("td:eq(4)", row).empty();
      if (data.id !== 0) {
        let button =
          " &nbsp;" +
          '<button class="btn btn-danger btn-xs deleteGroup" type="button" data-id="' +
          data.id +
          '">' +
          '<span class="glyphicon glyphicon-trash"></span>' +
          "</button>";
          $("td:eq(4)", row).html(button);
      }
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-table", JSON.stringify(data));
    },
    stateLoadCallback: function(settings) {
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
      // Apply loaded state to table
      return data;
    }
  });
});

function addGroup() {
  var name = $("#new_name").val();
  var desc = $("#new_desc").val();

  showAlert("info", "", "Adding group...", name);

  if (name.length === 0) {
    showAlert("warning", "", "Warning", "Please specify a group name");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_group", name: name, desc: desc, token: token },
    success: function(response) {
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-plus",
          "Successfully added group",
          name
        );
        $("#new_name").val("");
        $("#new_desc").val("");
        table.ajax.reload();
      } else {
        showAlert(
          "error",
          "",
          "Error while adding new group",
          response.message
        );
      }
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while adding new group",
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function editGroup() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.find("td:eq(0)").text();
  var name = tr.find("#name").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var desc = tr.find("#desc").val();

  var done = "edited";
  var not_done = "editing";
  if(elem === "status" && status === 1)
  {
    done = "enabled";
    not_done = "enabling";
  }
  else if(elem === "status" && status === 0)
  {
    done = "disabled";
    not_done = "disabling";
  }
  else if(elem === "name")
  {
    done = "edited name of";
    not_done = "editing name of";
  }
  else if(elem === "desc")
  {
    done = "edited description of";
    not_done = "editing description of";
  }

  showAlert("info", "", "Editing group...", name);
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
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "Successfully " + done + " group",
          name
        );
        table.ajax.reload();
      } else {
        showAlert(
          "error",
          "",
          "Error while " + not_done + " group with ID " + id,
          response.message
        );
      }
    },
    error: function(jqXHR, exception) {
      showAlert(
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
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var name = tr.find("#name").val();

  showAlert("info", "", "Deleting group...", name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_group", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "Successfully deleted group ",
          name
        );
        table.ajax.reload();
      } else {
        showAlert(
          "error",
          "",
          "Error while deleting group with ID " + id,
          response.message
        );
      }
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while deleting group with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}
