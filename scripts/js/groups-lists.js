/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, apiFailure:false, updateFtlInfo:false, getGroups:false, processGroupResult:false, delGroupItems:false */
/* exported initTable */

"use strict";

let table;
let GETDict = {};

$(() => {
  GETDict = utils.parseQueryString();

  $("#btnAddAllow").on("click", { type: "allow" }, addList);
  $("#btnAddBlock").on("click", { type: "block" }, addList);

  getGroups();
});

function format(data) {
  // Generate human-friendly status string
  const statusText = setStatusText(data, true);
  let numbers = true;
  if (data.status === 0 || data.status === 4) {
    numbers = false;
  }

  // Compile extra info for displaying
  const dateAddedISO = utils.datetime(data.date_added, false);
  const dateModifiedISO = utils.datetime(data.date_modified, false);
  const dateUpdated =
    data.date_updated > 0
      ? utils.datetimeRelative(data.date_updated) +
        "&nbsp;(" +
        utils.datetime(data.date_updated, false) +
        ")"
      : "N/A";
  const numberOfEntries =
    (data.number !== null && numbers === true ? Math.trunc(data.number).toLocaleString() : "N/A") +
    (data.abp_entries !== null && Math.trunc(data.abp_entries) > 0 && numbers === true
      ? " (out of which " + Math.trunc(data.abp_entries).toLocaleString() + " are in ABP-style)"
      : "");
  const nonDomains =
    data.invalid_domains !== null && numbers === true
      ? Math.trunc(data.invalid_domains).toLocaleString()
      : "N/A";

  return `<table>
      <tr class="dataTables-child">
        <td>Type:&nbsp;&nbsp;</td><td>${setTypeIcon(data.type)}${data.type}list</td>
      </tr>
      <tr class="dataTables-child">
        <td>Health status:&nbsp;&nbsp;</td><td>${statusText}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Added to Pi-hole:&nbsp;&nbsp;</td>
        <td>${utils.datetimeRelative(data.date_added)}&nbsp;(${dateAddedISO})</td>
      </tr>
      <tr class="dataTables-child">
        <td>Database entry last modified:&nbsp;&nbsp;</td>
        <td>${utils.datetimeRelative(data.date_modified)}&nbsp;(${dateModifiedISO})</td>
      </tr>
      <tr class="dataTables-child">
        <td>Content last updated on:&nbsp;&nbsp;</td><td>${dateUpdated}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Number of entries:&nbsp;&nbsp;</td><td>${numberOfEntries}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Number of non-domains:&nbsp;&nbsp;</td><td>${nonDomains}</td>
      </tr>
      <tr class="dataTables-child">
        <td>Database ID:</td><td>${data.id}</td>
      </tr>
    </table>`;
}

// Define the status icon element
function setStatusIcon(data) {
  const statusCode = Math.trunc(data.status);
  const statusTitle = setStatusText(data) + "\nClick for details about this list";
  let statusIcon;

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

  // Match the coloured `list-status-N` classes used by the legend so the
  // table icons are coloured the same way instead of the default text colour.
  const statusClass = [1, 2, 3, 4].includes(statusCode)
    ? `list-status-${statusCode}`
    : "list-status-0";
  return `<span class='fa fa-fw ${statusIcon} ${statusClass}' title='${statusTitle}'></span>`;
}

// Define human-friendly status string
function setStatusText(data, showdetails = false) {
  let statusText = "Unknown";
  let statusDetails = "";
  if (data.status !== null) {
    switch (Math.trunc(data.status)) {
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
        statusDetails = ' (<span class="list-status-0">' + Math.trunc(data.status) + "</span>)";
        break;
    }
  }

  return statusText + (showdetails ? statusDetails : "");
}

// Define the type icon element
function setTypeIcon(type) {
  //Add red ban icon if data["type"] is "block"
  //Add green check icon if data["type"] is "allow"
  let iconClass = "fa-question text-orange";
  let title = "This list is of unknown type";
  if (type === "block") {
    iconClass = "fa-ban text-red";
    title = "This is a blocklist";
  } else if (type === "allow") {
    iconClass = "fa-check text-green";
    title = "This is an allowlist";
  }

  return `<span class='fa fa-fw ${iconClass}' title='${title}\nClick for details about this list'></span>`;
}

function initTable() {
  table = $("#listsTable").DataTable({
    processing: true,
    ajax: {
      url: document.body.dataset.apiurl + "/lists",
      dataSrc: "lists",
      type: "GET",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, orderable: false, width: "2rem" },
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
        render() {
          return "";
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback() {
      // Hide buttons if all lists were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      $('button[id^="deleteList_"]').on("click", deleteList);
    },
    rowCallback(row, data) {
      const dataId = utils.hexEncode(data.address + "_" + data.type);
      $(row).attr("data-id", dataId);
      $(row).attr("data-address", utils.hexEncode(data.address));
      $(row).attr("data-type", data.type);

      let statusCode = 0;
      // If there is no status or the list is disabled, we keep
      // status 0 (== unknown)
      if (data.status !== null && data.enabled) {
        statusCode = Math.trunc(data.status);
      }

      $("td:eq(1)", row).addClass("list-status-" + statusCode);
      $("td:eq(1)", row).html(setStatusIcon(data));

      $("td:eq(2)", row).addClass("list-type-" + statusCode);
      $("td:eq(2)", row).html(setTypeIcon(data.type));

      if (data.address.startsWith("file://")) {
        // Local files cannot be downloaded from a distant client so don't show
        // a link to such a list here
        const codeElement = document.createElement("code");
        codeElement.id = "address_" + dataId;
        codeElement.className = "breakall";
        codeElement.textContent = data.address;
        $("td:eq(3)", row).empty().append(codeElement);
      } else {
        const aElement = document.createElement("a");
        aElement.id = "address_" + dataId;
        aElement.className = "breakall";
        aElement.href = data.address;
        aElement.target = "_blank";
        aElement.rel = "noopener noreferrer";
        aElement.textContent = data.address;
        $("td:eq(3)", row).empty().append(aElement);
      }

      $("td:eq(4)", row).html(
        '<input type="checkbox" id="enabled_' +
          dataId +
          '"' +
          (data.enabled ? " checked" : "") +
          ">"
      );
      const statusElement = $("#enabled_" + dataId, row);
      statusElement.bootstrapToggle({
        onlabel: "Enabled",
        offlabel: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px",
      });
      statusElement.on("change", editList);

      $("td:eq(5)", row).html('<input id="comment_' + dataId + '" class="form-control">');
      const commentElement = $("#comment_" + dataId, row);
      commentElement.val(data.comment);
      commentElement.on("change", editList);

      $("td:eq(6)", row).empty();
      $("td:eq(6)", row).append(
        '<select class="group-select" id="multiselect_' + dataId + '" multiple></select>'
      );
      const selectElement = $("#multiselect_" + dataId, row);
      // Add all known groups
      for (const group of groups) {
        const label = group.enabled ? group.name : group.name + " (disabled)";

        selectElement.append($("<option/>").val(group.id).text(label));
      }

      const applyButton = "#btn_apply_" + dataId;

      // Select assigned groups
      selectEl.val(data.groups);
      // Initialize Tom Select
      const ts = utils.createGroupSelect(selectElement, {
        onChange() {
          // enable Apply button
          if ($(applyButton).prop("disabled")) {
            $(applyButton)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", () => {
                editList.call(selectElement);
              });
          }
        },
        onDropdownClose() {
          // Restore values if the dropdown is closed without clicking the Apply button
          if ($(applyButton).prop("disabled")) {
            return;
          }

          ts.setValue(data.groups);
          $(applyButton).removeClass("btn-success").prop("disabled", true).off("click");
        },
      });
      $(ts.dropdown)
        .find(".ts-actions-box")
        .append(
          '<button type="button" id=btn_apply_' +
            dataId +
            ' class="btn btn-sm" disabled>Apply</button>'
        );

      // Highlight row (if url parameter "listid=" is used)
      if ("listid" in GETDict && data.id === Math.trunc(GETDict.listid)) {
        $(row).find("td").addClass("highlight");
      }

      const button =
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
        action() {
          table.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action() {
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
        action() {
          // For each ".selected" row ...
          const ids = [];
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
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("groups-lists-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("groups-lists-table");

      // Return if not available
      if (data === null) {
        return null;
      }

      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    },
    initComplete() {
      if (!("listid" in GETDict)) {
        return;
      }

      const pos = table.column(0, { order: "current" }).data().indexOf(Math.trunc(GETDict.listid));
      if (pos !== -1) {
        const page = Math.floor(pos / table.page.info().length);
        table.page(page).draw(false);
      }
    },
  });

  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });

  table.on("order.dt", () => {
    const order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").removeClass("hidden");
    } else {
      $("#resetButton").addClass("hidden");
    }
  });

  $("#resetButton").on("click", () => {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").addClass("hidden");
  });

  // Add event listener for opening and closing details
  $("#listsTable tbody").on("click", "td.details-control", function () {
    const tr = $(this).closest("tr");
    const row = table.row(tr);

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
  const input = document.querySelector("input[type=search]");
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
  // Convert all group IDs to integers
  const group = $("#new_group").val().map(Number);

  // Check if the user wants to add multiple domains (space or newline separated)
  // If so, split the input and store it in an array
  let addresses = $("#new_address")
    .val()
    .split(/[\s,]+/u);
  // Remove empty elements
  addresses = addresses.filter(element => element !== "");
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
    url: document.body.dataset.apiurl + "/lists?type=" + encodeURIComponent(type),
    method: "post",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ address: addresses, comment, groups: group }),
    success(data) {
      utils.enableAll();
      utils.listsAlert(type + "list", addresses, data);
      $("#new_address").val("");
      $("#new_comment").val("");
      table.ajax.reload(null, false);
      table.rows().deselect();

      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error(data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new " + type + "list", data.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editList() {
  const element = $(this).attr("id");
  const tr = $(this).closest("tr");
  const type = tr.attr("data-type");
  const dataId = tr.attr("data-id");
  const address = utils.hexDecode(tr.attr("data-address"));
  const enabled = tr.find("#enabled_" + dataId).is(":checked");
  const comment = tr.find("#comment_" + dataId).val();
  // Convert list of string integers to list of integers using map(Number)
  const groups = tr
    .find("#multiselect_" + dataId)
    .val()
    .map(Number);

  let done = "edited";
  let notDone = "editing";
  switch (element) {
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
      alert("bad element (" + element + ") or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing address...", address);
  $.ajax({
    url: document.body.dataset.apiurl + "/lists/" + encodeURIComponent(address) + "?type=" + type,
    method: "put",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      groups,
      comment,
      enabled,
      type,
    }),
    success(data) {
      utils.enableAll();
      processGroupResult(data, type + "list", done, notDone);
      table.ajax.reload(null, false);
    },
    error(data, exception) {
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
