/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, applyCheckboxRadioStyle:false, setConfigValues: false, apiFailure: false */

"use strict";

function fillDNSupstreams(value, servers) {
  const isDisabled = value.flags.env_var === true;
  const disabledAttribute = isDisabled ? " disabled" : "";
  $("#DNSupstreamsTextfield").prop("disabled", isDisabled);

  let checkboxIndex = 0;
  let customServers = value.value.length;

  for (const server of servers) {
    let row = "<tr>";
    // Build checkboxes for IPv4 and IPv6 and loop over both
    for (const addressType of [server.v4, server.v6]) {
      // Loop over available addresses (up to 2)
      for (let i = 0; i < 2; i++) {
        if (i >= addressType.length) {
          row += "<td></td>";
          continue;
        }

        const address = addressType[i];
        const isChecked = value.value.includes(address) || value.value.includes(`${address}#53`);

        if (isChecked) customServers--;

        row += `<td title="${address}">
                  <div>
                    <input type="checkbox" id="DNSupstreams-${checkboxIndex}"${disabledAttribute}${isChecked ? " checked" : ""}>
                    <label for="DNSupstreams-${checkboxIndex}"></label>
                  </div>
                </td>`;

        checkboxIndex++;
      }
    }

    // Add server name
    row += `<td>${server.name}</td>`;

    // Close table row
    row += "</tr>";

    // Add row to table
    $("#DNSupstreamsTable").append(row);
  }

  // Add event listener to checkboxes
  $("input[id^='DNSupstreams-']").on("change", () => {
    let upstreams = $("#DNSupstreamsTextfield").val().split("\n");
    let customServerCount = 0;

    for (const input of $("#DNSupstreamsTable input")) {
      const address = $(input).closest("td").attr("title");
      const isChecked = input.checked;

      if (isChecked && !upstreams.includes(address)) {
        upstreams = [...upstreams, address];
      } else if (!isChecked && upstreams.includes(address)) {
        upstreams = upstreams.filter(item => item !== address);
      }

      if (upstreams.includes(address)) customServerCount--;
    }

    // The variable will contain a negative value, we need to add the length to
    // get the correct number of custom servers
    customServerCount += upstreams.length;
    updateDNSserversTextfield(upstreams, customServerCount);
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
      url: `${document.body.dataset.apiurl}/network/gateway`,
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
    `(${customServers} custom server${customServers === 1 ? "" : "s"} enabled)`
  );
}

function processDNSConfig() {
  $.ajax({
    url: `${document.body.dataset.apiurl}/config/dns?detailed=true`, // We need the detailed output to get the DNS server list
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

document.addEventListener("DOMContentLoaded", () => {
  processDNSConfig();
});
