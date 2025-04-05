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
    for (const input of $("#DNSupstreamsTable input")) {
      const title = $(input).closest("td").attr("title");
      if (input.checked && !upstreams.includes(title)) {
        // Add server to array
        upstreams.push(title);
      } else if (!input.checked && upstreams.includes(title)) {
        // Remove server from array
        removeFromArray(upstreams, title);
      }

      if (upstreams.includes(title)) customServers--;
    }

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
    .fail(data => {
      apiFailure(data);
    });
}

$(() => {
  processDNSConfig();
});
