/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

/* global utils:false */

"use strict";

let tableApi;

// How many IPs do we show at most per device?
const MAXIPDISPLAY = 3;
const DAY_IN_SECONDS = 24 * 60 * 60;

function handleAjaxError(xhr, textStatus) {
  if (textStatus === "timeout") {
    alert("The server took too long to send the data.");
  } else if (!xhr.responseText.includes("Connection refused")) {
    alert(`An unknown error occurred while loading the data.\n${xhr.responseText}`);
  } else {
    alert("An error occurred while loading the data: Connection refused. Is FTL running?");
  }

  document.getElementById("network-entries_processing")?.classList.add("d-none");
  tableApi.clear();
  tableApi.draw();
}

function getTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function valueToHex(c) {
  return Math.round(c).toString(16).padStart(2, "0");
}

function rgbToHex([r, g, b]) {
  return `#${valueToHex(r)}${valueToHex(g)}${valueToHex(b)}`;
}

function mixColors(ratio, rgb1, rgb2) {
  return [
    (1 - ratio) * rgb1[0] + ratio * rgb2[0],
    (1 - ratio) * rgb1[1] + ratio * rgb2[1],
    (1 - ratio) * rgb1[2] + ratio * rgb2[2],
  ];
}

function parseColor(input) {
  const match = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);

  if (match) {
    return [match[1], match[2], match[3]];
  }
}

function deleteNetworkEntry(event) {
  const tr = event.currentTarget.closest("tr");
  const { id, hwaddr } = tr.dataset;

  utils.disableAll();
  utils.showAlert({ type: "info", title: "Deleting network table entry..." });

  $.ajax({
    url: `${document.body.dataset.apiurl}/network/devices/${id}`,
    method: "DELETE",
    success() {
      utils.enableAll();
      utils.showAlert({
        type: "success",
        icon: "far fa-trash-alt",
        title: "Successfully deleted network table entry",
        message: hwaddr,
      });
      tableApi.row(tr).remove().draw(false).ajax.reload(null, false);
    },
    error(data, exception) {
      utils.apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: `Error while deleting network table entry with ID ${id}`,
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  tableApi = $("#network-entries").DataTable({
    rowCallback(row, data) {
      let color = "";
      let iconClasses = "";
      const lastQuery = Number.parseInt(data.lastQuery, 10);
      const diff = getTimestamp() - lastQuery;

      const networkRecent = utils.getStylePropertyFromClass("network-recent", "background-color");
      const networkOld = utils.getStylePropertyFromClass("network-old", "background-color");
      const networkOlder = utils.getStylePropertyFromClass("network-older", "background-color");
      const networkNever = utils.getStylePropertyFromClass("network-never", "background-color");

      if (lastQuery > 0) {
        if (diff <= DAY_IN_SECONDS) {
          // Last query came in within the last 24 hours
          // Color: light-green to light-yellow
          const ratio = Number(diff) / DAY_IN_SECONDS;
          color = rgbToHex(mixColors(ratio, parseColor(networkRecent), parseColor(networkOld)));
          iconClasses = "fas fa-check";
        } else {
          // Last query was longer than 24 hours ago
          // Color: light-orange
          color = networkOlder;
          iconClasses = "fas fa-question";
        }
      } else {
        // This client has never sent a query to Pi-hole, color light-red
        color = networkNever;
        iconClasses = "fas fa-times";
      }

      const tds = row.querySelectorAll("td");

      // Set determined background color
      row.style.backgroundColor = color;
      // Add icon to the status column
      tds[6].innerHTML = `<i class="${iconClasses}"></i>`;

      // Insert "Never" into Last Query field when we have
      // never seen a query from this device
      if (data.lastQuery === 0) {
        tds[4].textContent = "Never";
      }

      // Set number of queries to localized string (add thousand separators)
      tds[5].textContent = utils.formatNumber(data.numQueries);

      const ips = [];
      const iptitles = [];

      // Sort IPs, IPv4 before IPv6, then alphabetically
      data.ips.sort((a, b) => {
        if (a.ip.includes(":") && !b.ip.includes(":")) {
          return 1;
        }

        if (!a.ip.includes(":") && b.ip.includes(":")) {
          return -1;
        }

        return a.ip.localeCompare(b.ip);
      });

      for (const { ip, name } of data.ips) {
        const iptext = name !== null && name.length > 0 ? `${ip} (${name})` : ip;

        iptitles.push(iptext);

        // Only add IPs to the table if we have not reached the maximum
        if (ips.length < MAXIPDISPLAY) {
          ips.push(`<a href="queries?client_ip=${ip}">${iptext}</a>`);
        }
      }

      if (data.ips.length > MAXIPDISPLAY) {
        // We hit the maximum above, add "..." to symbolize we would have more to show here
        ips.push("...");
        // Show the IPs on the title when there are more than MAXIPDISPLAY items
        tds[0].title = iptitles.join("\n");
      }

      // Show the IPs in the first column
      tds[0].innerHTML = ips.join("<br>");

      // MAC + Vendor field if available
      if (data.macVendor && data.macVendor.length > 0) {
        tds[1].innerHTML = `${utils.escapeHtml(data.hwaddr)}<br>${utils.escapeHtml(data.macVendor)}`;
      }

      // Make mock MAC addresses italics and add title
      if (data.hwaddr.startsWith("ip-")) {
        tds[1].style.fontStyle = "italic";
        tds[1].title = "Mock MAC address";
      }

      // Add delete button
      row.dataset.id = data.id;
      row.dataset.hwaddr = data.hwaddr;
      const button =
        `<button type="button" class="btn btn-danger btn-xs" id="deleteNetworkEntry_${data.id}">` +
        '<span class="far fa-trash-alt"></span></button>';
      tds[7].innerHTML = button;
    },
    dom:
      "<'row'<'col-sm-12'f>>" +
      "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    ajax: {
      url: `${document.body.dataset.apiurl}/network/devices`,
      type: "GET",
      dataType: "json",
      data: {
        max_devices: 999,
        max_addresses: 25,
      },
      error: handleAjaxError,
      dataSrc: "devices",
    },
    autoWidth: false,
    processing: true,
    order: [[6, "desc"]],
    columns: [
      { data: "id", visible: false },
      { data: "ips[].ip", type: "ip-address", width: "25%" },
      { data: "hwaddr", width: "10%" },
      { data: "interface", width: "4%" },
      {
        data: "firstSeen",
        width: "8%",
        render(data, type) {
          return type === "display" ? utils.datetime(data) : data;
        },
      },
      {
        data: "lastQuery",
        width: "8%",
        render(data, type) {
          return type === "display" ? utils.datetime(data) : data;
        },
      },
      { data: "numQueries", width: "9%", render: $.fn.dataTable.render.text() },
      { data: null, width: "6%", orderable: false },
      { data: null, width: "6%", orderable: false },
      { data: "ips[].name", visible: false, class: "hide" },
    ],
    drawCallback() {
      const deleteNetworkButtons = document.querySelectorAll('button[id^="deleteNetworkEntry_"]');
      for (const btn of deleteNetworkButtons) {
        btn.addEventListener("click", deleteNetworkEntry);
      }

      // Remove visible dropdown to prevent orphaning
      const dropdowns = document.querySelectorAll("body > .bootstrap-select.dropdown");
      for (const el of dropdowns) el.remove();
    },
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("network_table", data);
    },
    stateLoadCallback() {
      return utils.stateLoadCallback("network_table");
    },
    columnDefs: [
      {
        targets: [-1, -2],
        data: null,
        defaultContent: "",
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
  });

  // Disable autocorrect in the search box
  utils.disableAutocorrect();
});
