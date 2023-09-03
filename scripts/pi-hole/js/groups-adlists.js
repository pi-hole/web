/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, apiFailure:false, updateFtlInfo:false, getGroups:false */

var table;
var GETDict = {};

$(function () {
  GETDict = utils.parseQueryString();

  $("#btnAddAllow").on("click", { type: "allow" }, addAdlist);
  $("#btnAddBlock").on("click", { type: "block" }, addAdlist);

  utils.setBsSelectDefaults();
  initTable();
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

  // Compile extra info for displaying
  return (
    "<table>" +
    '<tr class="dataTables-child"><td>Type of this list:</td><td>' +
    data.type +
    'list</td><tr class="dataTables-child"><td>Health status of this list:</td><td>' +
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
        utils.datetime(data.date_updated, false) +
        ")"
      : "N/A") +
    '</td></tr><tr class="dataTables-child"><td>Number of entries on this list:&nbsp;&nbsp;</td><td>' +
    (data.number !== null && numbers === true
      ? parseInt(data.number, 10).toLocaleString()
      : "N/A") +
    (data.abp_entries !== null && parseInt(data.abp_entries, 10) > 0 && numbers === true
      ? " (out of which " + parseInt(data.abp_entries, 10).toLocaleString() + " are in ABP-style)"
      : "N/A") +
    '</td></tr><tr class="dataTables-child"' +
    "><td>Number of non-domains on this list:&nbsp;&nbsp;</td>" +
    "<td>" +
    (data.invalid_domains !== null && numbers === true
      ? parseInt(data.invalid_domains, 10).toLocaleString()
      : "N/A") +
    '</td></tr><tr class="dataTables-child"><td>Database ID of this list:</td><td>' +
    data.id +
    "</td></tr></table>"
  );
}

function initTable() {
  table = $("#adlistsTable")
    .on("preXhr.dt", function () {
      getGroups();
    })
    .DataTable({
      processing: true,
      ajax: {
        url: "/api/lists",
        dataSrc: "lists",
        type: "GET",
      },
      order: [[0, "asc"]],
      columns: [
        { data: "id", visible: false },
        { data: null, visible: true, orderable: false, width: "15px" },
        { data: "status", searchable: false, class: "details-control" },
        { data: "address" },
        { data: "enabled", searchable: false },
        { data: "comment" },
        { data: "groups", searchable: false },
        { data: null, width: "22px", orderable: false },
      ],
      columnDefs: [
        {
          targets: 1,
          className: "select-checkbox",
          render: function () {
            return "";
          },
        },
        {
          targets: "_all",
          render: $.fn.dataTable.render.text(),
        },
      ],
      drawCallback: function () {
        // Hide buttons if all adlists were deleted
        var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
        $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

        $('button[id^="deleteAdlist_"]').on("click", deleteAdlist);
        // Remove visible dropdown to prevent orphaning
        $("body > .bootstrap-select.dropdown").remove();
      },
      rowCallback: function (row, data) {
        var dataId = utils.hexEncode(data.address);
        $(row).attr("data-id", dataId);

        var statusCode = 0,
          statusIcon;
        // If there is no status or the list is disabled, we keep
        // status 0 (== unknown)
        if (data.status !== null && data.enabled) {
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
          default:
            statusIcon = "fa-question-circle";
            break;
        }

        // Add red minus sign icon if data["type"] is "block"
        // Add green plus sign icon if data["type"] is "allow"
        let status =
          "<i class='fa fa-fw fa-question-circle text-orange' title='This list is of unknown type'></i>";
        if (data.type === "block") {
          status = "<i class='fa fa-fw fa-minus text-red' title='This is a blocklist'></i>";
        } else if (data.type === "allow") {
          status = "<i class='fa fa-fw fa-plus text-green' title='This is an allowlist'></i>";
        }

        $("td:eq(1)", row).addClass("list-status-" + statusCode);
        $("td:eq(1)", row).html(
          "<i class='fa fa-fw " +
            statusIcon +
            "' title='Click for details about this list'></i>" +
            status
        );

        if (data.address.startsWith("file://")) {
          // Local files cannot be downloaded from a distant client so don't show
          // a link to such a list here
          $("td:eq(2)", row).html(
            '<code id="address_' + dataId + '" class="breakall">' + data.address + "</code>"
          );
        } else {
          $("td:eq(2)", row).html(
            '<a id="address_' +
              dataId +
              '" class="breakall" href="' +
              data.address +
              '" target="_blank" rel="noopener noreferrer">' +
              data.address +
              "</a>"
          );
        }

        $("td:eq(3)", row).html(
          '<input type="checkbox" id="enabled_' +
            dataId +
            '"' +
            (data.enabled ? " checked" : "") +
            ">"
        );
        var statusEl = $("#enabled_" + dataId, row);
        statusEl.bootstrapToggle({
          on: "Enabled",
          off: "Disabled",
          size: "small",
          onstyle: "success",
          width: "80px",
        });
        statusEl.on("change", editAdlist);

        $("td:eq(4)", row).html('<input id="comment_' + dataId + '" class="form-control">');
        var commentEl = $("#comment_" + dataId, row);
        commentEl.val(utils.unescapeHtml(data.comment));
        commentEl.on("change", editAdlist);

        $("td:eq(5)", row).empty();
        $("td:eq(5)", row).append(
          '<select class="selectpicker" id="multiselect_' + dataId + '" multiple></select>'
        );
        var selectEl = $("#multiselect_" + dataId, row);
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
              dataId +
              ' class="btn btn-block btn-sm" disabled>Apply</button>'
          );

        var applyBtn = "#btn_apply_" + dataId;

        // Highlight row (if url parameter "adlistid=" is used)
        if ("adlistid" in GETDict && data.id === parseInt(GETDict.adlistid, 10)) {
          $(row).find("td").addClass("highlight");
        }

        var button =
          '<button type="button" class="btn btn-danger btn-xs" id="deleteAdlist_' +
          dataId +
          '" data-id="' +
          dataId +
          '">' +
          '<span class="far fa-trash-alt"></span>' +
          "</button>";
        $("td:eq(6)", row).html(button);
      },
      dom:
        "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
        "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
        "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
        "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
        "<'row'<'col-sm-12'i>>",
      lengthMenu: [
        [10, 25, 50, 100, -1],
        [10, 25, 50, 100, "All"],
      ],
      select: {
        style: "multi",
        selector: "td:not(:last-child)",
        info: false,
      },
      buttons: [
        {
          text: '<span class="far fa-square"></span>',
          titleAttr: "Select All",
          className: "btn-sm datatable-bt selectAll",
          action: function () {
            table.rows({ page: "current" }).select();
          },
        },
        {
          text: '<span class="far fa-plus-square"></span>',
          titleAttr: "Select All",
          className: "btn-sm datatable-bt selectMore",
          action: function () {
            table.rows({ page: "current" }).select();
          },
        },
        {
          extend: "selectNone",
          text: '<span class="far fa-check-square"></span>',
          titleAttr: "Deselect All",
          className: "btn-sm datatable-bt removeAll",
        },
        {
          text: '<span class="far fa-trash-alt"></span>',
          titleAttr: "Delete Selected",
          className: "btn-sm datatable-bt deleteSelected",
          action: function () {
            // For each ".selected" row ...
            var ids = [];
            $("tr.selected").each(function () {
              // ... add the row identified by "data-id".
              ids.push($(this).attr("data-id"), 10);
            });
            // Delete all selected rows at once
            delItems(ids);
          },
        },
      ],
      stateSave: true,
      stateDuration: 0,
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
      },
      initComplete: function () {
        if ("adlistid" in GETDict) {
          var pos = table
            .column(0, { order: "current" })
            .data()
            .indexOf(parseInt(GETDict.adlistid, 10));
          if (pos >= 0) {
            var page = Math.floor(pos / table.page.info().length);
            table.page(page).draw(false);
          }
        }
      },
    });

  table.on("init select deselect", function () {
    utils.changeBulkDeleteStates(table);
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

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteAdlist() {
  // Passes the button data-id attribute as ID
  const ids = [$(this).attr("data-id")];
  delItems(ids);
}

function delItems(ids) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  // Get first element from array
  const addressRaw = ids[0];
  const address = utils.hexDecode(addressRaw);

  // Remove first element from array
  ids.shift();

  utils.disableAll();
  const idstring = ids.join(", ");
  utils.showAlert("info", "", "Deleting adlist(s) ...", "<ul>" + address + "</ul>");

  $.ajax({
    url: "/api/lists/" + encodeURIComponent(address),
    method: "delete",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted list: ", address);
      table.row(addressRaw).remove().draw(false);
      if (ids.length > 0) {
        // Recursively delete all remaining items
        delItems(ids);
        return;
      }

      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeBulkDeleteStates(table);

      // Update number of lists in the sidebar
      updateFtlInfo();
    })
    .fail(function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting list(s): " + idstring, data.responseText);
      console.log(exception); // eslint-disable-line no-console
    });
}

function addAdlist(event) {
  const type = event.data.type;
  const address = utils.escapeHtml($("#new_address").val());
  const comment = utils.escapeHtml($("#new_comment").val());

  utils.disableAll();
  utils.showAlert("info", "", "Adding subscribed " + type + "list...", address);

  if (address.length === 0) {
    // enable the ui elements again
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify " + type + "list address");
    return;
  }

  $.ajax({
    url: "/api/lists",
    method: "post",
    dataType: "json",
    data: JSON.stringify({ address: address, comment: comment, type: type }),
    success: function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully added " + type + "list", address);
      table.ajax.reload(null, false);
      table.rows().deselect();

      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new " + type + "list", data.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editAdlist() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const address = tr.attr("data-id");
  const status = tr.find("#enabled_" + address).is(":checked");
  const comment = utils.escapeHtml(tr.find("#comment_" + address).val());
  // Convert list of string integers to list of integers using map(Number)
  const groups = tr
    .find("#multiselect_" + address)
    .val()
    .map(Number);
  const enabled = tr.find("#enabled_" + address).is(":checked");

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "enabled_" + address:
      if (status) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "comment_" + address:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "multiselect_" + address:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element (" + elem + ") or invalid data-id!");
      return;
  }

  utils.disableAll();
  const addressDecoded = utils.hexDecode(address);
  utils.showAlert("info", "", "Editing address...", addressDecoded);
  $.ajax({
    url: "/api/lists/" + encodeURIComponent(addressDecoded),
    method: "put",
    dataType: "json",
    data: JSON.stringify({
      groups: groups,
      comment: comment,
      enabled: enabled,
    }),
    success: function () {
      utils.enableAll();
      utils.showAlert(
        "success",
        "fas fa-pencil-alt",
        "Successfully " + done + " list",
        addressDecoded
      );
      table.ajax.reload(null, false);
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + " list " + addressDecoded,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
