/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false */

var table;
var groups = [];
var token = $("#token").text();
var info = null;

function showAlert(type, icon, title, message) {
  var opts = {};
  title = "&nbsp;<strong>" + title + "</strong><br>";
  switch (type) {
    case "info":
      opts = {
        type: "info",
        icon: "far fa-clock",
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
        icon: "fas fa-exclamation-triangle",
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
        icon: "fas fa-times",
        title: "&nbsp;<strong>Error, something went wrong!</strong><br>",
        message: message
      };
      if (info) {
        info.update(opts);
      } else {
        $.notify(opts);
      }

      break;
    default:
  }
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

function datetime(date) {
  return moment.unix(Math.floor(date)).format("Y-MM-DD HH:mm:ss z");
}

$(document).ready(function() {
  $("#btnAdd").on("click", addAdlist);

  get_groups();

  $("#select").on("change", function() {
    $("#ip-custom").val("");
    $("#ip-custom").prop("disabled", $("#select option:selected").val() !== "custom");
  });
});

function initTable() {
  table = $("#adlistsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_adlists", token: token },
      type: "POST"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "address" },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function() {
      $(".deleteAdlist").on("click", deleteAdlist);
    },
    rowCallback: function(row, data) {
      var tooltip =
        "Added: " +
        datetime(data.date_added) +
        "\nLast modified: " +
        datetime(data.date_modified) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(0)", row).html(
        '<code id="address" title="' + tooltip + '">' + data.address + "</code>"
      );

      var disabled = data.enabled === 0;
      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status"' + (disabled ? "" : " checked") + ">"
      );
      var status = $("#status", row);
      status.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      status.on("change", editAdlist);

      $("td:eq(2)", row).html(
        '<input id="comment" class="form-control"><input id="id" type="hidden" value="' +
          data.id +
          '">'
      );
      var comment = $("#comment", row);
      comment.val(data.comment);
      comment.on("change", editAdlist);

      $("td:eq(3)", row).empty();
      $("td:eq(3)", row).append('<select id="multiselect" multiple="multiple"></select>');
      var sel = $("#multiselect", row);
      // Add all known groups
      for (var i = 0; i < groups.length; i++) {
        var extra = "";
        if (!groups[i].enabled) {
          extra = " (disabled)";
        }

        sel.append(
          $("<option />")
            .val(groups[i].id)
            .text(groups[i].name + extra)
        );
      }

      // Select assigned groups
      sel.val(data.groups);
      // Initialize multiselect
      sel.multiselect({ includeSelectAllOption: true });
      sel.on("change", editAdlist);

      var button =
        '<button class="btn btn-danger btn-xs deleteAdlist" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(4)", row).html(button);
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-adlists-table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-adlists-table");
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
}

function addAdlist() {
  var address = $("#new_address").val();
  var comment = $("#new_comment").val();

  showAlert("info", "", "Adding adlist...", address);

  if (address.length === 0) {
    showAlert("warning", "", "Warning", "Please specify an adlist address");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "add_adlist",
      address: address,
      comment: comment,
      token: token
    },
    success: function(response) {
      if (response.success) {
        showAlert("success", "fas fa-plus", "Successfully added adlist", address);
        $("#new_address").val("");
        $("#new_comment").val("");
        table.ajax.reload();
      } else {
        showAlert("error", "", "Error while adding new adlist: ", response.message);
      }
    },
    error: function(jqXHR, exception) {
      showAlert("error", "", "Error while adding new adlist: ", jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editAdlist() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.find("#id").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var comment = tr.find("#comment").val();
  var groups = tr.find("#multiselect").val();
  var address = tr.find("#address").text();

  var done = "edited";
  var not_done = "editing";
  if (elem === "status" && status === 1) {
    done = "enabled";
    not_done = "enabling";
  } else if (elem === "status" && status === 0) {
    done = "disabled";
    not_done = "disabling";
  } else if (elem === "comment") {
    done = "edited comment of";
    not_done = "editing comment of";
  } else if (elem === "multiselect") {
    done = "edited groups of";
    not_done = "editing groups of";
  }

  showAlert("info", "", "Editing adlist...", address);

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_adlist",
      id: id,
      comment: comment,
      status: status,
      groups: groups,
      token: token
    },
    success: function(response) {
      if (response.success) {
        showAlert("success", "fas fa-pencil-alt", "Successfully " + done + " adlist ", address);
      } else {
        showAlert(
          "error",
          "",
          "Error while " + not_done + " adlist with ID " + id,
          Number(response.message)
        );
      }
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while " + not_done + " adlist with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteAdlist() {
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var address = tr.find("#address").text();

  showAlert("info", "", "Deleting adlist...", address);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_adlist", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success", "far fa-trash-alt", "Successfully deleted adlist ", address);
        table
          .row(tr)
          .remove()
          .draw(false);
      } else showAlert("error", "", "Error while deleting adlist with ID " + id, response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "", "Error while deleting adlist with ID " + id, jqXHR.responseText);
      console.log(exception);
    }
  });
}
