/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, applyCheckboxRadioStyle:false, setConfigValues: false, apiFailure: false */

// Remove an element from an array (inline)
function removeFromArray(arr, what) {
  var found = arr.indexOf(what);

  while (found !== -1) {
    arr.splice(found, 1);
    found = arr.indexOf(what);
  }
}

function fillDNSupstreams(value, servers) {
  var disabledStr = "";
  if (value.flags.env_var === true) {
    $("#DNSupstreamsTextfield").prop("disabled", true);
    disabledStr = 'disabled="Disabled"';
  }

  var i = 0;
  var customServers = value.value.length;
  servers.forEach(element => {
    var row = "<tr>";
    // Build checkboxes for IPv4 and IPv6
    const addresses = [element.v4, element.v6];
    // Loop over address types (IPv4, IPv6)
    for (let v = 0; v < 2; v++) {
      const address = addresses[v];
      // Loop over available addresses (up to 2)
      for (let index = 0; index < 2; index++) {
        if (address.length > index) {
          var checkedStr = "";
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
  });

  // Add event listener to checkboxes
  $("input[id^='DNSupstreams-']").on("change", function () {
    var upstreams = $("#DNSupstreamsTextfield").val().split("\n");
    var customServers = 0;
    $("#DNSupstreamsTable input").each(function () {
      var title = $(this).closest("td").attr("title");
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

  // Hide the loading animation
  $("#dns-upstreams-overlay").hide();

  // Apply styling to the new checkboxes
  applyCheckboxRadioStyle();
}

// Update the textfield with all (incl. custom) upstream servers
function updateDNSserversTextfield(upstreams, customServers) {
  $("#DNSupstreamsTextfield").val(upstreams.join("\n"));
  $("#custom-servers-title").text(
    "(" + customServers + " custom server" + (customServers === 1 ? "" : "s") + " enabled)"
  );
}

function revServersField(data, fieldIndex) {
  // If an invalid index is received, return null
  if (fieldIndex < 0 || fieldIndex > 4) {
    return null;
  }

  const arrRevServers = data.split(",");
  return arrRevServers.length > fieldIndex ? arrRevServers[fieldIndex] : "";
}

function revServerDataTable() {
  var setByEnv = false;
  $.ajax({
    url: "/api/config/dns/revServers?detailed=true",
  }).done(function (data) {
    // Set the title icons if needed
    setConfigValues("dns", "dns", data.config.dns);

    // disable input fields if set by env var
    if (data.config.dns.revServers.flags.env_var) {
      $(".revServers").prop("disabled", true);
    }
  });

  $("#revServers-table").DataTable({
    ajax: {
      url: "/api/config/dns/revServers",
      type: "GET",
      dataSrc: function (json) {
        const output = [];
        for (let i = 0; i < json.config.dns.revServers.length; i++) {
          const cols = json.config.dns.revServers[i].split(",");
          output.push({
            enabled: cols[0],
            network: cols[1],
            ip: cols[2],
            domain: cols[3],
          });
        }

        return output;
      },
    },
    autoWidth: false,
    columns: [
      { data: null, width: "60px" },
      { data: "network" },
      { data: "ip" },
      { data: "domain" },
      { data: null, width: "50px" },
    ],
    bFilter: false,
    ordering: false,
    columnDefs: [
      {
        targets: 0,
        class: "input-checkbox text-center",
        render: function (data, type, row, meta) {
          const name = "enabled_" + meta.row;
          const ckbox =
            '<input type="checkbox" disabled ' +
            (data.enabled === "true" ? "checked " : "") +
            `name="${name}" id="${name}" class="no-icheck" data-initial-value="${data.enabled}"` +
            ">";
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

          return (
            '<input type="text" class="form-control" disabled ' +
            `name="${name}" id="${name}" value="${data}" data-initial-value="${data}"` +
            ">"
          );
        },
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteRevServers"]').on("click", deleteRecord);
      $('button[id^="editRevServers"]').on("click", editRecord);
      $('button[id^="saveRevServers"]').on("click", saveRecord).hide();
      $('button[id^="cancelRevServers"]').on("click", restoreRecord).hide();

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data, displayNum, displayIndex, dataIndex) {
      $(row).attr("data-index", dataIndex);
      var button = `<button type="button"
                      class="btn btn-primary btn-xs"
                      id="editRevServers_${dataIndex}"
                      data-index="${dataIndex}"
                      title="Edit"
                      ${setByEnv ? "disabled" : ""}>
                      <span class="far fa-edit"></span>
                    </button>
                    <button type="button"
                      class="btn btn-danger btn-xs"
                      id="deleteRevServers_${dataIndex}"
                      data-index="${dataIndex}"
                      data-tag="${Object.values(data)}"
                      data-type="revServers"
                      title="Delete"
                      ${setByEnv ? "disabled" : ""}>
                      <span class="far fa-trash-alt"></span>
                    </button>
                    <button type="button"
                      class="btn btn-success btn-xs"
                      id="saveRevServers_${dataIndex}"
                      data-index="${dataIndex}"
                      title="Save changes">
                      <span class="far fa-save"></span>
                    </button>
                    <button type="button"
                      class="btn btn-warning btn-xs"
                      id="cancelRevServers_${dataIndex}"
                      data-index="${dataIndex}"
                      data-tag="${Object.values(data)}"
                      title="Undo changes">
                      <span class="fas fa-undo"></span>
                    </button>`;
      $("td:eq(4)", row).html(button);
    },
    dom: "<'row'<'col-sm-12'<'table-responsive'tr>>><'row'<'col-sm-12'i>>",
    paging: false,
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
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
}

function editRecord() {
}

function saveRecord() {
}

function restoreRecord() {
}

function deleteRecord() {
  // Get the tags
  var tags = [$(this).attr("data-tag")];

  // Check input validity
  if (!Array.isArray(tags)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (var tag in tags) {
    if (Object.hasOwnProperty.call(tags, tag)) {
      delRevServers(tags);
    }
  }
}

function delRevServers(elem) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting reverse server...", elem);
  const url = "/api/config/dns/revServers/" + encodeURIComponent(elem);

  $.ajax({
    url: url,
    method: "DELETE",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-trash-alt", "Successfully deleted reverse server", elem);
      $("#revServers-table").DataTable().ajax.reload(null, false);
    })
    .fail(function (data, exception) {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while deleting DNS record: <code>" + elem + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function processDNSConfig() {
  $.ajax({
    url: "/api/config/dns?detailed=true", // We need the detailed output to get the DNS server list
  })
    .done(function (data) {
      // Initialize the DNS upstreams
      fillDNSupstreams(data.config.dns.upstreams, data.dns_servers);
      setConfigValues("dns", "dns", data.config.dns);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(document).ready(function () {
  processDNSConfig();
  revServerDataTable();

  // Button to add a new reverse server
  $("#btnAdd-revServers").on("click", function () {
    utils.disableAll();
    var items = [];
    items[0] = $("#enabled-revServers").is(":checked") ? "true" : "false";
    items[1] = $("#network-revServers").val();
    items[2] = $("#server-revServers").val();
    items[3] = $("#domain-revServers").val();
    const elem = items.join(",");
    const url = "/api/config/dns/revServers/" + encodeURIComponent(elem);
    utils.showAlert("info", "", "Adding reverse server...", elem);
    $.ajax({
      url: url,
      method: "PUT",
    })
      .done(function () {
        utils.enableAll();
        utils.showAlert("success", "fas fa-plus", "Successfully added reverse server", elem);
        $("#revServers-table tfoot .form-control").val("");
        $("#enabled-revServers").prop("checked", true);
        $("#revServers-table").DataTable().ajax.reload(null, false);
      })
      .fail(function (data, exception) {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while deleting reverse server", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });
});
