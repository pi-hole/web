/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2024 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils: false, apiUrl: false */

$(function () {
  $.ajax({
    url: apiUrl + "/network/gateway",
    data: { detailed: true },
  }).done(function (data) {
    var intl = new Intl.NumberFormat();
    const gateway = data.gateway;
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

    var interfaces = {};
    var masterInterfaces = {};

    // For each interface in data.interface, create a new object and push it to json
    data.interfaces.forEach(function (interface) {
      const carrierColor = interface.carrier ? "text-green" : "text-red";
      let stateText = interface.state.toUpperCase();
      if (stateText === "UNKNOWN" && interface.flags !== undefined && interface.flags.length > 0) {
        if (interface.flags.includes("pointopoint")) {
          // WireGuards, etc. -> the typo is intentional
          stateText = "P2P";
        } else if (interface.flags.includes("loopback")) {
          // Loopback interfaces
          stateText = "LOOPBACK";
        }
      }

      const status = `<span class="${carrierColor}">${stateText}</span>`;

      let master = null;
      if (interface.master !== undefined) {
        // Find interface.master in data.interfaces
        master = data.interfaces.find(obj => obj.index === interface.master).name;
      }

      // Show an icon for indenting slave interfaces
      const indentIcon =
        master === null ? "" : "<span class='child-interface-icon'>&nbsp;&rdca;</span> ";

      var obj = {
        text: indentIcon + interface.name + " - " + status,
        class: gateways.has(interface.name) ? "text-bold" : null,
        icon: master === null ? "fa fa-network-wired fa-fw" : "",
        nodes: [],
      };

      if (master !== null) {
        obj.nodes.push({
          text: "Master interface: <code>" + utils.escapeHtml(master) + "</code>",
          icon: "fa fa-network-wired fa-fw",
        });

        if (master in masterInterfaces) {
          masterInterfaces[master].push(interface.name);
        } else {
          masterInterfaces[master] = [interface.name];
        }
      }

      if (interface.speed) {
        obj.nodes.push({
          text: "Speed: " + intl.format(interface.speed) + " Mbit/s",
          icon: "fa fa-tachometer-alt fa-fw",
        });
      }

      if (interface.type !== undefined) {
        obj.nodes.push({
          text: "Type: " + utils.escapeHtml(interface.type),
          icon: "fa fa-network-wired fa-fw",
        });
      }

      if (interface.flags !== undefined && interface.flags.length > 0) {
        obj.nodes.push({
          text: "Flags: " + utils.escapeHtml(interface.flags.join(", ")),
          icon: "fa fa-flag fa-fw",
        });
      }

      if (interface.address !== undefined) {
        let extra = "";
        if (interface.perm_address !== undefined && interface.perm_address !== interface.address) {
          extra = " (permanent: <code>" + utils.escapeHtml(interface.perm_address) + "</code>)";
        }

        obj.nodes.push({
          text:
            "Hardware address: <code>" + utils.escapeHtml(interface.address) + "</code>" + extra,
          icon: "fa fa-map-marker-alt fa-fw",
        });
      }

      if (interface.addresses !== undefined) {
        const addrs = {
          text:
            interface.addresses.length +
            (interface.addresses.length === 1 ? " address" : " addresses") +
            " connected to interface",
          icon: "fa fa-map-marker-alt fa-fw",
          nodes: [],
        };

        for (const addr of interface.addresses) {
          let extraaddr = "";
          if (addr.prefixlen !== undefined) {
            extraaddr += " / <code>" + addr.prefixlen + "</code>";
          }

          if (addr.address_type !== undefined) {
            let familyextra = "";
            if (addr.family === "inet") {
              familyextra = "IPv4 ";
            } else if (addr.family === "inet6") {
              familyextra = "IPv6 ";
            }

            extraaddr += " (" + familyextra + utils.escapeHtml(addr.address_type) + ")";
          }

          let family = "";
          if (addr.family !== undefined) {
            family = addr.family + "</code> <code>";
          }

          const jaddr = {
            text:
              "Address: <code>" + family + utils.escapeHtml(addr.address) + "</code>" + extraaddr,
            icon: "fa fa-map-marker-alt fa-fw",
            nodes: [],
          };
          if (addr.local !== undefined) {
            jaddr.nodes.push({
              text: "Local: <code>" + utils.escapeHtml(addr.local) + "</code>",
              icon: "fa fa-map-marker-alt fa-fw",
            });
          }

          if (addr.broadcast !== undefined) {
            jaddr.nodes.push({
              text: "Broadcast: <code>" + utils.escapeHtml(addr.broadcast) + "</code>",
              icon: "fa fa-map-marker-alt fa-fw",
            });
          }

          if (addr.scope !== undefined) {
            jaddr.nodes.push({
              text: "Scope: " + utils.escapeHtml(addr.scope),
              icon: "fa fa-map-marker-alt fa-fw",
            });
          }

          if (addr.flags !== undefined && addr.flags.length > 0) {
            jaddr.nodes.push({
              text: "Flags: " + utils.escapeHtml(addr.flags.join(", ")),
              icon: "fa fa-map-marker-alt fa-fw",
            });
          }

          if (addr.prefered !== undefined) {
            const pref =
              addr.prefered === 4294967295 ? "forever" : intl.format(addr.prefered) + " s";
            jaddr.nodes.push({
              text: "Preferred lifetime: " + pref,
              icon: "fa fa-clock fa-fw",
            });
          }

          if (addr.valid !== undefined) {
            const valid = addr.valid === 4294967295 ? "forever" : intl.format(addr.valid) + " s";
            jaddr.nodes.push({
              text: "Valid lifetime: " + valid,
              icon: "fa fa-clock fa-fw",
            });
          }

          if (addr.cstamp !== undefined) {
            jaddr.nodes.push({
              text: "Created: " + new Date(addr.cstamp * 1000).toLocaleString(),
              icon: "fa fa-clock fa-fw",
            });
          }

          if (addr.tstamp !== undefined) {
            jaddr.nodes.push({
              text: "Last updated: " + new Date(addr.tstamp * 1000).toLocaleString(),
              icon: "fa fa-clock fa-fw",
            });
          }

          addrs.nodes.push(jaddr);
        }

        obj.nodes.push(addrs);
      }

      if (interface.stats !== undefined) {
        const stats = {
          text: "Statistics",
          icon: "fa fa-chart-line fa-fw",
          expanded: false,
          nodes: [],
        };
        if (interface.stats.rx_bytes !== undefined) {
          stats.nodes.push({
            text:
              "RX bytes: " +
              intl.format(interface.stats.rx_bytes.value) +
              " " +
              interface.stats.rx_bytes.unit,
            icon: "fa fa-download fa-fw",
          });
        }

        if (interface.stats.tx_bytes !== undefined) {
          stats.nodes.push({
            text:
              "TX bytes: " +
              intl.format(interface.stats.tx_bytes.value) +
              " " +
              interface.stats.tx_bytes.unit,
            icon: "fa fa-upload fa-fw",
          });
        }

        if (interface.stats.rx_packets !== undefined) {
          stats.nodes.push({
            text: "RX packets: " + intl.format(interface.stats.rx_packets),
            icon: "fa fa-download fa-fw",
          });
        }

        if (interface.stats.rx_errors !== undefined) {
          stats.nodes.push({
            text:
              "RX errors: " +
              intl.format(interface.stats.rx_errors) +
              " (" +
              ((interface.stats.rx_errors / interface.stats.rx_packets) * 100).toFixed(1) +
              "%)",
            icon: "fa fa-download fa-fw",
          });
        }

        if (interface.stats.rx_dropped !== undefined) {
          stats.nodes.push({
            text:
              "RX dropped: " +
              intl.format(interface.stats.rx_dropped) +
              " (" +
              ((interface.stats.rx_dropped / interface.stats.rx_packets) * 100).toFixed(1) +
              "%)",
            icon: "fa fa-download fa-fw",
          });
        }

        if (interface.stats.tx_packets !== undefined) {
          stats.nodes.push({
            text: "TX packets: " + intl.format(interface.stats.tx_packets),
            icon: "fa fa-upload fa-fw",
          });
        }

        if (interface.stats.tx_errors !== undefined) {
          stats.nodes.push({
            text:
              "TX errors: " +
              intl.format(interface.stats.tx_errors) +
              " (" +
              ((interface.stats.tx_errors / interface.stats.tx_packets) * 100).toFixed(1) +
              "%)",
            icon: "fa fa-upload fa-fw",
          });
        }

        if (interface.stats.tx_dropped !== undefined) {
          stats.nodes.push({
            text:
              "TX dropped: " +
              intl.format(interface.stats.tx_dropped) +
              " (" +
              ((interface.stats.tx_dropped / interface.stats.tx_packets) * 100).toFixed(1) +
              "%)",
            icon: "fa fa-upload fa-fw",
          });
        }

        if (interface.stats.multicast !== undefined) {
          stats.nodes.push({
            text: "Multicast: " + intl.format(interface.stats.multicast),
            icon: "fa fa-broadcast-tower fa-fw",
          });
        }

        if (interface.stats.collisions !== undefined) {
          stats.nodes.push({
            text: "Collisions: " + intl.format(interface.stats.collisions),
            icon: "fa fa-exchange-alt fa-fw",
          });
        }

        obj.nodes.push(stats);
      }

      const furtherDetails = {
        text: "Further details",
        icon: "fa fa-info-circle fa-fw",
        expanded: false,
        nodes: [],
      };

      furtherDetails.nodes.push(
        {
          text:
            "Carrier: " +
            (interface.carrier
              ? "<span class='text-green'>Connected</span>"
              : "<span class='text-red'>Disconnected</span>"),
          icon: "fa fa-link fa-fw",
        },
        {
          text: "State: " + utils.escapeHtml(interface.state.toUpperCase()),
          icon: "fa fa-server fa-fw",
        }
      );

      if (interface.parent_dev_name !== undefined) {
        let extra = "";
        if (interface.parent_dev_bus_name !== undefined) {
          extra = " @ " + utils.escapeHtml(interface.parent_dev_bus_name);
        }

        furtherDetails.nodes.push({
          text:
            "Parent device: <code>" +
            utils.escapeHtml(interface.parent_dev_name) +
            extra +
            "</code>",
          icon: "fa fa-network-wired fa-fw",
        });
      }

      if (interface.carrier_changes !== undefined) {
        furtherDetails.nodes.push({
          text: "Carrier changes: " + intl.format(interface.carrier_changes),
          icon: "fa fa-exchange-alt fa-fw",
        });
      }

      if (interface.broadcast) {
        furtherDetails.nodes.push({
          text: "Broadcast: <code>" + utils.escapeHtml(interface.broadcast) + "</code>",
          icon: "fa fa-broadcast-tower fa-fw",
        });
      }

      if (interface.mtu) {
        let extra = "";
        if (interface.min_mtu !== undefined && interface.max_mtu !== undefined) {
          extra +=
            " (min: " +
            intl.format(interface.min_mtu) +
            " bytes, max: " +
            intl.format(interface.max_mtu) +
            " bytes)";
        }

        furtherDetails.nodes.push({
          text: "MTU: " + intl.format(interface.mtu) + " bytes" + extra,
          icon: "fa fa-arrows-alt-h fa-fw",
        });
      }

      if (interface.txqlen) {
        furtherDetails.nodes.push({
          text: "TX queue length: " + intl.format(interface.txqlen),
          icon: "fa fa-file-upload fa-fw",
        });
      }

      if (interface.promiscuity !== undefined) {
        furtherDetails.nodes.push({
          text: "Promiscuity mode: " + (interface.promiscuity ? "Yes" : "No"),
          icon: "fa fa-eye fa-fw",
        });
      }

      if (interface.qdisc !== undefined) {
        furtherDetails.nodes.push({
          text: "Scheduler: " + utils.escapeHtml(interface.qdisc),
          icon: "fa fa-network-wired fa-fw",
        });
      }

      if (furtherDetails.nodes.length > 0) {
        obj.nodes.push(furtherDetails);
      }

      interfaces[interface.name] = obj;
    });

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

    // Build the tree view
    const json = [];
    for (const iface of interfaceList) {
      json.push(interfaces[iface]);
    }

    $("#tree").bstreeview({
      data: json,
      expandIcon: "fa fa-angle-down fa-fw",
      collapseIcon: "fa fa-angle-right fa-fw",
      parentsMarginLeft: "0",
      indent: 2.5,
    });
    $("#spinner").hide();

    // Expand gateway interfaces by default
    for (const gw of gateways) {
      const div = $("#tree").find("div:contains('" + gw + "')");
      div.removeClass("collapsed");
      div.next("div").collapse("show");
      // Change expand icon to collapse icon
      div.find("i:first").removeClass("fa-angle-right").addClass("fa-angle-down");
    }
  });
});
