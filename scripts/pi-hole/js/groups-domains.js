var table;
var groups = [];
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
    $("#ip-custom").prop(
      "disabled",
      $("#select option:selected").val() !== "custom"
    );
  });
});

function initTable() {
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_domains", token: token },
      type: "POST"
    },
    order: [[1, "asc"]],
    columns: [
      { data: "domain" },
      { data: "type", searchable: false },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function(settings) {
      $(".editDomain").on("click", editDomain);
      $(".deleteDomain").on("click", deleteDomain);
    },
    rowCallback: function(row, data) {
      const tooltip =
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

      const disabled = data.enabled === 0;
      $("td:eq(2)", row).html(
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

      $("td:eq(3)", row).html(
        '<input id="comment" class="form-control"><input id="id" type="hidden" value="' +
          data.id +
          '">'
      );
      $("#comment", row).val(data.comment);

      $("td:eq(4)", row).empty();
      $("td:eq(4)", row).append(
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
        '<button class="btn btn-success btn-xs editDomain" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-pencil"></span>' +
        "</button>" +
        " &nbsp;" +
        '<button class="btn btn-danger btn-xs deleteDomain" type="button" data-id="' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
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
    stateLoadCallback: function(settings) {
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
      // Apply loaded state to table
      return data;
    }
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
        showAlert(
          "success",
          "glyphicon glyphicon-plus",
          "Successfully added domain",
          domain
        );
        $("#new_domain").val("");
        $("#new_comment").val("");
        table.ajax.reload();
      } else
        showAlert(
          "error",
          "",
          "Error while adding new domain",
          response.message
        );
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while adding new domain",
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function editDomain() {
  var tr = $(this).closest("tr");
  var domain = tr.find("#domain").text();
  var id = tr.find("#id").val();
  var type = tr.find("#type").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var comment = tr.find("#comment").val();
  var groups = tr.find("#multiselect").val();

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
        showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "Successfully edited domain",
          domain
        );
        table.ajax.reload();
      } else
        showAlert(
          "error",
          "",
          "Error while editing domain with ID " + id,
          response.message
        );
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while editing domain with ID " + id,
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
        showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "Successfully deleted domain",
          domain
        );
        table.ajax.reload();
      } else
        showAlert(
          "error",
          "",
          "Error while deleting domain with ID " + id,
          response.message
        );
    },
    error: function(jqXHR, exception) {
      showAlert(
        "error",
        "",
        "Error while deleting domain with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}
