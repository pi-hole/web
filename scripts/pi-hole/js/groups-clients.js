var table;
var groups = [];
const token = $("#token").html();
var info = null;

function showAlert(type, icon, message) {
  var msg = "";
  switch (type) {
    case "info":
      info = $.notify({
        type: "info",
        icon: "glyphicon glyphicon-time",
        message: "&nbsp;" + message
      });
      break;
    case "success":
      msg = "&nbsp;Successfully " + message;
      if (info) {
        info.update({ type: "success", icon: icon, message: msg });
      } else {
        $.notify({ type: "success", icon: icon, message: msg });
      }
      break;
    case "warning":
      msg = "&nbsp;" + message;
      if (info) {
        info.update({
          type: "warning",
          icon: "glyphicon glyphicon-warning-sign",
          message: msg
        });
      } else {
        $.notify({
          type: "warning",
          icon: "glyphicon glyphicon-warning-sign",
          message: msg
        });
      }
      break;
    case "error":
      msg = "&nbsp;Error, something went wrong!<br><pre>" + message + "</pre>";
      if (info) {
        info.update({
          type: "danger",
          icon: "glyphicon glyphicon-remove",
          message: msg
        });
      } else {
        $.notify({
          type: "danger",
          icon: "glyphicon glyphicon-remove",
          message: msg
        });
      }
      break;
    default:
      return;
  }
}

function reload_client_suggestions() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_unconfigured_clients", token: token },
    function(data) {
      var sel = $("#select");
      sel.empty();
      for (var i = 0; i < data.length; i++) {
        sel.append(
          $("<option />")
            .val(data[i])
            .text(data[i])
        );
      }
      sel.append(
        $("<option />")
          .val("custom")
          .text("Custom, specified on the right")
      );
    },
    "json"
  );
}

function get_groups() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_groups", token: token },
    function(data) {
      groups = data.data;
      initTable();
    },
    "json"
  );
}

$(document).ready(function() {
  $("#btnAdd").on("click", addClient);

  reload_client_suggestions();
  get_groups();

  $("#select").on("change", function() {
    $("#ip-custom").val("");
    $("#ip-custom").prop(
      "disabled",
      $("#select option:selected").val() !== "custom"
    );
  });
});

function initTable() {
  table = $("#clientsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_clients", token: token },
      type: "POST"
    },
    order: [[1, "asc"]],
    columns: [
      { data: "ip" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function(settings) {
      $(".editClient").on("click", editClient);
      $(".deleteClient").on("click", deleteClient);
    },
    rowCallback: function(row, data) {
      const tooltip = "Database ID: " + data.id;
      $("td:eq(0)", row).html(
        '<code id="ip" title="' +
          tooltip +
          '">' +
          data.ip +
          '</code><input id="id" type="hidden" value="' +
          data.id +
          '">'
      );

      $("td:eq(1)", row).empty();
      $("td:eq(1)", row).append(
        '<select id="multiselect" multiple="multiple"></select>'
      );
      var sel = $("#multiselect", row);
      // Add all known groups
      for (var i = 0; i < groups.length; i++) {
        var extra = "ID " + groups[i].id;
        if (!groups[i].enabled) {
          extra += ", disabled";
        }
        sel.append(
          $("<option />")
            .val(groups[i].id)
            .text(groups[i].name + " (" + extra + ")")
        );
      }
      // Select assigned groups
      sel.val(data.groups);
      // Initialize multiselect
      sel.multiselect({ includeSelectAllOption: true });

      let button =
        '<button class="btn btn-success btn-xs editClient" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        "</button>" +
        " &nbsp;" +
        '<button class="btn btn-danger btn-xs deleteClient" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
        "</button>";
      $("td:eq(2)", row).html(button);
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-clients-table", JSON.stringify(data));
    },
    stateLoadCallback: function(settings) {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-clients-table");
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
}

function addClient() {
  var ip = $("#select").val();
  if (ip === "custom") {
    ip = $("#ip-custom").val();
  }

  showAlert("info", "", "Adding client " + ip + "...");

  if (ip.length === 0) {
    showAlert("warning", "", "Please specify a client");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_client", ip: ip, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success", "glyphicon glyphicon-plus", "added client " + ip);
        reload_client_suggestions();
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while adding new client: " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function editClient() {
  var tr = $(this).closest("tr");
  var id = tr.find("#id").val();
  var groups = tr.find("#multiselect").val();
  var ip = tr.find("#ip").text();

  showAlert("info", "", "Editing client " + ip + "...");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "edit_client", id: id, groups: groups, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success", "glyphicon glyphicon-plus", "edited client " + ip);
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while editing client with ID " + id + ": " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteClient() {
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var ip = tr.find("#ip").text();

  showAlert("info", "", "Deleting client " + ip + "...");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_client", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "deleted client " + ip
        );
        reload_client_suggestions();
        table.ajax.reload();
      } else showAlert("error", "", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while deleting client with ID " + id + ": " + jqXHR.responseText
      );
      console.log(exception);
    }
  });
}
