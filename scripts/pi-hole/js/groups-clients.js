var table;
var groups = [];
const token = $("#token").html();

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

  if (messageElement != null) messageElement.html(message);

  alertElement.fadeIn(200);
  alertElement.delay(8000).fadeOut(2000);
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

$.fn.redraw = function() {
  return $(this).each(function() {
    var redraw = this.offsetHeight;
  });
};

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
      $("td:eq(0)", row).html(
        "<code>" +
          data["ip"] +
          '</code><input id="id" type="hidden" value="' +
          data["id"] +
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
        sel.redraw();
      }
      // Select assigned groups
      sel.val(data.groups);
      // Initialize multiselect
      sel.multiselect({ includeSelectAllOption: true });

      let button =
        '<button class="btn btn-success btn-xs editClient" type="button" data-id=\'' +
        data["id"] +
        "'>" +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        "</button>" +
        " &nbsp;" +
        '<button class="btn btn-danger btn-xs deleteClient" type="button" data-id=\'' +
        data["id"] +
        "'>" +
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
      data["start"] = 0;
      // Always start with empty search field
      data["search"]["search"] = "";
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

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_client", ip: ip, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success");
        reload_client_suggestions();
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "Error while adding new client");
      console.log(exception);
    }
  });
}

function editClient() {
  var tr = $(this).closest("tr");
  var id = tr.find("#id").val();
  var groups = tr.find("#multiselect").val();

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "edit_client", id: id, groups: groups, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success");
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "Error while editing client with ID " + id);
      console.log(exception);
    }
  });
}

function deleteClient() {
  var id = $(this).attr("data-id");

  showAlert("info");
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_client", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success");
        reload_client_suggestions();
        table.ajax.reload();
      } else showAlert("error", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "Error while deleting client with ID " + id);
      console.log(exception);
    }
  });
}
