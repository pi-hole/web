/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, applyCheckboxRadioStyle:false, setConfigValues: false, apiFailure: false */

"use strict";

// Remove an element from an array (inline)
function removeFromArray(arr, what) {
  let found = arr.indexOf(what);

  while (found !== -1) {
    arr.splice(found, 1);
    found = arr.indexOf(what);
  }
}

function fillDNSupstreams(value, servers) {
  let disabledStr = "";
  if (value.flags.env_var === true) {
    $("#DNSupstreamsTextfield").prop("disabled", true);
    disabledStr = 'disabled="Disabled"';
  }

  let i = 0;
  let customServers = value.value.length;
  for (const element of servers) {
    let row = "<tr>";
    // Build checkboxes for IPv4 and IPv6
    const addresses = [element.v4, element.v6];
    // Loop over address types (IPv4, IPv6)
    for (let v = 0; v < 2; v++) {
      const address = addresses[v];
      // Loop over available addresses (up to 2)
      for (let index = 0; index < 2; index++) {
        if (address.length > index) {
          let checkedStr = "";
          if (
            value.value.includes(address[index]) ||
            value.value.includes(address[index] + "#53")
          ) {
            checkedStr = "checked";
            customServers--;
          }

          row += `<td title="${address[index]}">
                    <div>
                      <input type="checkbox" id="DNSupstreams-${i}" ${disabledStr} ${checkedStr}>
                      <label for="DNSupstreams-${i++}"></label>
                    </div>
                  </td>`;
        } else {
          row += "<td></td>";
        }
      }
    }

    // Add server name
    row += "<td>" + element.name + "</td>";

    // Close table row
    row += "</tr>";

    // Add row to table
    $("#DNSupstreamsTable").append(row);
  }

  // Add event listener to checkboxes
  $("input[id^='DNSupstreams-']").on("change", () => {
    const upstreams = $("#DNSupstreamsTextfield").val().split("\n");
    let customServers = 0;
    $("#DNSupstreamsTable input").each(function () {
      const title = $(this).closest("td").attr("title");
      if (this.checked && !upstreams.includes(title)) {
        // Add server to array
        upstreams.push(title);
      } else if (!this.checked && upstreams.includes(title)) {
        // Remove server from array
        removeFromArray(upstreams, title);
      }

      if (upstreams.includes(title)) customServers--;
    });
    // The variable will contain a negative value, we need to add the length to
    // get the correct number of custom servers
    customServers += upstreams.length;
    updateDNSserversTextfield(upstreams, customServers);
  });

  // Initialize textfield
  updateDNSserversTextfield(value.value, customServers);

  // Expand the box if there are custom servers
  if (customServers > 0) {
    const customBox = document.getElementById("custom-servers-box");
    utils.toggleBoxCollapse(customBox, true);
  }

  // Hide the loading animation
  $("#dns-upstreams-overlay").hide();

  // Apply styling to the new checkboxes
  applyCheckboxRadioStyle();
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

// Update the textfield with all (incl. custom) upstream servers
function updateDNSserversTextfield(upstreams, customServers) {
  $("#DNSupstreamsTextfield").val(upstreams.join("\n"));
  $("#custom-servers-title").text(
    "(" + customServers + " custom server" + (customServers === 1 ? "" : "s") + " enabled)"
  );
}

function getRevServerLines() {
  // Return the lines from the textarea (array of lines)
  return $(".revServers")
    .val()
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");
}

// Return an array of objects containing the current values from the textarea
function getRevServerArray() {
  let items = [];

  const lines = getRevServerLines();
  lines.forEach((line, index) => {
    const cols = line.split(",").map(s => s.trim());
    items.push({
      enabled: cols[0] ?? "",
      network: cols[1] ?? "",
      ip: cols[2] ?? "",
      domain: cols[3] ?? "",
    });
  });

  return items;
}

function createRevServerTable() {
  // The Conditional Forwarding option will be disabled when this option was set via ENV VAR.
  // Check if the textarea is disabled.
  if ($(".revServers").prop("disabled")) {
    // In this case, we don't show the table because the values can't be changed.
    // Show the disabled textarea and return
    $(".revServers").show();
    return;
  }

  // Get the data
  const tableRows = getRevServerArray();

  $("#revServers-table").DataTable({
    data: tableRows,
    autoWidth: false,
    columns: [
      { data: null, width: "54px" },
      { data: "network" },
      { data: "ip" },
      { data: "domain" },
      { data: null, width: "52px" },
    ],
    ordering: false,
    columnDefs: [
      {
        targets: 0,
        class: "input-checkbox text-center",
        render: function (data, type, row, meta) {
          const name = "enabled_" + meta.row;
          const ckbox =
            `<input type="checkbox" name="${name}" id="${name}" class="no-icheck" ` +
            (data.enabled === "true" ? "checked " : "") +
            ` data-initial-value="${data.enabled}" disabled>`;
          return ckbox;
        },
      },
      {
        targets: "_all",
        class: "input-text",
        render: function (data, type, row, meta) {
          let name;
          switch (meta.col) {
            case 1:
              name = "network_" + meta.row;
              break;
            case 2:
              name = "ip_" + meta.row;
              break;
            case 3:
              name = "domain_" + meta.row;
              break;
            // No default
          }

          return `<input type="text" name="${name}" id="${name}" value="${data}" class="form-control" data-initial-value="${data}" disabled>`;
        },
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteRevServers"]').on("click", deleteRecord);
      $('button[id^="editRevServers"]').on("click", editRecord);
      $('button[id^="saveRevServers"]').on("click", saveRecord).hide();
      $('button[id^="cancelRevServers"]').on("click", restoreRecord).hide();
    },
    rowCallback: function (row, data, displayNum, displayIndex, dataIndex) {
      $(row).attr("data-index", dataIndex);
      const bt = '<button type="button" class="btn btn-xs"</button>';
      const btEdit = $(bt)
        .addClass("btn-primary")
        .attr("id", `editRevServers_${dataIndex}`)
        .attr("title", "Edit")
        .append('<span class="far fa-edit"></span>');
      const btDel = $(bt)
        .addClass("btn-danger")
        .attr("id", `deleteRevServers_${dataIndex}`)
        .attr("data-tag", Object.values(data))
        .attr("data-type", "revServers")
        .attr("title", "Delete")
        .append('<span class="fa fa-trash"></span>');
      const btSave = $(bt)
        .addClass("btn-success")
        .attr("id", `saveRevServers_${dataIndex}`)
        .attr("title", "Confirm changes")
        .append('<span class="fa fa-check"></span>');
      const btCancel = $(bt)
        .addClass("btn-warning")
        .attr("id", `cancelRevServers_${dataIndex}`)
        .attr("data-tag", Object.values(data))
        .attr("title", "Undo changes")
        .append('<span class="fa fa-undo"></span>');

      $("td:eq(4)", row).html(btEdit).append(" ", btDel, " ", btSave, " ", btCancel);
    },
    dom:
      "<'row'<'col-sm-12 text-right'l>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No revese DNS servers defined.",
    },
    stateSave: true,
    stateDuration: 0,
    processing: true,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("revServers-records-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("revServers-records-table");
      // Return if not available
      if (data === null) return null;

      // Apply loaded state to table
      return data;
    },
  });
}

function addRevServer() {
  var values = [];
  values[0] = $("#enabled-revServers").is(":checked") ? "true" : "false";
  values[1] = $("#network-revServers").val();
  values[2] = $("#server-revServers").val();
  values[3] = $("#domain-revServers").val();

  // Reject empty network range and server IP
  if (values[1] == "" || values[2] == "") {
    // Show error message
    utils.showAlert("error", "fa fa-ban", "Network Range and Server IP are required", "");
    return;
  }

  // Domain is optional: if empty, remove it from the array
  if (values[3] == "") values.pop();

  // Add the new values to the textarea
  $(".revServers").val($(".revServers").val() + "\n" + values.join(","));

  // Clear the table footer fields
  $("#revServers-table tfoot input[type=text]").val("");
  $("#revServers-table tfoot input[type=checkbox]").prop("checked", true);

  // Save changes with message
  saveRevServerData("New values added: " + values.join(", "));
}

// Button to add a new reverse server
$("#btnAdd-revServers").on("click", addRevServer);

function editRecord() {
  // Enable fields on the selected row
  $(this).closest("tr").find("td input").prop("disabled", false);

  // Hide EDIT and DELETE buttons. Show SAVE and UNDO buttons
  $(this).hide();
  $(this).siblings('[id^="delete"]').hide();
  $(this).siblings('[id^="save"]').show();
  $(this).siblings('[id^="cancel"]').show();
}

function saveRecord() {
  // Find the row index
  const index = $(this).closest("tr").attr("data-index");

  // Get the edited values from each field
  const values = [];
  values[0] = $("#enabled_" + index).prop("checked") ? "true" : "false";
  values[1] = $("#network_" + index).val();
  values[2] = $("#ip_" + index).val();
  values[3] = $("#domain_" + index).val();

  // Reject empty network range and server IP
  if (values[1] == "" || values[2] == "") {
    // Show error message
    utils.showAlert("error", "fa fa-ban", "Network Range and Server IP are required", "");
    return;
  }

  // Domain is optional: if empty, remove it from the array
  if (values[3] == "") values.pop();

  // Get the values from the textarea
  let lines = getRevServerLines();

  // Replace the edited line on the textarea
  lines[index] = values.join(",");
  $(".revServers").val(lines.join("\n"));

  // Finish the edition disabling the fields
  $(this).closest("tr").find("td input").prop("disabled", true);

  // Show EDIT and DELETE buttons. Hide SAVE and UNDO buttons
  $(this).siblings('[id^="edit"]').show();
  $(this).siblings('[id^="delete"]').show();
  $(this).hide();
  $(this).siblings('[id^="cancel"]').hide();

  // Save changes with message
  saveRevServerData("Values successfully edited" + values.join(", "));
}

function restoreRecord() {
  // Find the row index
  const index = $(this).closest("tr").attr("data-index");

  // Reset values
  $("#enabled_" + index).prop("checked", $("#enabled_" + index).attr("data-initial-value"));
  $("#network_" + index).val($("#network_" + index).attr("data-initial-value"));
  $("#ip_" + index).val($("#ip_" + index).attr("data-initial-value"));
  $("#domain_" + index).val($("#domain_" + index).attr("data-initial-value"));

  // Show cancellation message
  utils.showAlert("info", "fas fa-undo", "Canceled", "Original values restored");

  // Finish the edition disabling the fields
  $(this).closest("tr").find("td input").prop("disabled", true);

  // Show EDIT and DELETE buttons. Hide SAVE and UNDO buttons
  $(this).siblings('[id^="edit"]').show();
  $(this).siblings('[id^="delete"]').show();
  $(this).siblings('[id^="save"]').hide();
  $(this).hide();
}

function deleteRecord() {
  // Find the row index (this is also the index of the deleted row)
  const index = $(this).closest("tr").attr("data-index");

  // Get the current lines from the textarea
  let lines = getRevServerLines();

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
      createRevServerTable();
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
      // Success
      utils.showAlert(
        "success",
        "fa-solid fa-fw fa-floppy-disk",
        "Conditional Forwarding settings successfully saved",
        msg
      );
      // Show loading overlay
      utils.loadingOverlay(false);

      // Reset the table to show the updated data
      // Remove all rows from the table, then create rows with the updated data and finally redraw the table
      var table = $("#revServers-table").DataTable();
      table.clear().rows.add(getRevServerArray()).draw();
    })
    .fail((data, exception) => {
      utils.enableAll();
      utils.showAlert("error", "", "Error while applying settings", data.responseText);
      console.log(exception); // eslint-disable-line no-console
      apiFailure(data);
    });
}
