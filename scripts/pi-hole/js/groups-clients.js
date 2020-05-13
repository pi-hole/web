/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var groups = [];
var token = $("#token").text();

function reload_client_suggestions() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_unconfigured_clients", token: token },
    function (data) {
      var sel = $("#select");
      sel.empty();

      // In order for the placeholder value to appear, we have to have a blank
      // <option> as the first option in our <select> control. This is because
      // the browser tries to select the first option by default. If our first
      // option were non-empty, the browser would display this instead of the
      // placeholder.
      sel.append($("<option />"));

      // Add data obtained from API
      for (var key in data) {
        if (!Object.prototype.hasOwnProperty.call(data, key)) {
          continue;
        }

        var text = key,
          key_plain = key;
        if (key.startsWith("IP-")) {
          // Mock MAC address for address-only devices
          key_plain = key.substring(3);
          text = key_plain;
        }

        // Append host name if available
        if (data[key].length > 0) {
          text += " (" + data[key] + ")";
        }

        sel.append($("<option />").val(key_plain).text(text));
      }
    },
    "json"
  );
}

function get_groups() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_groups", token: token },
    function (data) {
      groups = data.data;
      initTable();
    },
    "json"
  );
}

$(document).ready(function () {
  $("#btnAdd").on("click", addClient);

  reload_client_suggestions();
  $("select").select2({
    tags: true,
    placeholder: "Select client...",
    allowClear: true
  });

  utils.bsSelect_defaults();
  get_groups();

  $("#select").on("change", function () {
    $("#ip-custom").val("");
    $("#ip-custom").prop("disabled", $("#select option:selected").val() !== "custom");
  });
});

function initTable() {
  table = $("#clientsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_clients", token: token },
      type: "POST"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "ip" },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: "name", width: "80px", orderable: false }
    ],
    drawCallback: function () {
      $('button[id^="deleteClient_"]').on("click", deleteClient);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added) +
        "\nLast modified: " +
        utils.datetime(data.date_modified) +
        "\nDatabase ID: " +
        data.id;
      var ip_name =
        '<code id="ip_' +
        data.id +
        '" title="' +
        tooltip +
        '" class="breakall">' +
        data.ip +
        "</code>";
      if (data.name !== null && data.name.length > 0)
        ip_name +=
          '<br><code id="name_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          data.name +
          "</code>";
      $("td:eq(0)", row).html(ip_name);

      $("td:eq(1)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(data.comment);
      commentEl.on("change", editClient);

      $("td:eq(2)", row).empty();
      $("td:eq(2)", row).append(
        '<select class="selectpicker" id="multiselect_' + data.id + '" multiple></select>'
      );
      var selectEl = $("#multiselect_" + data.id, row);
      // Add all known groups
      for (var i = 0; i < groups.length; i++) {
        var data_sub = "";
        if (!groups[i].enabled) {
          data_sub = 'data-subtext="(disabled)"';
        }

        selectEl.append(
          $("<option " + data_sub + "/>")
            .val(groups[i].id)
            .text(groups[i].name)
        );
      }

      // Select assigned groups
      selectEl.val(data.groups);
      // Initialize bootstrap-select
      selectEl
        // fix dropdown if it would stick out right of the viewport
        .on("show.bs.select", function () {
          var winWidth = $(window).width();
          var dropdownEl = $("body > .bootstrap-select.dropdown");
          if (dropdownEl.length > 0) {
            dropdownEl.removeClass("align-right");
            var width = dropdownEl.width();
            var left = dropdownEl.offset().left;
            if (left + width > winWidth) {
              dropdownEl.addClass("align-right");
            }
          }
        })
        .on("changed.bs.select", function () {
          // enable Apply button
          if ($(ApplyBtn).prop("disabled")) {
            $(ApplyBtn)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", function () {
                editClient.call(selectEl);
              });
          }
        })
        .on("hide.bs.select", function () {
          // Restore values if drop-down menu is closed without clicking the Apply button
          if (!$(ApplyBtn).prop("disabled")) {
            $(this).val(data.groups).selectpicker("refresh");
            $(ApplyBtn).removeClass("btn-success").prop("disabled", true).off("click");
          }
        })
        .selectpicker()
        .siblings(".dropdown-menu")
        .find(".bs-actionsbox")
        .prepend(
          '<button type="button" id=btn_apply_' +
            data.id +
            ' class="btn btn-block btn-sm" disabled>Apply</button>'
        );

      var ApplyBtn = "#btn_apply_" + data.id;

      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteClient_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(3)", row).html(button);
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
      // Store current state in client's local storage area
      localStorage.setItem("groups-clients-table", JSON.stringify(data));
    },
    stateLoadCallback: function () {
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
      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    }
  });

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);

  table.on("order.dt", function () {
    var order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").show();
    } else {
      $("#resetButton").hide();
    }
  });
  $("#resetButton").on("click", function () {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").hide();
  });
}

function addClient() {
  var ip = $("#select").val();
  var comment = $("#new_comment").val();

  utils.disableAll();
  utils.showAlert("info", "", "Adding client...", ip);

  if (ip.length === 0) {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a client IP or MAC address");
    return;
  }

  // Convert input to upper case (important for MAC addresses)
  ip = ip.toUpperCase();

  // Validate input, can be:
  // - IPv4 address (with and without CIDR)
  // - IPv6 address (with and without CIDR)
  // - MAC address (in the form AA:BB:CC:DD:EE:FF)
  if (!utils.validateIPv4CIDR(ip) && !utils.validateIPv6CIDR(ip) && !utils.validateMAC(ip)) {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Input is neither an IP nor a MAC address!");
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "add_client", ip: ip, comment: comment, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "fas fa-plus", "Successfully added client", ip);
        reload_client_suggestions();
        table.ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while adding new client", response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new client", jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editClient() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var groups = tr.find("#multiselect_" + id).val();
  var ip = tr.find("#ip_" + id).text();
  var name = tr.find("#name_" + id).text();
  var comment = tr.find("#comment_" + id).val();

  var done = "edited";
  var not_done = "editing";
  switch (elem) {
    case "multiselect_" + id:
      done = "edited groups of";
      not_done = "editing groups of";
      break;
    case "comment_" + id:
      done = "edited comment of";
      not_done = "editing comment of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  var ip_name = ip;
  if (name.length > 0) {
    ip_name += " (" + name + ")";
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing client...", ip_name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_client",
      id: id,
      groups: groups,
      token: token,
      comment: comment
    },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "Successfully " + done + " client",
          ip_name
        );
        table.ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "Error while " + not_done + " client with ID " + id,
          response.message
        );
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + not_done + " client with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteClient() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var ip = tr.find("#ip_" + id).text();
  var name = tr.find("#name_" + id).text();

  var ip_name = ip;
  if (name.length > 0) {
    ip_name += " (" + name + ")";
  }

  utils.disableAll();
  utils.showAlert("info", "", "Deleting client...", ip_name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_client", id: id, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "Successfully deleted client ",
          ip_name
        );
        table.row(tr).remove().draw(false).ajax.reload(null, false);
        reload_client_suggestions();
      } else {
        utils.showAlert("error", "", "Error while deleting client with ID " + id, response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting client with ID " + id, jqXHR.responseText);
      console.log(exception);
    }
  });
}
