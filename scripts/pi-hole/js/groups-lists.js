/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, apiFailure:false, updateFtlInfo:false, getGroups:false, processGroupResult:false, delGroupItems:false */
/* exported initTable */

var table;
var GETDict = {};

$(function () {
  GETDict = utils.parseQueryString();

  $("#btnAddAllow").on("click", { type: "allow" }, addList);
  $("#btnAddBlock").on("click", { type: "block" }, addList);

  utils.setBsSelectDefaults();
  getGroups();
});

function format(data) {
  // Generate human-friendly status string
  var statusText = setStatusText(data, true);
  var numbers = true;
  if (data.status === 0 || data.status === 4) {
    numbers = false;
  }

  // Compile extra info for displaying
  var dateAddedISO = utils.datetime(data.date_added, false),
    dateModifiedISO = utils.datetime(data.date_modified, false),
    dateUpdated =
      data.date_updated > 0
        ? utils.datetimeRelative(data.date_updated) +
          "&nbsp;(" +
          utils.datetime(data.date_updated, false) +
          ")"
        : "N/A",
    numberOfEntries =
      (data.number !== null && numbers === true
        ? parseInt(data.number, 10).toLocaleString()
        : "N/A") +
      (data.abp_entries !== null && parseInt(data.abp_entries, 10) > 0 && numbers === true
        ? " (out of which " + parseInt(data.abp_entries, 10).toLocaleString() + " are in ABP-style)"
        : ""),
    nonDomains =
      data.invalid_domains !== null && numbers === true
        ? parseInt(data.invalid_domains, 10).toLocaleString()
        : "N/A";

  return `<table>
      <tr class="dataTables-child">
        <td>Type of this list:</td><td>${setTypeIcon(data.type)}${data.type}list</td>
      </tr>
      <tr class="dataTables-child">
        <td>Health status of this list:</td><td>${statusText}</td>
      </tr>
      <tr class="dataTables-child">
        <td>This list was added to Pi-hole&nbsp;&nbsp;</td>
        <td>${utils.datetimeRelative(data.date_added)}&nbsp;(${dateAddedISO})</td>
      </tr>
      <tr class="dataTables-child">
        <td>Database entry was last modified&nbsp;&nbsp;</td>
        <td>${utils.datetimeRelative(data.date_modified)}&nbsp;(${dateModifiedISO})</td>
      </tr>
      <tr class="dataTables-child">
        <td>The list contents were last updated&nbsp;&nbsp;</td><td>${dateUpdated}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Number of entries on this list:&nbsp;&nbsp;</td><td>${numberOfEntries}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Number of non-domains on this list:&nbsp;&nbsp;</td><td>${nonDomains}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Database ID of this list:</td><td>${data.id}</td>
      </tr>
    </table>`;
}

// Define the status icon element
function setStatusIcon(data) {
  var statusCode = parseInt(data.status, 10),
    statusTitle = setStatusText(data) + "\nClick for details about this list",
    statusIcon;

  switch (statusCode) {
    case 1:
      statusIcon = "fa-check-circle";
      break;
    case 2:
      statusIcon = "fa-history";
      break;
    case 3:
      statusIcon = "fa-exclamation-circle";
      break;
    case 4:
      statusIcon = "fa-times-circle";
      break;
    default:
      statusIcon = "fa-question-circle";
      break;
  }

  return "<i class='fa fa-fw " + statusIcon + "' title='" + statusTitle + "'></i>";
}

// Define human-friendly status string
function setStatusText(data, showdetails = false) {
  var statusText = "Unknown",
    statusDetails = "";
  if (data.status !== null) {
    switch (parseInt(data.status, 10)) {
      case 0:
        statusText =
          data.enabled === 0
            ? "List is disabled and not checked"
            : "List was not downloaded so far";
        break;
      case 1:
        statusText = "List download was successful";
        statusDetails = ' (<span class="list-status-1">OK</span>)';
        break;
      case 2:
        statusText = "List unchanged upstream, Pi-hole used a local copy";
        statusDetails = ' (<span class="list-status-2">OK</span>)';
        break;
      case 3:
        statusText = "List unavailable, Pi-hole used a local copy";
        statusDetails = ' (<span class="list-status-3">check list</span>)';
        break;
      case 4:
        statusText =
          "List unavailable, there is no local copy of this list available on your Pi-hole";
        statusDetails = ' (<span class="list-status-4">replace list</span>)';
        break;

      default:
        statusText = "Unknown";
        statusDetails = ' (<span class="list-status-0">' + parseInt(data.status, 10) + "</span>)";
        break;
    }
  }

  return statusText + (showdetails === true ? statusDetails : "");
}

// Define the type icon element
function setTypeIcon(type) {
  //Add red ban icon if data["type"] is "block"
  //Add green check icon if data["type"] is "allow"
  let iconClass = "fa-question text-orange",
    title = "This list is of unknown type";
  if (type === "block") {
    iconClass = "fa-ban text-red";
    title = "This is a blocklist";
  } else if (type === "allow") {
    iconClass = "fa-check text-green";
    title = "This is an allowlist";
  }

  return `<i class='fa fa-fw ${iconClass}' title='${title}\nClick for details about this list'></i> `;
}

// eslint-disable-next-line no-unused-vars
function initTable() {
  table = $("#listsTable").DataTable({
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
      { data: "type", searchable: false, class: "details-control" },
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
      // Hide buttons if all lists were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      $('button[id^="deleteList_"]').on("click", deleteList);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      var dataId = utils.hexEncode(data.address + "_" + data.type);
      $(row).attr("data-id", dataId);
      $(row).attr("data-address", utils.hexEncode(data.address));
      $(row).attr("data-type", data.type);

      var statusCode = 0;
      // If there is no status or the list is disabled, we keep
      // status 0 (== unknown)
      if (data.status !== null && data.enabled) {
        statusCode = parseInt(data.status, 10);
      }

      $("td:eq(1)", row).addClass("list-status-" + statusCode);
      $("td:eq(1)", row).html(setStatusIcon(data));

      $("td:eq(2)", row).addClass("list-type-" + statusCode);
      $("td:eq(2)", row).html(setTypeIcon(data.type));

      if (data.address.startsWith("file://")) {
        // Local files cannot be downloaded from a distant client so don't show
        // a link to such a list here
        $("td:eq(3)", row).html(
          '<code id="address_' +
            dataId +
            '" class="breakall">' +
            utils.escapeHtml(data.address) +
            "</code>"
        );
      } else {
        $("td:eq(3)", row).html(
          '<a id="address_' +
            dataId +
            '" class="breakall" href="' +
            encodeURI(data.address) +
            '" target="_blank" rel="noopener noreferrer">' +
            utils.escapeHtml(data.address) +
            "</a>"
        );
      }

      $("td:eq(4)", row).html(
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
      statusEl.on("change", editList);

      $("td:eq(5)", row).html('<input id="comment_' + dataId + '" class="form-control">');
      var commentEl = $("#comment_" + dataId, row);
      commentEl.val(data.comment);
      commentEl.on("change", editList);

      $("td:eq(6)", row).empty();
      $("td:eq(6)", row).append(
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

      var applyBtn = "#btn_apply_" + dataId;

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
                editList.call(selectEl);
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

      // Highlight row (if url parameter "listid=" is used)
      if ("listid" in GETDict && data.id === parseInt(GETDict.listid, 10)) {
        $(row).find("td").addClass("highlight");
      }

      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteList_' +
        dataId +
        '" data-id="' +
        dataId +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(7)", row).html(button);
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
            ids.push({ item: $(this).attr("data-address"), type: $(this).attr("data-type") });
          });
          // Delete all selected rows at once
          delGroupItems("list", ids, table, "multiple ");
        },
      },
    ],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("groups-lists-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("groups-lists-table");

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
      if ("listid" in GETDict) {
        var pos = table
          .column(0, { order: "current" })
          .data()
          .indexOf(parseInt(GETDict.listid, 10));
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
  $("#listsTable tbody").on("click", "td.details-control", function () {
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

function deleteList() {
  const tr = $(this).closest("tr");
  const listType = tr.attr("data-type");
  const ids = [{ item: tr.attr("data-address"), type: listType }];
  delGroupItems("list", ids, table, listType);
}

function addList(event) {
  const type = event.data.type;
  const comment = $("#new_comment").val();

  // Check if the user wants to add multiple domains (space or newline separated)
  // If so, split the input and store it in an array
  var addresses = $("#new_address")
    .val()
    .split(/[\s,]+/);
  // Remove empty elements
  addresses = addresses.filter(function (el) {
    return el !== "";
  });
  const addressestr = JSON.stringify(addresses);

  utils.disableAll();
  utils.showAlert("info", "", "Adding subscribed " + type + "list(s)...", addressestr);

  if (addresses.length === 0) {
    // enable the ui elements again
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify " + type + "list address");
    return;
  }

  $.ajax({
    url: "/api/lists",
    method: "post",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ address: addresses, comment: comment, type: type }),
    success: function (data) {
      utils.enableAll();
      utils.listsAlert(type + "list", addresses, data);
      $("#new_address").val("");
      $("#new_comment").val("");
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

function editList() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const type = tr.attr("data-type");
  const dataId = tr.attr("data-id");
  const address = utils.hexDecode(tr.attr("data-address"));
  const enabled = tr.find("#enabled_" + dataId).is(":checked");
  const comment = utils.escapeHtml(tr.find("#comment_" + dataId).val());
  // Convert list of string integers to list of integers using map(Number)
  const groups = tr
    .find("#multiselect_" + dataId)
    .val()
    .map(Number);

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "enabled_" + dataId:
      if (!enabled) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "comment_" + dataId:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "multiselect_" + dataId:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element (" + elem + ") or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing address...", address);
  $.ajax({
    url: "/api/lists/" + encodeURIComponent(address) + "?type=" + type,
    method: "put",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      groups: groups,
      comment: comment,
      enabled: enabled,
      type: type,
    }),
    success: function (data) {
      utils.enableAll();
      processGroupResult(data, type + "list", done, notDone);
      table.ajax.reload(null, false);
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + type + "list " + address,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
