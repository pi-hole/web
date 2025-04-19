/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, applyCheckboxRadioStyle:false, setConfigValues: false */

"use strict";

function fillDnsUpstreams({ value, flags }, servers) {
  const dnsUpstreamsTextfield = document.getElementById("DNSupstreamsTextfield");
  const dnsUpstreamsTableBody = document.querySelector("#DNSupstreamsTable > tbody");

  const isDisabled = flags.env_var === true;
  const disabledAttribute = isDisabled ? " disabled" : "";

  dnsUpstreamsTextfield.disabled = isDisabled;

  let checkboxIndex = 0;
  let customServers = value.length;

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
        const isChecked = value.includes(address) || value.includes(`${address}#53`);

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
    dnsUpstreamsTableBody.insertAdjacentHTML("beforeend", row);
  }

  // Set up event listeners
  setupCheckboxListeners(dnsUpstreamsTableBody, dnsUpstreamsTextfield);

  // Initialize textfield
  updateDNSserversTextfield(value, customServers);

  // Expand the box if there are custom servers
  if (customServers > 0) {
    const customBox = document.getElementById("custom-servers-box");
    utils.toggleBoxCollapse(customBox, true);
  }

  // Hide the loading animation
  document.getElementById("dns-upstreams-overlay").classList.add("d-none");

  // Apply styling to the new checkboxes
  applyCheckboxRadioStyle();
}

function setupCheckboxListeners(dnsUpstreamsTableBody, dnsUpstreamsTextfield) {
  const checkboxes = dnsUpstreamsTableBody.querySelectorAll("input[id^='DNSupstreams-']");
  for (const input of checkboxes) {
    input.addEventListener("change", () => {
      let upstreams = dnsUpstreamsTextfield.value.split("\n");
      let customServerCount = 0;

      const tableCheckboxes = dnsUpstreamsTableBody.querySelectorAll("input");
      for (const input of tableCheckboxes) {
        const address = input.closest("td").title;
        const isChecked = input.checked;

        if (isChecked && !upstreams.includes(address)) {
          upstreams = [...upstreams, address];
        } else if (!isChecked && upstreams.includes(address)) {
          upstreams = upstreams.filter(item => item !== address);
        }

        if (upstreams.includes(address)) customServerCount--;
      }

      // The variable will contain a negative value, we need to add the length
      // to get the correct number of custom servers
      customServerCount += upstreams.length;
      updateDNSserversTextfield(upstreams, customServerCount);
    });
  }
}

function setInterfaceName(name) {
  // If name is provided, update directly and return early
  if (name !== "") {
    updateInterfaceElements(name);
    return;
  }

  // If dns.interface is empty in pihole.toml, we use the first interface
  // (same default value used by FTL)
  utils
    .fetchFactory(`${document.body.dataset.apiurl}/network/gateway`)
    .then(data => {
      updateInterfaceElements(data.gateway[0].interface);
    })
    .catch(() => {
      updateInterfaceElements("not found");
    });
}

function updateInterfaceElements(name) {
  document.getElementById("interface-name-1").textContent = name;
  document.getElementById("interface-name-2").textContent = name;
}

// Update the textfield with all upstream servers, including custom ones
function updateDNSserversTextfield(upstreams, customServers) {
  const dnsUpstreamsTextfield = document.getElementById("DNSupstreamsTextfield");
  const customServersTitle = document.getElementById("custom-servers-title");

  dnsUpstreamsTextfield.value = upstreams.join("\n");
  customServersTitle.textContent = `(${customServers} custom ${utils.pluralize(customServers, "server")} enabled)`;
}

function processDNSConfig() {
  utils
    // We need the detailed output to get the DNS server list
    .fetchFactory(`${document.body.dataset.apiurl}/config/dns?detailed=true`)
    .then(data => {
      // Initialize the DNS upstreams
      fillDnsUpstreams(data.config.dns.upstreams, data.dns_servers);
      setInterfaceName(data.config.dns.interface.value);
      setConfigValues("dns", "dns", data.config.dns);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  processDNSConfig();
});
