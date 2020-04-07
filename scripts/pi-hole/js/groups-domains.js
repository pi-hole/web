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
  $("#btnAdd").on("click", addDomain);

  get_groups();

  $("#select").on("change", function() {
    $("#ip-custom").val("");
    $("#ip-custom").prop("disabled", $("#select option:selected").val() !== "custom");
  });
  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);
});

function initTable() {
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_domains", token: token },
      type: "POST"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "domain" },
      { data: "type", searchable: false },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function() {
      $(".deleteDomain").on("click", deleteDomain);
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
        '<code id="domain" title="' + tooltip + '">' + data.domain + "</code>"
      );

      $("td:eq(1)", row).html(
        '<select id="type" class="form-control">' +
          '<option value="0"' +
          (data.type === 0 ? " selected" : "") +
          ">Exact whitelist</option>" +
          '<option value="1"' +
          (data.type === 1 ? " selected" : "") +
          ">Exact blacklist</option>" +
          '<option value="2"' +
          (data.type === 2 ? " selected" : "") +
          ">Regex whitelist</option>" +
          '<option value="3"' +
          (data.type === 3 ? " selected" : "") +
          ">Regex blacklist</option>" +
          "</select>"
      );
      $("#type", row).on("change", editDomain);

      var disabled = data.enabled === 0;
      $("td:eq(2)", row).html(
        '<input type="checkbox" id="status"' + (disabled ? "" : " checked") + ">"
      );
      $("#status", row).bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      $("#status", row).on("change", editDomain);

      $("td:eq(3)", row).html(
        '<input id="comment" class="form-control"><input id="id" type="hidden" value="' +
          data.id +
          '">'
      );
      $("#comment", row).val(data.comment);
      $("#comment", row).on("change", editDomain);

      $("td:eq(4)", row).empty();
      $("td:eq(4)", row).append('<select id="multiselect" multiple="multiple"></select>');
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
      sel.on("change", editDomain);

      var button =
        '<button class="btn btn-danger btn-xs deleteDomain" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(5)", row).html(button);
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-domains-table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-domains-table");
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

function addDomain() {
  var domain = $("#new_domain").val();
  var type = $("#new_type").val();
  var comment = $("#new_comment").val();

  showAlert("info", "", "Adding domain...", domain);

  if (domain.length === 0) {
    showAlert("warning", "", "Warning", "Please specify a domain");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "add_domain",
      domain: domain,
      type: type,
      comment: comment,
      token: token
    },
    success: function(response) {
      if (response.success) {
        showAlert("success", "fas fa-plus", "Successfully added domain", domain);
        $("#new_domain").val("");
        $("#new_comment").val("");
        table.ajax.reload();
      } else showAlert("error", "", "Error while adding new domain", response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "", "Error while adding new domain", jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editDomain() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var domain = tr.find("#domain").text();
  var id = tr.find("#id").val();
  var type = tr.find("#type").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var comment = tr.find("#comment").val();
  var groups = tr.find("#multiselect").val();

  var done = "edited";
  var not_done = "editing";
  if (elem === "status" && status === 1) {
    done = "enabled";
    not_done = "enabling";
  } else if (elem === "status" && status === 0) {
    done = "disabled";
    not_done = "disabling";
  } else if (elem === "name") {
    done = "edited name of";
    not_done = "editing name of";
  } else if (elem === "comment") {
    done = "edited comment of";
    not_done = "editing comment of";
  } else if (elem === "type") {
    done = "edited type of";
    not_done = "editing type of";
  } else if (elem === "multiselect") {
    done = "edited groups of";
    not_done = "editing groups of";
  }

  showAlert("info", "", "Editing domain...", name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_domain",
      id: id,
      type: type,
      comment: comment,
      status: status,
      groups: groups,
      token: token
    },
    success: function(response) {
      if (response.success) {
        showAlert("success", "fas fa-pencil-alt", "Successfully " + done + " domain", domain);
      } else
        showAlert(
          "error",
          "",
          "Error while " + not_done + " domain with ID " + id,
          response.message
        );
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while " + not_done + " domain with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteDomain() {
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var domain = tr.find("#domain").text();

  showAlert("info", "", "Deleting domain...", domain);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_domain", id: id, token: token },
    success: function(response) {
      if (response.success) {
        showAlert("success", "far fa-trash-alt", "Successfully deleted domain", domain);
        table
          .row(tr)
          .remove()
          .draw(false);
      } else showAlert("error", "", "Error while deleting domain with ID " + id, response.message);
    },
    error: function(jqXHR, exception) {
      showAlert("error", "", "Error while deleting domain with ID " + id, jqXHR.responseText);
      console.log(exception);
    }
  });
}
