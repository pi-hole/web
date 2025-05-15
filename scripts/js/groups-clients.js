/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, updateFtlInfo:false, getGroups:false, processGroupResult:false, delGroupItems:false, handleTableOrderChange:false */
/* exported initTable */

"use strict";

let table;

function reloadClientSuggestions() {
  utils.fetchFactory(`${document.body.dataset.apiurl}/clients/_suggestions`).then(data => {
    const sel = $("#select");
    sel.empty();

    // In order for the placeholder value to appear, we have to have a blank
    // <option> as the first option in our <select> control. This is because
    // the browser tries to select the first option by default. If our first
    // option were non-empty, the browser would display this instead of the
    // placeholder.
    sel.append($("<option />"));

    // Add data obtained from API
    for (const client of data.clients) {
      const hwaddr = client.hwaddr.toUpperCase();
      const mockDevice = hwaddr.startsWith("IP-");
      // Mock MAC address for address-only devices
      const key = mockDevice ? hwaddr.substring(3) : hwaddr;
      let text = key;

      // Append additional info if available
      let extraInfo = "";
      if (client.names !== null && client.names.length > 0) {
        // Count number of "," in client.names to determine number of hostnames
        const numHostnames = client.names.split(",").length;
        const pluralHostnames = utils.pluralize(numHostnames, "hostname");
        extraInfo = `${numHostnames} ${pluralHostnames}: ${utils.escapeHtml(client.names)}`;
      }

      if (client.macVendor !== null && client.macVendor.length > 0) {
        if (extraInfo.length > 0) extraInfo += "; ";
        extraInfo += `vendor: ${utils.escapeHtml(client.macVendor)}`;
      }

      // Do not add addresses for mock devices as their address is already
      // the hwaddr
      if (client.addresses !== null && client.addresses.length > 0 && !mockDevice) {
        if (extraInfo.length > 0) extraInfo += "; ";
        // Count number of "," in client.addresses to determine number of addresses
        const numAddresses = client.addresses.split(",").length;
        const pluralAddresses = utils.pluralize(numAddresses, "address", "addresses");
        extraInfo += `${numAddresses} ${pluralAddresses}: ${utils.escapeHtml(client.addresses)}`;
      }

      if (extraInfo.length > 0) text += ` (${extraInfo})`;

      sel.append($("<option />").val(key).text(text));
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $("#btnAdd").on("click", addClient);
  $("#select").select2({
    tags: true,
    placeholder: "Select client...",
    allowClear: true,
  });

  reloadClientSuggestions();
  utils.setBsSelectDefaults();
  getGroups();

  $("#select").on("change", () => {
    $("#ip-custom").val("");
    $("#ip-custom").prop("disabled", $("#select option:selected").val() !== "custom");
  });
});

globalThis.initTable = function () {
  table = $("#clientsTable").DataTable({
    processing: true,
    ajax: {
      url: `${document.body.dataset.apiurl}/clients`,
      dataSrc: "clients",
      type: "GET",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, orderable: false, width: "15px" },
      { data: "client", type: "ip-address" },
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
      // Hide buttons if all clients were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      $('button[id^="deleteClient_"]').on("click", deleteClient);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      const dataId = utils.hexEncode(data.client);
      row.dataset.id = dataId;

      const addedDate = utils.datetime(data.date_added, false);
      const modifiedDate = utils.datetime(data.date_modified, false);
      const tooltip = `Added: ${addedDate}\nLast modified: ${modifiedDate}\nDatabase ID: ${data.id}`;

      let ipName = `<code id="ip_${dataId}" title="${tooltip}" class="breakall">${utils.escapeHtml(data.client)}</code>`;

      if (data.name !== null && data.name.length > 0)
        ipName += `<br><code id="name_${dataId}" title="${tooltip}" class="breakall">${utils.escapeHtml(data.name)}</code>`;

      $("td:eq(1)", row).html(ipName);

      $("td:eq(2)", row).html(`<input id="comment_${dataId}" class="form-control">`);
      const commentEl = $(`#comment_${dataId}`, row);
      commentEl.val(data.comment);
      commentEl.on("change", editClient);

      $("td:eq(3)", row).empty();
      $("td:eq(3)", row).append(
        `<select class="selectpicker" id="multiselect_${dataId}" multiple></select>`
      );
      const selectEl = $(`#multiselect_${dataId}`, row);
      // Add all known groups
      for (const group of groups) {
        const dataSub = group.enabled ? "" : 'data-subtext="(disabled)"';

        selectEl.append($(`<option ${dataSub}/>`).val(group.id).text(group.name));
      }

      const applyBtn = `#btn_apply_${dataId}`;

      // Select assigned groups
      selectEl.val(data.groups);
      // Initialize bootstrap-select
      selectEl
        // fix dropdown if it would stick out right of the viewport
        .on("show.bs.select", () => {
          const winWidth = $(globalThis).width();
          const dropdownEl = $("body > .bootstrap-select.dropdown");
          if (dropdownEl.length === 0) return;

          // Remove align-right class to recalculate
          dropdownEl.removeClass("align-right");
          const width = dropdownEl.width();
          const left = dropdownEl.offset().left;
          if (left + width > winWidth) {
            dropdownEl.addClass("align-right");
          }
        })
        .on("changed.bs.select", () => {
          // enable Apply button
          if ($(applyBtn).prop("disabled")) {
            $(applyBtn)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", () => {
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
          `<button type="button" id=btn_apply_${dataId} class="btn btn-block btn-sm" disabled>Apply</button>`
        );

      const button =
        `<button type="button" class="btn btn-danger btn-xs" id="deleteClient_${dataId}" data-id="${dataId}">` +
        '<span class="far fa-trash-alt"></span></button>';
      $("td:eq(4)", row).html(button);
    },
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
          // Create an array of objects for each ".selected" row's data-id
          const ids = [...document.querySelectorAll("tr.selected")].map(row => ({
            item: row.dataset.id,
          }));

          // Delete all selected rows at once
          delGroupItems("client", ids, table);
        },
      },
    ],
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
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("groups-clients-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("groups-clients-table");

      // Return null if not available
      if (data === null) return null;

      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    },
  });

  // Disable autocorrect in the search box
  utils.disableAutocorrect();

  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });

  handleTableOrderChange(table);
};

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteClient() {
  // Passes the button data-id attribute as ID
  const ids = [{ item: $(this).attr("data-id") }];
  delGroupItems("client", ids, table);
}

function addClient() {
  const comment = $("#new_comment").val();
  // Convert all group IDs to integers
  const group = $("#new_group").val().map(Number);

  // Check if the user wants to add multiple IPs (space or newline separated)
  // If so, split the input and store it in an array
  const ips = $("#select")
    .val()
    .trim()
    .split(/[\s,]+/)
    // Remove empty elements
    .filter(el => el !== "");
  const ipStr = JSON.stringify(ips);

  // Validate input, can be:
  // - IPv4 address (with and without CIDR)
  // - IPv6 address (with and without CIDR)
  // - MAC address (in the form AA:BB:CC:DD:EE:FF)
  // - host name (arbitrary form, we're only checking against some reserved characters)
  for (const [index, ip] of ips.entries()) {
    if (utils.validateIPv4CIDR(ip) || utils.validateIPv6CIDR(ip) || utils.validateMAC(ip)) {
      // Convert input to upper case (important for MAC addresses)
      ips[index] = ip.toUpperCase();
    } else if (!utils.validateHostname(ip)) {
      utils.showAlert({
        type: "warning",
        title: "Warning",
        message: "Input is neither a valid IP or MAC address nor a valid host name!",
      });
      return;
    }
  }

  utils.disableAll();
  utils.showAlert({ type: "info", title: "Adding client(s)...", message: ipStr });

  if (ips.length === 0) {
    utils.enableAll();
    utils.showAlert({
      type: "warning",
      title: "Warning",
      message: "Please specify a client IP or MAC address",
    });
    return;
  }

  $.ajax({
    url: `${document.body.dataset.apiurl}/clients`,
    method: "post",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ client: ips, comment, groups: group }),
    success(data) {
      utils.enableAll();
      utils.listsAlert("client", ips, data);
      reloadClientSuggestions();
      $("#new_comment").val("");
      table.ajax.reload(null, false);
      table.rows().deselect();

      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error(data, exception) {
      utils.apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: "Error while adding new client",
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editClient() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const client = tr.attr("data-id");
  // Convert list of string integers to list of integers using map(Number)
  const groups = tr.find(`#multiselect_${client}`).val().map(Number);
  const comment = tr.find(`#comment_${client}`).val();

  let done = "edited";
  let notDone = "editing";
  switch (elem) {
    case `multiselect_${client}`:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    case `comment_${client}`:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    default:
      alert(`bad element (${elem}) or invalid data-id!`);
      return;
  }

  utils.disableAll();
  const clientDecoded = utils.hexDecode(client);
  utils.showAlert({ type: "info", title: "Editing client...", message: clientDecoded });
  $.ajax({
    url: `${document.body.dataset.apiurl}/clients/${encodeURIComponent(clientDecoded)}`,
    method: "put",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      groups,
      comment,
    }),
    success(data) {
      utils.enableAll();
      processGroupResult(data, "client", done, notDone);
      table.ajax.reload(null, false);
    },
    error(data, exception) {
      utils.apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: `Error while ${notDone} client ${clientDecoded}`,
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
