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

function getGroups() {
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

$(function () {
  $("#btnAdd").on("click", addAdlist);

  utils.setBsSelectDefaults();
  getGroups();
});

function format(data) {
  // Generate human-friendly status string
  var statusText = "Unknown";
  var numbers = true;
  if (data.status !== null) {
    switch (parseInt(data.status, 10)) {
      case 0:
        statusText =
          data.enabled === 0
            ? "List is disabled and not checked"
            : "List was not downloaded so far";
        numbers = false;
        break;
      case 1:
        statusText = 'List download was successful (<span class="list-status-1">OK</span>)';
        break;
      case 2:
        statusText =
          'List unchanged upstream, Pi-hole used a local copy (<span class="list-status-2">OK</span>)';
        break;
      case 3:
        statusText =
          'List unavailable, Pi-hole used a local copy (<span class="list-status-3">check list</span>)';
        break;
      case 4:
        statusText =
          'List unavailable, there is no local copy of this list available on your Pi-hole (<span class="list-status-4">replace list</span>)';
        numbers = false;
        break;

      default:
        statusText =
          'Unknown (<span class="list-status-0">' + parseInt(data.status, 10) + "</span>)";
        break;
    }
  }

  var invalidStyle =
    data.invalid_domains !== null && data.invalid_domains > 0 && numbers === true
      ? ' style="color:red; font-weight:bold;"'
      : "";

  // Compile extra info for displaying
  return (
    "<table>" +
    '<tr class="dataTables-child"><td>Health status of this list:</td><td>' +
    statusText +
    '</td></tr><tr class="dataTables-child"><td>This list was added to Pi-hole&nbsp;&nbsp;</td><td>' +
    utils.datetimeRelative(data.date_added) +
    "&nbsp;(" +
    utils.datetime(data.date_added, false) +
    ')</td></tr><tr class="dataTables-child"><td>Database entry was last modified&nbsp;&nbsp;</td><td>' +
    utils.datetimeRelative(data.date_modified) +
    "&nbsp;(" +
    utils.datetime(data.date_modified, false) +
    ')</td></tr><tr class="dataTables-child"><td>The list contents were last updated&nbsp;&nbsp;</td><td>' +
    (data.date_updated > 0
      ? utils.datetimeRelative(data.date_updated) +
        "&nbsp;(" +
        utils.datetime(data.date_updated) +
        ")"
      : "N/A") +
    '</td></tr><tr class="dataTables-child"><td>Number of valid domains on this list:&nbsp;&nbsp;</td><td>' +
    (data.number !== null && numbers === true ? parseInt(data.number, 10) : "N/A") +
    '</td></tr><tr class="dataTables-child"' +
    invalidStyle +
    "><td>Number of invalid domains on this list:&nbsp;&nbsp;</td>" +
    "<td>" +
    (data.invalid_domains !== null && numbers === true
      ? parseInt(data.invalid_domains, 10)
      : "N/A") +
    '</td></tr><tr class="dataTables-child"><td>Database ID of this list:</td><td>' +
    data.id +
    "</td></tr></table>"
  );
}

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
      { data: "status", searchable: false, class: "details-control" },
      { data: "address" },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function () {
      $('button[id^="deleteAdlist_"]').on("click", deleteAdlist);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);

      var disabled = data.enabled === 0;
      var statusCode = 0,
        statusIcon;
      // If there is no status or the list is disabled, we keep
      // status 0 (== unknown)
      if (data.status !== null && disabled !== true) {
        statusCode = parseInt(data.status, 10);
      }

      switch (statusCode) {
        case 1:
          statusIcon = "fa-check";
          break;
        case 2:
          statusIcon = "fa-history";
          break;
        case 3:
          statusIcon = "fa-exclamation-circle";
          break;
        case 4:
          statusIcon = "fa-times";
          break;
        case 0:
        default:
          statusIcon = "fa-question-circle";
          break;
      }

      // Append red exclamation-triangle when there are invalid lines on the list
      var extra = "";
      if (data.invalid_domains !== null && data.invalid_domains > 0) {
        extra = "<i class='fa fa-exclamation-triangle list-status-3'></i>";
      }

      $("td:eq(0)", row).addClass("list-status-" + statusCode);
      $("td:eq(0)", row).html(
        "<i class='fa " + statusIcon + "' title='Click for details about this list'></i>" + extra
      );

      if (data.address.startsWith("file://")) {
        // Local files cannot be downloaded from a distant client so don't show
        // a link to such a list here
        $("td:eq(1)", row).html(
          '<code id="address_' + data.id + '" class="breakall">' + data.address + "</code>"
        );
      } else {
        $("td:eq(1)", row).html(
          '<a id="address_' +
            data.id +
            '" class="breakall" href="' +
            data.address +
            '" target="_blank" rel="noopener noreferrer">' +
            data.address +
            "</a>"
        );
      }

      $("td:eq(2)", row).html(
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
      statusEl.on("change", editAdlist);

      $("td:eq(3)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(utils.unescapeHtml(data.comment));
      commentEl.on("change", editAdlist);

      $("td:eq(4)", row).empty();
      $("td:eq(4)", row).append(
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
                editAdlist.call(selectEl);
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
        '<button type="button" class="btn btn-danger btn-xs" id="deleteAdlist_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(5)", row).html(button);
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
      utils.stateSaveCallback("groups-adlists-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("groups-adlists-table");

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

  // Add event listener for opening and closing details
  $("#adlistsTable tbody").on("click", "td.details-control", function () {
    var tr = $(this).closest("tr");
    var row = table.row(tr);

    if (row.child.isShown()) {
      // This row is already open - close it
      row.child.hide();
      tr.removeClass("shown");
    } else {
      // Open this row
      row.child(format(row.data())).show();
      tr.addClass("shown");
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
}

function addAdlist() {
  var address = utils.escapeHtml($("#new_address").val());
  var comment = utils.escapeHtml($("#new_comment").val());

  utils.disableAll();
  utils.showAlert("info", "", "Adding adlist...", address);

  if (address.length === 0) {
    // enable the ui elements again
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify an adlist address");
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
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "fas fa-plus", "Successfully added adlist", address);
        table.ajax.reload(null, false);
        $("#new_address").val("");
        $("#new_comment").val("");
        table.ajax.reload();
      } else {
        utils.showAlert("error", "", "Error while adding new adlist: ", response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new adlist: ", jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    }
  });
}

function editAdlist() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var status = tr.find("#status_" + id).is(":checked") ? 1 : 0;
  var comment = utils.escapeHtml(tr.find("#comment_" + id).val());
  var groups = tr.find("#multiselect_" + id).val();
  var address = utils.escapeHtml(tr.find("#address_" + id).text());

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "status_" + id:
      if (status === 0) {
        done = "disabled";
        notDone = "disabling";
      } else if (status === 1) {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "comment_" + id:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "multiselect_" + id:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing adlist...", address);

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
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "fas fa-pencil-alt",
          "Successfully " + done + " adlist ",
          address
        );
        table.ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while " + notDone + " adlist with ID " + id,
          Number(response.message)
        );
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + " adlist with ID " + id,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    }
  });
}

function deleteAdlist() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var address = utils.escapeHtml(tr.find("#address_" + id).text());

  utils.disableAll();
  utils.showAlert("info", "", "Deleting adlist...", address);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_adlist", id: id, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "far fa-trash-alt", "Successfully deleted adlist ", address);
        table.row(tr).remove().draw(false).ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while deleting adlist with ID " + id, response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting adlist with ID " + id, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    }
  });
}
