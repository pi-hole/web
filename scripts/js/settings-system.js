/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, Chart:false, THEME_COLORS:false, ChartDeferred:false, REFRESH_INTERVAL: false, utils: false */

"use strict";

let hostinfoTimer = null;
let cachePieChart = null;
let cacheSize = 0;
let cacheEntries = 0;

// Register the ChartDeferred plugin to all charts:
Chart.register(ChartDeferred);
Chart.defaults.set("plugins.deferred", {
  yOffset: "20%",
  delay: 300,
});

function updateCachePie(data) {
  // Compute total number of cache entries
  cacheEntries = 0;
  for (const item of Object.keys(data)) {
    cacheEntries += data[item].valid + data[item].stale;
  }

  // Create sorted chart data object with OTHER always last
  const chartData = Object.fromEntries(
    Object.entries(data).sort(([keyA, valA], [keyB, valB]) => {
      if (keyA === "OTHER") return 1;
      if (keyB === "OTHER") return -1;
      return valB.valid + valB.stale - (valA.valid + valA.stale);
    })
  );

  // Add empty space to chart data
  chartData.empty = {
    valid: cacheSize - cacheEntries,
    stale: 0,
  };

  const values = [];
  const colors = [];
  const labels = [];

  // Fill chart with data
  let i = 0;
  for (const [item, value] of Object.entries(chartData)) {
    if (value.valid > 0) {
      values.push((100 * value.valid) / cacheSize);
      colors.push(item !== "empty" ? THEME_COLORS[i++ % THEME_COLORS.length] : "#80808040");
      labels.push(item);
    }

    if (value.stale > 0) {
      // There are no stale empty entries
      values.push((100 * value.stale) / cacheSize);
      colors.push(THEME_COLORS[i++ % THEME_COLORS.length]);
      labels.push(`${item} (stale)`);
    }
  }

  // Build a single dataset with the data to be pushed
  cachePieChart.data = {
    datasets: [
      {
        data: values,
        backgroundColor: colors,
      },
    ],
    labels,
  };

  // Passing 'none' will prevent rotation animation for further updates
  // https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
  cachePieChart.update("none");
}

function updateHostInfo() {
  $.ajax({
    url: `${document.body.dataset.apiurl}/info/host`,
  })
    .done(({ host }) => {
      const { uname } = host;
      const hostname =
        uname.domainname !== "(none)" ? `${uname.nodename}.${uname.domainname}` : uname.nodename;
      const kernel = `${uname.sysname} ${uname.nodename} ${uname.release} ${uname.version} ${uname.machine}`;

      document.getElementById("sysinfo-hostname").textContent = hostname;
      document.getElementById("sysinfo-kernel").textContent = kernel;

      clearTimeout(hostinfoTimer);
      hostinfoTimer = utils.setTimer(updateHostInfo, REFRESH_INTERVAL.hosts);
    })
    .fail(data => {
      apiFailure(data);
    });
}

// Walk nested objects, create a dash-separated global key and assign the value
// to the corresponding element (add percentage for DNS replies)
function setMetrics(data, prefix) {
  const cacheData = {};

  for (const [key, val] of Object.entries(data)) {
    if (prefix === "sysinfo-dns-cache-content-") {
      cacheData[val.name] = val.count;

      // Create table row for each DNS cache entry (if table exists)
      const dnsTableElement = document.getElementById("dns-cache-table");
      if (dnsTableElement) {
        const name =
          val.name !== "OTHER"
            ? `Valid ${val.name !== null ? val.name : `TYPE ${val.type}`}`
            : "Other valid";
        const tr = `<tr><th>${name} records in cache:</th><td>${val.count}</td></tr>`;
        // Append row to DNS cache table
        dnsTableElement.insertAdjacentHTML("beforeend", tr);
      }
    } else if (typeof val === "object") {
      setMetrics(val, `${prefix + key}-`);
    } else if (prefix === "sysinfo-dns-replies-" && data.sum !== 0) {
      const element = document.getElementById(`${prefix}${key}`);
      if (element) {
        // Compute and display percentage of DNS replies in addition to the absolute value
        const percentage = (100 * val) / data.sum;
        element.textContent = `${utils.formatNumber(val)} (${utils.toPercent(percentage, 1)})`;
      }
    } else {
      const element = document.getElementById(`${prefix}${key}`);
      if (element) {
        element.textContent = utils.formatNumber(val);
      }
    }
  }

  // Draw pie chart if data is available
  if (Object.keys(cacheData).length > 0) {
    updateCachePie(cacheData);
  }
}

let metricsTimer = null;

function updateMetrics() {
  $.ajax({
    url: `${document.body.dataset.apiurl}/info/metrics`,
  })
    .done(({ metrics }) => {
      const dnsTableElement = document.getElementById("dns-cache-table");
      if (dnsTableElement) {
        dnsTableElement.innerHTML = "";
      }

      // Set global cache size
      cacheSize = metrics.dns.cache.size;

      // Set metrics
      setMetrics(metrics, "sysinfo-");

      const percentage = (100 * cacheEntries) / cacheSize;
      const text = `${utils.formatNumber(cacheEntries)} (${utils.toPercent(percentage, 1)})`;
      document.getElementById("cache-utilization").textContent = text;

      for (const el of document.querySelectorAll("div[id^='sysinfo-metrics-overlay']")) {
        el.classList.add("d-none");
      }

      clearTimeout(metricsTimer);
      metricsTimer = utils.setTimer(updateMetrics, REFRESH_INTERVAL.metrics);
    })
    .fail(data => {
      apiFailure(data);
    });
}

function showQueryLoggingButton(state) {
  const button = document.getElementById("loggingButton");
  if (state) {
    button.classList.add("btn-warning");
    button.classList.remove("btn-success");
    button.textContent = "Disable query logging";
    button.dataset.state = "enabled";
  } else {
    button.classList.add("btn-success");
    button.classList.remove("btn-warning");
    button.textContent = "Enable query logging";
    button.dataset.state = "disabled";
  }
}

function getLoggingButton() {
  $.ajax({
    url: `${document.body.dataset.apiurl}/config/dns/queryLogging`,
  })
    .done(data => {
      showQueryLoggingButton(data.config.dns.queryLogging);
    })
    .fail(data => {
      apiFailure(data);
    });
}

$(".confirm-restartdns").confirm({
  text:
    "Are you sure you want to send a restart command to your DNS server?<br><br>" +
    "This will clear the DNS cache and may temporarily interrupt your internet connection.<br>" +
    "Furthermore, you will be logged out of the web interface as consequence of this action.",
  title: "Confirmation required",
  confirm() {
    $.ajax({
      url: `${document.body.dataset.apiurl}/action/restartdns`,
      type: "POST",
    }).fail(data => {
      apiFailure(data);
    });
  },
  cancel() {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS server",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-default",
  dialogClass: "modal-dialog",
});

$(".confirm-flushlogs").confirm({
  text:
    "Are you sure you want to flush your logs?<br><br>" +
    "<strong>This will clear all logs and cannot be undone.</strong>",
  title: "Confirmation required",
  confirm() {
    $.ajax({
      url: `${document.body.dataset.apiurl}/action/flush/logs`,
      type: "POST",
    }).fail(data => {
      apiFailure(data);
    });
  },
  cancel() {
    // nothing to do
  },
  confirmButton: "Yes, flush logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-default",
  dialogClass: "modal-dialog",
});

$(".confirm-flusharp").confirm({
  text:
    "Are you sure you want to flush your network table?<br><br>" +
    "<strong>This will clear all entries and cannot be undone.</strong>",
  title: "Confirmation required",
  confirm() {
    $.ajax({
      url: `${document.body.dataset.apiurl}/action/flush/arp`,
      type: "POST",
    }).fail(data => {
      apiFailure(data);
    });
  },
  cancel() {
    // nothing to do
  },
  confirmButton: "Yes, flush my network table",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-default",
  dialogClass: "modal-dialog",
});

$("#loggingButton").confirm({
  text:
    "Are you sure you want to switch query logging mode?<br><br>" +
    "<strong>This will restart the DNS server.</strong><br>" +
    "As consequence of this action, your DNS cache will be cleared and you may temporarily lose your internet connection.<br>" +
    "Furthermore, you will be logged out of the web interface.",
  title: "Confirmation required",
  confirm() {
    const data = {
      config: {
        dns: {
          queryLogging: document.getElementById("loggingButton").dataset.state !== "enabled",
        },
      },
    };
    $.ajax({
      url: `${document.body.dataset.apiurl}/config/dns/queryLogging`,
      type: "PATCH",
      dataType: "json",
      processData: false,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
    })
      .done(data => {
        showQueryLoggingButton(data.config.dns.queryLogging);
      })
      .fail(data => {
        apiFailure(data);
      });
  },
  cancel() {
    // nothing to do
  },
  confirmButton: "Yes, change query logging",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-default",
  dialogClass: "modal-dialog",
});

document.addEventListener("DOMContentLoaded", () => {
  updateHostInfo();
  updateMetrics();
  getLoggingButton();

  cachePieChart = utils.createPieChart("cachePieChart", {
    legendContainerId: "cache-legend",
    tooltipTitle: "Cache content",
  });

  $.ajax({
    url: `${document.body.dataset.apiurl}/network/gateway`,
  })
    .done(({ gateway }) => {
      // Get first object in gateway that has family == "inet"
      const inet = gateway.find(obj => obj.family === "inet");
      // Get first object in gateway that has family == "inet6"
      const inet6 = gateway.find(obj => obj.family === "inet6");

      // IPv4 gateway information
      const ipv4Address = inet ? inet.local.join("\n") : "N/A";
      const ipv4Interface = inet ? inet.interface : "N/A";

      // IPv6 gateway information
      const ipv6Address = inet6 ? inet6.local.join("\n") : "N/A";
      const ipv6Interface = inet6 ? inet6.interface : "N/A";

      // Update DOM elements
      document.getElementById("sysinfo-gw-v4-addr").textContent = ipv4Address;
      document.getElementById("sysinfo-gw-v4-iface").textContent = ipv4Interface;
      document.getElementById("sysinfo-gw-v6-addr").textContent = ipv6Address;
      document.getElementById("sysinfo-gw-v6-iface").textContent = ipv6Interface;
    })
    .fail(data => {
      apiFailure(data);
    });
});
