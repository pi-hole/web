/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, group_utils: false */

var table;

$(function () {
  $("#btnAdd").on("click", addClient);

  utils.setBsSelectDefaults();
  group_utils.getGroups(initTable);
});

function initTable(groups) {
  table = $("#clientsTable").DataTable({
    ajax: {
      url: "/api/clients",
      dataSrc: "clients"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "ip", type: "ip-address" },
      { data: "comment" },
      { data: "groups[, ]", searchable: false },
      { data: null, width: "80px", orderable: false }
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
        utils.datetime(data.date_added, false) +
        "\nLast modified: " +
        utils.datetime(data.date_modified, false) +
        "\nDatabase ID: " +
        data.id;
      var ipName =
        '<code id="ip_' +
        data.id +
        '" title="' +
        tooltip +
        '" class="breakall">' +
        data.ip +
        "</code>";
      if (data.name !== null && data.name.length > 0)
        ipName +=
          '<br><code id="name_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          data.name +
          "</code>";
      $("td:eq(0)", row).html(ipName);

      $("td:eq(1)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(utils.unescapeHtml(data.comment));
      commentEl.on("change", editClient);

      $("td:eq(2)", row).empty();
      $("td:eq(2)", row).append(
        '<select class="selectpicker" id="multiselect_' + data.id + '" multiple></select>'
      );
      var selectEl = $("#multiselect_" + data.id, row);
      // Add all known groups
      for (var i = 0; i < groups.length; i++) {
        var dataSub = "";
        if (!groups[i].enabled) {
          dataSub = 'data-subtext="(disabled)"';
        }

        selectEl.append(
          $("<option " + dataSub + "/>")
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
          if ($(applyBtn).prop("disabled")) {
            $(applyBtn)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", function () {
                editClient.call(selectEl);
              });
          }
        })
        .on("hide.bs.select", function () {
          // Restore values if drop-down menu is closed without clicking the Apply button
          if (!$(applyBtn).prop("disabled")) {
            $(this).val(data.groups).selectpicker("refresh");
            $(applyBtn).removeClass("btn-success").prop("disabled", true).off("click");
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

      var applyBtn = "#btn_apply_" + data.id;

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
      utils.stateSaveCallback("groups-clients-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("groups-clients-table");

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
}

function addClient() {
  var clientEl = $("#new_client");
  var client = utils.escapeHtml(clientEl.val().trim());
  var commentEl = $("#new_comment");
  var comment = utils.escapeHtml(commentEl.val().trim());

  if (client.length === 0) {
    utils.showAlert("warning", "", "Warning", "Please specify a client IP or MAC address");
    return;
  }

  // Validate input, can be:
  // - IPv4 address (with and without CIDR)
  // - IPv6 address (with and without CIDR)
  // - MAC address (in the form AA:BB:CC:DD:EE:FF)
  // - host name (arbitrary form, we're only checking against some reserved charaters)
  if (utils.validateIPv4CIDR(client) || utils.validateIPv6CIDR(client)) {
    // Convert input to lower case
    client = client.toLowerCase();
  } else if (utils.validateMAC(client)) {
    // Convert input to upper case
    client = client.toUpperCase();
  } else if (!utils.validateHostname(client)) {
    utils.showAlert(
      "warning",
      "",
      "Warning",
      "Input is neither a valid IP or MAC address nor a valid host name!"
    );
    return;
  }

  var data = JSON.stringify({
    item: client,
    comment: comment
  });

  var url = "/api/clients/";
  group_utils.addEntry(url, client, "client", data, function () {
    clientEl.val("");
    commentEl.val("");
    group_utils.reload(table);
  });
}

function editClient() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var ip = utils.escapeHtml(tr.find("#ip_" + id).text());
  var name = utils.escapeHtml(tr.find("#name_" + id).text());
  var comment = utils.escapeHtml(tr.find("#comment_" + id).val());
  var groups = tr
    .find("#multiselect_" + id)
    .val()
    .map(function (val) {
      return parseInt(val, 10);
    });

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "multiselect_" + id:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    case "comment_" + id:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  var displayName = ip;
  if (name.length > 0) {
    displayName += " (" + name + ")";
  }

  var data = JSON.stringify({
    comment: comment,
    groups: groups
  });

  var url = "/api/clients/" + encodeURIComponent(ip);
  group_utils.editEntry(url, displayName, "client", data, done, notDone, function () {
    group_utils.reload(table);
  });
}

function deleteClient() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var ip = tr.find("#ip_" + id).text();
  var name = utils.escapeHtml(tr.find("#name_" + id).text());

  var displayName = ip;
  if (name.length > 0) {
    displayName += " (" + name + ")";
  }

  var url = "/api/clients/" + encodeURIComponent(ip);
  group_utils.delEntry(url, displayName, "client", function () {
    group_utils.reload(table);
  });
}
