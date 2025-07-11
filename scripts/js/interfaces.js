/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2024 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
  const url = `${document.body.dataset.apiurl}/network/gateway?detailed=true`;

  fetch(url, {
    method: "GET",
    headers: {
      "X-CSRF-TOKEN": csrfToken,
    },
  })
    .then(response => (response.ok ? response.json() : apiFailure(response)))
    .then(data => {
      const intl = new Intl.NumberFormat();
      const gateways = extractGateways(data.gateway);
      const { interfaces, masterInterfaces } = processInterfaces(data.interfaces, gateways, intl);
      const masterInterfacesSorted = sortInterfaces(interfaces, masterInterfaces);
      const json = masterInterfacesSorted.map(iface => interfaces[iface]);

      renderTreeView(json);
      expandGatewayInterfaces(gateways);
    });
});

function extractGateways(gateway) {
  // Get all objects in gateway that has family == "inet"
  const inet = gateway.find(obj => obj.family === "inet");
  // Get first object in gateway that has family == "inet6"
  const inet6 = gateway.find(obj => obj.family === "inet6");
  // Create a set of the gateways when they are found
  const gateways = new Set();

  if (inet !== undefined) {
    gateways.add(inet.gateway);
  }

  if (inet6 !== undefined) {
    gateways.add(inet6.gateway);
  }

  return gateways;
}

function processInterfaces(interfacesData, gateways, intl) {
  const interfaces = {};
  const masterInterfaces = {};

  // For each interface in data.interface, create a new object and push it to json
  for (const iface of interfacesData) {
    const obj = createInterfaceObject({ iface, gateways, intl, masterInterfaces, interfacesData });
    interfaces[iface.name] = obj;
  }

  return { interfaces, masterInterfaces };
}

function createInterfaceObject({ iface, gateways, intl, masterInterfaces, interfacesData }) {
  const carrierColor = iface.carrier ? "text-green" : "text-red";
  const stateText = determineStateText(iface);
  const status = `<span class="${carrierColor}">${stateText}</span>`;
  const master = findMasterInterface({
    iface,
    masterInterfaces,
    interfacesData,
  });
  // Show an icon for indenting slave interfaces
  const icon = master === null ? "" : '<span class="child-interface-icon">&nbsp;&rdca;</span> ';
  const obj = {
    text: `${icon + iface.name} - ${status}`,
    class: gateways.has(iface.name) ? "text-bold" : null,
    icon: master === null ? "fa fa-network-wired fa-fw" : "",
    nodes: [],
  };

  addMasterDetails(obj, master);
  addSpeedDetails(obj, iface, intl);
  addTypeDetails(obj, iface);
  addFlagsDetails(obj, iface);
  addHardwareAddressDetails(obj, iface);
  addAddressDetails(obj, iface, intl);
  addStatisticsDetails(obj, iface, intl);
  addFurtherDetails(obj, iface, intl);

  return obj;
}

function determineStateText(iface) {
  let stateText = iface.state.toUpperCase();

  if (stateText === "UNKNOWN" && iface.flags !== undefined && iface.flags.length > 0) {
    // WireGuards, etc. -> the typo is intentional
    if (iface.flags.includes("pointopoint")) {
      stateText = "P2P";
      // Loopback interfaces
    } else if (iface.flags.includes("loopback")) {
      stateText = "LOOPBACK";
    }
  }

  return stateText;
}

function findMasterInterface({ iface, masterInterfaces, interfacesData }) {
  if (iface.master === undefined) return null;

  const masterObj = interfacesData.find(obj => obj.index === iface.master);
  if (!masterObj) return null;

  const masterName = masterObj.name;
  if (masterName in masterInterfaces) {
    masterInterfaces[masterName].push(iface.name);
  } else {
    masterInterfaces[masterName] = [iface.name];
  }

  return masterName;
}

function addMasterDetails(obj, master) {
  if (master !== null) {
    obj.nodes.push({
      text: `Master interface: <code>${utils.escapeHtml(master)}</code>`,
      icon: "fa fa-network-wired fa-fw",
    });
  }
}

function addSpeedDetails(obj, iface, intl) {
  if (iface.speed) {
    obj.nodes.push({
      text: `Speed: ${intl.format(iface.speed)} Mbit/s`,
      icon: "fa fa-tachometer-alt fa-fw",
    });
  }
}

function addTypeDetails(obj, iface) {
  if (iface.type !== undefined) {
    obj.nodes.push({
      text: `Type: ${utils.escapeHtml(iface.type)}`,
      icon: "fa fa-network-wired fa-fw",
    });
  }
}

function addFlagsDetails(obj, iface) {
  if (iface.flags !== undefined && iface.flags.length > 0) {
    obj.nodes.push({
      text: `Flags: ${utils.escapeHtml(iface.flags.join(", "))}`,
      icon: "fa fa-flag fa-fw",
    });
  }
}

function addHardwareAddressDetails(obj, iface) {
  if (iface.address === undefined) return;

  const extra =
    iface.perm_address !== undefined && iface.perm_address !== iface.address
      ? ` (permanent: <code>${utils.escapeHtml(iface.perm_address)}</code>)`
      : "";

  obj.nodes.push({
    text: `Hardware address: <code>${utils.escapeHtml(iface.address)}</code>${extra}`,
    icon: "fa fa-map-marker-alt fa-fw",
  });
}

function addAddressDetails(obj, iface, intl) {
  if (iface.addresses === undefined) return;

  const count = iface.addresses.length;
  const label = count === 1 ? " address" : " addresses";
  const text = `${count + label} connected to interface`;

  const addresses = {
    text,
    icon: "fa fa-map-marker-alt fa-fw",
    nodes: [],
  };

  for (const addr of iface.addresses) {
    const jaddr = createAddressNode(addr, intl);
    addresses.nodes.push(jaddr);
  }

  obj.nodes.push(addresses);
}

function createAddressNode(addr, intl) {
  let extraAddr = addr.prefixlen !== undefined ? ` / <code>${addr.prefixlen}</code>` : "";

  if (addr.address_type !== undefined) {
    let familyextra = "";
    if (addr.family === "inet") {
      familyextra = "IPv4 ";
    } else if (addr.family === "inet6") {
      familyextra = "IPv6 ";
    }

    extraAddr += ` (${familyextra}${utils.escapeHtml(addr.address_type)})`;
  }

  const family = addr.family !== undefined ? `${addr.family}</code> <code>` : "";

  const jaddr = {
    text: `Address: <code>${family}${utils.escapeHtml(addr.address)}</code>${extraAddr}`,
    icon: "fa fa-map-marker-alt fa-fw",
    nodes: [],
  };

  if (addr.local !== undefined) {
    jaddr.nodes.push({
      text: `Local: <code>${utils.escapeHtml(addr.local)}</code>`,
      icon: "fa fa-map-marker-alt fa-fw",
    });
  }

  if (addr.broadcast !== undefined) {
    jaddr.nodes.push({
      text: `Broadcast: <code>${utils.escapeHtml(addr.broadcast)}</code>`,
      icon: "fa fa-map-marker-alt fa-fw",
    });
  }

  if (addr.scope !== undefined) {
    jaddr.nodes.push({
      text: `Scope: ${utils.escapeHtml(addr.scope)}`,
      icon: "fa fa-map-marker-alt fa-fw",
    });
  }

  if (addr.flags !== undefined && addr.flags.length > 0) {
    jaddr.nodes.push({
      text: `Flags: ${utils.escapeHtml(addr.flags.join(", "))}`,
      icon: "fa fa-map-marker-alt fa-fw",
    });
  }

  if (addr.prefered !== undefined) {
    const pref = addr.prefered === 4_294_967_295 ? "forever" : `${intl.format(addr.prefered)} s`;
    jaddr.nodes.push({
      text: `Preferred lifetime: ${pref}`,
      icon: "fa fa-clock fa-fw",
    });
  }

  if (addr.valid !== undefined) {
    const valid = addr.valid === 4_294_967_295 ? "forever" : `${intl.format(addr.valid)} s`;
    jaddr.nodes.push({
      text: `Valid lifetime: ${valid}`,
      icon: "fa fa-clock fa-fw",
    });
  }

  if (addr.cstamp !== undefined || addr.tstamp !== undefined) {
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: "short",
      timeStyle: "short",
    });

    if (addr.cstamp !== undefined) {
      jaddr.nodes.push({
        text: `Created: ${formatter.format(new Date(addr.cstamp * 1000))}`,
        icon: "fa fa-clock fa-fw",
      });
    }

    if (addr.tstamp !== undefined) {
      jaddr.nodes.push({
        text: `Last updated: ${formatter.format(new Date(addr.tstamp * 1000))}`,
        icon: "fa fa-clock fa-fw",
      });
    }
  }

  return jaddr;
}

function addStatisticsDetails(obj, iface, intl) {
  if (iface.stats === undefined) return;

  const stats = {
    text: "Statistics",
    icon: "fa fa-chart-line fa-fw",
    expanded: false,
    nodes: [],
  };

  if (iface.stats.rx_bytes !== undefined) {
    stats.nodes.push({
      text: `RX bytes: ${intl.format(iface.stats.rx_bytes.value)} ${iface.stats.rx_bytes.unit}`,
      icon: "fa fa-download fa-fw",
    });
  }

  if (iface.stats.tx_bytes !== undefined) {
    stats.nodes.push({
      text: `TX bytes: ${intl.format(iface.stats.tx_bytes.value)} ${iface.stats.tx_bytes.unit}`,
      icon: "fa fa-upload fa-fw",
    });
  }

  if (iface.stats.rx_packets !== undefined) {
    stats.nodes.push({
      text: `RX packets: ${intl.format(iface.stats.rx_packets)}`,
      icon: "fa fa-download fa-fw",
    });
  }

  if (iface.stats.rx_errors !== undefined && iface.stats.rx_packets) {
    const rxErrorPercentage = ((iface.stats.rx_errors / iface.stats.rx_packets) * 100).toFixed(1);
    stats.nodes.push({
      text: `RX errors: ${intl.format(iface.stats.rx_errors)} (${rxErrorPercentage}%)`,
      icon: "fa fa-download fa-fw",
    });
  }

  if (iface.stats.rx_dropped !== undefined && iface.stats.rx_packets) {
    const rxDropped = iface.stats.rx_dropped;
    const rxPackets = iface.stats.rx_packets;
    const rxDroppedPercentage = ((rxDropped / rxPackets) * 100).toFixed(1);
    stats.nodes.push({
      text: `RX dropped: ${intl.format(rxDropped)} (${rxDroppedPercentage}%)`,
      icon: "fa fa-download fa-fw",
    });
  }

  if (iface.stats.tx_packets !== undefined) {
    stats.nodes.push({
      text: `TX packets: ${intl.format(iface.stats.tx_packets)}`,
      icon: "fa fa-upload fa-fw",
    });
  }

  if (iface.stats.tx_errors !== undefined && iface.stats.tx_packets) {
    const txErrorPercentage = ((iface.stats.tx_errors / iface.stats.tx_packets) * 100).toFixed(1);
    stats.nodes.push({
      text: `TX errors: ${intl.format(iface.stats.tx_errors)} (${txErrorPercentage}%)`,
      icon: "fa fa-upload fa-fw",
    });
  }

  if (iface.stats.tx_dropped !== undefined && iface.stats.tx_packets) {
    const txDropped = iface.stats.tx_dropped;
    const txPackets = iface.stats.tx_packets;
    const txDroppedPercentage = ((txDropped / txPackets) * 100).toFixed(1);
    stats.nodes.push({
      text: `TX dropped: ${intl.format(txDropped)} (${txDroppedPercentage}%)`,
      icon: "fa fa-upload fa-fw",
    });
  }

  if (iface.stats.multicast !== undefined) {
    stats.nodes.push({
      text: `Multicast: ${intl.format(iface.stats.multicast)}`,
      icon: "fa fa-broadcast-tower fa-fw",
    });
  }

  if (iface.stats.collisions !== undefined) {
    stats.nodes.push({
      text: `Collisions: ${intl.format(iface.stats.collisions)}`,
      icon: "fa fa-exchange-alt fa-fw",
    });
  }

  obj.nodes.push(stats);
}

function addFurtherDetails(obj, iface, intl) {
  const furtherDetails = {
    text: "Further details",
    icon: "fa fa-info-circle fa-fw",
    expanded: false,
    nodes: [],
  };

  const carrierStatus = iface.carrier
    ? '<span class="text-green">Connected</span>'
    : '<span class="text-red">Disconnected</span>';

  furtherDetails.nodes.push(
    {
      text: `Carrier: ${carrierStatus}`,
      icon: "fa fa-link fa-fw",
    },
    {
      text: `State: ${utils.escapeHtml(iface.state.toUpperCase())}`,
      icon: "fa fa-server fa-fw",
    }
  );

  if (iface.parent_dev_name !== undefined) {
    const extra =
      iface.parent_dev_bus_name !== undefined
        ? ` @ ${utils.escapeHtml(iface.parent_dev_bus_name)}`
        : "";

    furtherDetails.nodes.push({
      text: `Parent device: <code>${utils.escapeHtml(iface.parent_dev_name)}${extra}</code>`,
      icon: "fa fa-network-wired fa-fw",
    });
  }

  if (iface.carrier_changes !== undefined) {
    furtherDetails.nodes.push({
      text: `Carrier changes: ${intl.format(iface.carrier_changes)}`,
      icon: "fa fa-exchange-alt fa-fw",
    });
  }

  if (iface.broadcast) {
    furtherDetails.nodes.push({
      text: `Broadcast: <code>${utils.escapeHtml(iface.broadcast)}</code>`,
      icon: "fa fa-broadcast-tower fa-fw",
    });
  }

  if (iface.mtu) {
    let extra = "";
    if (iface.min_mtu !== undefined && iface.max_mtu !== undefined) {
      const minMtu = intl.format(iface.min_mtu);
      const maxMtu = intl.format(iface.max_mtu);
      extra += ` (min: ${minMtu} bytes, max: ${maxMtu} bytes)`;
    }

    furtherDetails.nodes.push({
      text: `MTU: ${intl.format(iface.mtu)} bytes${extra}`,
      icon: "fa fa-arrows-alt-h fa-fw",
    });
  }

  if (iface.txqlen) {
    furtherDetails.nodes.push({
      text: `TX queue length: ${intl.format(iface.txqlen)}`,
      icon: "fa fa-file-upload fa-fw",
    });
  }

  if (iface.promiscuity !== undefined) {
    furtherDetails.nodes.push({
      text: `Promiscuity mode: ${iface.promiscuity ? "Yes" : "No"}`,
      icon: "fa fa-eye fa-fw",
    });
  }

  if (iface.qdisc !== undefined) {
    furtherDetails.nodes.push({
      text: `Scheduler: ${utils.escapeHtml(iface.qdisc)}`,
      icon: "fa fa-network-wired fa-fw",
    });
  }

  if (furtherDetails.nodes.length > 0) {
    obj.nodes.push(furtherDetails);
  }
}

function sortInterfaces(interfaces, masterInterfaces) {
  // Sort interfaces based on masterInterfaces. If an item is found in
  // masterInterfaces, it should be placed after the master interface
  const ifaces = Object.keys(interfaces);
  const interfaceList = Object.keys(masterInterfaces);

  // Add slave interfaces next to master interfaces
  for (const master of interfaceList) {
    if (master in masterInterfaces) {
      for (const slave of masterInterfaces[master]) {
        ifaces.splice(ifaces.indexOf(slave), 1);
        interfaceList.splice(interfaceList.indexOf(master) + 1, 0, slave);
      }
    }
  }

  // Add interfaces that are not slaves at the top of the list (in reverse order)
  for (const iface of ifaces.reverse()) {
    if (!interfaceList.includes(iface)) {
      interfaceList.unshift(iface);
    }
  }

  return interfaceList;
}

function renderTreeView(json) {
  $("#tree").bstreeview({
    data: json,
    expandIcon: "fa fa-angle-down fa-fw",
    collapseIcon: "fa fa-angle-right fa-fw",
    parentsMarginLeft: "0",
    indent: 2.5,
  });
  document.getElementById("spinner").classList.add("d-none");
}

function expandGatewayInterfaces(gateways) {
  // Expand gateway interfaces by default
  const tree = document.getElementById("tree");
  if (!tree) return;

  for (const gw of gateways) {
    // Find all divs containing the gateway name
    const divs = tree.querySelectorAll("div");
    for (const div of divs) {
      if (!div.textContent.includes(gw)) continue;

      div.classList.remove("collapsed");
      const nextDiv = div.nextElementSibling;
      if (nextDiv) $(nextDiv).collapse("show");

      // Change expand icon to collapse icon
      const icon = div.querySelector("i");
      if (!icon) continue;

      icon.classList.remove("fa-angle-right");
      icon.classList.add("fa-angle-down");
    }
  }
}
