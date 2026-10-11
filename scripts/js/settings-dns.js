/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false */

"use strict";

// Get the manually entered upstream servers from the textarea
function getManualDNSupstreams() {
  return $("#DNSupstreamsTextfield")
    .val()
    .split(/\r?\n/u)
    .map(line => line.trim())
    .filter(Boolean);
}

// Get the upstream servers selected in the pre-filled provider tables
function getSelectedDNSupstreams() {
  const selectedUpstreams = [];
  $("#DNSupstreamTabs table input:checked").each(function () {
    const title = $(this).closest("td").attr("title");
    if (title && !selectedUpstreams.includes(title)) {
      selectedUpstreams.push(title);
    }
  });

  return selectedUpstreams;
}

// Check if a manual upstream server is already covered by a selected Plain upstream server
function isCoveredBySelectedPlainServer(upstream, selectedUpstreamsSet) {
  return upstream.endsWith("#53") && selectedUpstreamsSet.has(upstream.slice(0, -3));
}

// Show how many upstreams are selected on each Plain/DoT/DoH tab, so it's not
// hidden behind whichever tab happens to be active
function updateUpstreamTabBadges() {
  for (const protocol of ["plain", "dot", "doh"]) {
    const count = $("#DNSupstreamsTable-" + protocol + " input:checked").length;
    $("#upstreams-count-" + protocol)
      .text(count)
      .toggle(count > 0)
      .attr("title", "Selected servers: " + count);
  }
}

// Fill the upstreams tables with the given servers, and initialize the manual upstreams textarea with the given value.
function fillDNSupstreams(value, servers) {
  let disabledStr = "";
  if (value.flags.env_var === true) {
    $("#DNSupstreamsTextfield").prop("disabled", true);
    disabledStr = 'disabled="Disabled"';
  }

  let i = 0;

  // Build a single checkbox <td> for the given address, tracking selection
  // state and consuming a custom-server slot when it matches. Plain v4/v6
  // addresses also match the default-port-suffixed form; the pinned DoT/DoH
  // URIs are matched verbatim only. Returns an empty cell when there is no
  // address for this slot (only used within the Plain table, since a vendor
  // may only publish one of the two plain addresses in a family).
  function checkboxCell(address, portSuffix) {
    if (!address) {
      return "<td></td>";
    }

    let checkedStr = "";
    if (value.value.includes(address) || (portSuffix && value.value.includes(address + "#53"))) {
      checkedStr = "checked";
    }

    return `<td title="${address}">
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="DNSupstreams-${i}" ${disabledStr} ${checkedStr}>
                <label class="form-check-label" for="DNSupstreams-${i++}"></label>
              </div>
            </td>`;
  }

  for (const element of servers) {
    // Plain IPv4/IPv6 addresses always get a row, even if a vendor only
    // publishes one address per family
    let plainRow = "<tr>";
    plainRow += checkboxCell(element.v4[0], true);
    plainRow += checkboxCell(element.v4[1], true);
    plainRow += checkboxCell(element.v6[0], true);
    plainRow += checkboxCell(element.v6[1], true);
    plainRow += "<td>" + element.name + "</td></tr>";
    $("#DNSupstreamsTable-plain").append(plainRow);

    // DoT/DoH only get a row when the vendor actually publishes a pinned URI
    // for at least one address family, so those tabs never fill up with rows
    // that are entirely empty
    if (element.dot && (element.dot.v4 || element.dot.v6)) {
      let dotRow = "<tr>";
      dotRow += checkboxCell(element.dot.v4, false);
      dotRow += checkboxCell(element.dot.v6, false);
      dotRow += "<td>" + element.name + "</td></tr>";
      $("#DNSupstreamsTable-dot").append(dotRow);
    }

    if (element.doh && (element.doh.v4 || element.doh.v6)) {
      let dohRow = "<tr>";
      dohRow += checkboxCell(element.doh.v4, false);
      dohRow += checkboxCell(element.doh.v6, false);
      dohRow += "<td>" + element.name + "</td></tr>";
      $("#DNSupstreamsTable-doh").append(dohRow);
    }
  }

  // Add event listener to checkboxes (shared across the Plain/DoT/DoH tabs)
  $("input[id^='DNSupstreams-']").on("change", () => {
    updateCustomDNSserversTitle(getManualDNSupstreams().length);
    updateUpstreamTabBadges();
  });

  // Keep only truly manual entries in the custom textfield
  const selectedUpstreamsSet = new Set(getSelectedDNSupstreams());
  const manualUpstreams = value.value.filter(
    upstream =>
      !selectedUpstreamsSet.has(upstream) &&
      !isCoveredBySelectedPlainServer(upstream, selectedUpstreamsSet)
  );

  // Initialize textfield
  updateDNSserversTextfield(manualUpstreams);
  updateUpstreamTabBadges();

  // Expand the box if there are custom servers
  if (manualUpstreams.length > 0) {
    const customBox = document.getElementById("custom-servers-box");
    utils.toggleBoxCollapse(customBox, true);
  }

  // Hide the loading animation
  $("#dns-upstreams-overlay").hide();

  // Keep custom server count in sync while the user edits the manual list
  $("#DNSupstreamsTextfield").on("input", () => {
    updateCustomDNSserversTitle(getManualDNSupstreams().length);
  });
}

function setInterfaceName(name) {
  // If dns.interface is empty in pihole.toml, we use the first interface
  // (same default value used by FTL)
  if (name === "") {
    $.ajax({
      url: document.body.dataset.apiurl + "/network/gateway",
      async: false,
    })
      .done(data => {
        name = data.gateway[0].interface;
      })
      .fail(data => {
        apiFailure(data);
        name = "not found";
      });
  }

  $("#interface-name-1").text(name);
  $("#interface-name-2").text(name);
}

// Update the textfield with manual upstream servers only
function updateDNSserversTextfield(manualUpstreams) {
  $("#DNSupstreamsTextfield").val(manualUpstreams.join("\n"));
  updateCustomDNSserversTitle(manualUpstreams.length);
}

function updateCustomDNSserversTitle(customServerCount) {
  $("#custom-servers-title").text(
    "(" + customServerCount + " custom server" + (customServerCount === 1 ? "" : "s") + " enabled)"
  );
}

function getMergedDNSupstreams(manualUpstreams) {
  // Start with all upstreams selected in the pre-filled provider tables.
  const mergedUpstreams = getSelectedDNSupstreams();
  const selectedUpstreamsSet = new Set(mergedUpstreams);

  // Append manual entries unless already covered by a selected table upstream.
  // For plain DNS, selected "IP" also covers manual "IP#53".
  for (const line of manualUpstreams) {
    const upstream = line.trim();
    if (!upstream) {
      continue;
    }

    if (
      selectedUpstreamsSet.has(upstream) ||
      isCoveredBySelectedPlainServer(upstream, selectedUpstreamsSet)
    ) {
      continue;
    }

    // Preserve user-entered order while preventing duplicates.
    if (!mergedUpstreams.includes(upstream)) {
      mergedUpstreams.push(upstream);
    }
  }

  return mergedUpstreams;
}

globalThis.getMergedDNSupstreams = getMergedDNSupstreams;

function getRevServerLines() {
  // Return the lines from the textarea (array of lines)
  return $(".revServers")
    .val()
    .split(/\r?\n/u)
    .filter(line => line.trim() !== "");
}

// Return an array of objects containing the current values from the textarea
function getRevServerArray() {
  const items = [];

  const lines = getRevServerLines();
  for (const line of lines) {
    const cols = line.split(",").map(s => s.trim());
    items.push({
      enabled: cols[0] ?? "",
      network: cols[1] ?? "",
      ip: cols[2] ?? "",
      domain: cols[3] ?? "",
    });
  }

  return items;
}

function createRevServerTable() {
  // Get the data
  const tableRows = getRevServerArray();

  $("#revServers-table").DataTable({
    data: tableRows,
    autoWidth: false,
    columns: [
      { data: "enabled", width: "76px", className: "revserver-chkbox text-center" },
      { data: "network", className: "revserver-network" },
      { data: "ip", className: "revserver-ip" },
      { data: "domain", className: "revserver-domain" },
      { data: null, width: "82px", className: "actions" },
    ],
    ordering: false,
    columnDefs: [
      {
        targets: 0,
        // eslint-disable-next-line no-unused-vars
        createdCell(td, cellData, rowData, row, col) {
          $(td).attr("data-initial-value", cellData);
        },
        render(data, type, row, meta) {
          const name = "enabled_" + meta.row;
          const ckbox =
            `<input type="checkbox" name="${name}" id="${name}" class="no-icheck" ` +
            (data === "true" ? "checked " : "") +
            ">";
          return ckbox;
        },
      },
      {
        targets: [1, 2, 3],
        // eslint-disable-next-line no-unused-vars
        createdCell(td, cellData, rowData, row, col) {
          $(td).attr("contenteditable", "true").attr("data-initial-value", cellData);
        },
      },
    ],
    initComplete() {
      $(this.api().table().footer())
        // Remove elements automatically created by datatables in the table footer
        .find(".dt-column-footer")
        .each(function () {
          const $innerTitle = $(this).find(".dt-column-title");

          // If the inner span has no text or HTML, empty the cell entirely
          if ($.trim($innerTitle.html()) === "") {
            $(this).closest("th, td").empty();
          } else {
            // Otherwise, safely strip both wrappers to restore original HTML
            $innerTitle.contents().unwrap();
            $(this).contents().unwrap();
          }
        });
    },
    drawCallback() {
      $(".deleteRevServers").on("click", deleteRecord);
      $("tbody .saveRevServers").on("click", saveRecord);
      $(".cancelRevServers").on("click", restoreRecord);
    },
    rowCallback(row, data, displayNum, displayIndex, dataIndex) {
      $(row).attr("data-index", dataIndex);
      const bt = '<button type="button" class="btn btn-xs"></button>';
      const btDel = $(bt)
        .addClass("btn-danger deleteRevServers")
        .attr("title", "Delete")
        .append('<span class="fa fa-trash"></span>');
      const btSave = $(bt)
        .addClass("btn-success saveRevServers")
        .attr("title", "Confirm changes")
        .append('<span class="fa fa-check"></span>');
      const btCancel = $(bt)
        .addClass("btn-warning cancelRevServers")
        .attr("title", "Undo changes")
        .append('<span class="fa fa-undo"></span>');

      $("td:eq(4)", row).html(btSave).append(" ", btCancel, " ", btDel);
    },
    dom:
      "<'row'<'col-sm-12 text-right'l>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No reverse DNS servers defined.",
    },
    stateSave: true,
    stateDuration: 0,
    processing: true,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("revServers-records-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("revServers-records-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
}

function addRevServer() {
  const values = [];
  values[0] = $("#enabled-revServers input").prop("checked") ? "true" : "false";
  values[1] = $("#network-revServers").text();
  values[2] = $("#ip-revServers").text();
  values[3] = $("#domain-revServers").text();

  // Reject empty network range and server IP
  if (values[1] === "" || values[2] === "") {
    // Show error message
    utils.showAlert("error", "fa fa-ban", "Network Range and Server IP are required", "");
    return;
  }

  // Domain is optional: if empty, remove it from the array
  if (values[3] === "") {
    values.pop();
  }

  // Add the new values to the textarea
  $(".revServers").val($(".revServers").val() + "\n" + values.join(","));

  // Clear the table footer fields
  $("#revServers-table tfoot [contenteditable]").text("");
  $("#revServers-table tfoot input[type=checkbox]").prop("checked", false);

  // Save changes with message
  saveRevServerData("Added values: " + values.join(", "));
}

// Button to add a new reverse server
$("#btnAddRevServers").on("click", addRevServer);

function saveRecord() {
  // Find the row and its index number
  const row = $(this).closest("tr");
  const index = row.attr("data-index");

  // Get the edited values from each field
  const values = [];
  values[0] = $(".revserver-chkbox input", row).prop("checked") ? "true" : "false";
  values[1] = $(".revserver-network", row).text();
  values[2] = $(".revserver-ip", row).text();
  values[3] = $(".revserver-domain", row).text();

  // Remove "editing" class from the row. Buttons will be shown/hidden via CSS
  row.removeClass("editing");

  // Reject empty network range and server IP
  if (values[1] === "" || values[2] === "") {
    // Show error message
    utils.showAlert("error", "fa fa-ban", "Network Range and Server IP are required", "");
    return;
  }

  // Domain is optional: if empty, remove it from the array
  if (values[3] === "") {
    values.pop();
  }

  // Get the values from the textarea
  const lines = getRevServerLines();

  // Update the edited line on the textarea
  lines[index] = values.join(",");
  $(".revServers").val(lines.join("\n"));

  // Save changes with message
  saveRevServerData("Updated values: " + values.join(", "));
}

function restoreRecord() {
  // Find the row and its index number
  const row = $(this).closest("tr");

  // Reset values using "data-initial-value"
  $(".revserver-chkbox input", row).prop(
    "checked",
    $(".revserver-chkbox input", row).attr("data-initial-value")
  );
  $('[contenteditable="true"]', row).text(function () {
    return $(this).attr("data-initial-value");
  });

  // Show cancellation message
  utils.showAlert("info", "fas fa-undo", "Canceled", "Original values restored");

  // Make sure all highlighted cells are restored
  // Remove "editing" class from the row. The buttons will be shown/hidden via CSS
  row.find(".table-danger").removeClass("table-danger");
  row.removeClass("editing");
}

function deleteRecord() {
  // Find the row index (this is also the index of the deleted row)
  const index = $(this).closest("tr").attr("data-index");

  // Get the current lines from the textarea
  const lines = getRevServerLines();

  // Remove the deleted line and update the textearea
  lines.splice(index, 1);
  $(".revServers").val(lines.join("\n"));

  // Save changes with message
  saveRevServerData("Line successfully deleted");
}

function processDNSConfig() {
  $.ajax({
    url: document.body.dataset.apiurl + "/config/dns?detailed=true", // We need the detailed output to get the DNS server list
  })
    .done(data => {
      // Initialize the DNS upstreams
      fillDNSupstreams(data.config.dns.upstreams, data.dns_servers);
      setInterfaceName(data.config.dns.interface.value);
      setConfigValues("dns", "dns", data.config.dns);
    })
    .done(() => {
      // This will be executed only after the done block above is executed

      // If Conditional Forwarding option is set via ENV VAR, the textarea will be disabled and no values can be edited
      if ($(".revServers").prop("disabled")) {
        // In this case, we hide the table and show the textarea
        $("#revServers-table").hide();
        $(".revServers").show().attr("title", "Disabled: Set by environment variable");
      } else {
        // We only populate the table when the textarea is enabled
        createRevServerTable();
      }
    })
    .fail(data => {
      apiFailure(data);
    });
}

$(() => {
  processDNSConfig();
});

// Save the Reverse Servers data via API and recreate the table with updated values
function saveRevServerData(msg) {
  // Get the data from the textarea
  const data = getRevServerLines();

  // Call the API to save only the dns.revServers option
  $.ajax({
    url: document.body.dataset.apiurl + "/config",
    method: "PATCH",
    dataType: "json",
    processData: false,
    data: JSON.stringify({ config: { dns: { revServers: data } } }),
    contentType: "application/json; charset=utf-8",
  })
    .done(() => {
      utils.enableAll();
      utils.showAlert(
        "success",
        "fa-solid fa-fw fa-floppy-disk",
        "Conditional Forwarding settings successfully saved",
        msg
      );
      // Show loading overlay (without reloading the page)
      utils.loadingOverlay(false);

      // Reset the table to show the updated data
      // Remove all rows from the table, then create rows with the updated data and finally redraw the table
      const table = $("#revServers-table").DataTable();
      table.clear().rows.add(getRevServerArray()).draw();
    })
    .fail((response, exception) => {
      utils.enableAll();
      utils.showAlert("error", "", "Error while applying settings", response.responseText);
      console.log(exception); // eslint-disable-line no-console
      apiFailure(response);
    });
}

// Mark the row with "editing" class when an editable cell or checkbox is focused/edited
// This will use CSS rules to show/hide buttons
$(document).on("focus input", "#revServers-table [contenteditable]", function () {
  $(this).closest("tr").addClass("editing");

  // Make sure the placeholder text is shown when a contenteditable cell is empty (or only contains spaces)
  if ($(this).text().trim() === "") {
    $(this).empty();
  }
});
$(document).on("change", "#revServers-table .revserver-chkbox input", function () {
  $(this).closest("tr").addClass("editing");
});

// Validate data entered on the table
// If a cell contains an invalid value, it will be highlighted and the save button will be disabled
$(document).on("input blur paste", ".revserver-network", function () {
  const val = $(this).text().trim();
  if (val && !(utils.validateIPv4(val) || utils.validateIPv6(val))) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid network range");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", true);
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", false);
  }
});
$(document).on("input blur paste", ".revserver-ip", function () {
  const val = $(this).text().trim();
  if (val && !(utils.validateIPv4WithPort(val) || utils.validateIPv6WithPort(val))) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid server IP");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", true);
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", false);
  }
});
$(document).on("input blur paste", ".revserver-domain", function () {
  const val = $(this).text().trim();
  if (val && !utils.validateHostname(val)) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid domain");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", true);
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
    $(this).siblings(".actions").find(".saveRevServers").prop("disabled", false);
  }
});
