/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, Chart:false, THEME_COLORS:false, customTooltips:false, htmlLegendPlugin:false,doughnutTooltip:false, ChartDeferred:false, REFRESH_INTERVAL: false, utils: false */

var hostinfoTimer = null;
var cachePieChart = null;
var cacheSize = 0,
  cacheEntries = 0;

// Register the ChartDeferred plugin to all charts:
Chart.register(ChartDeferred);
Chart.defaults.set("plugins.deferred", {
  yOffset: "20%",
  delay: 300,
});

function updateCachePie(data) {
  var v = [],
    c = [],
    k = [],
    i = 0;

  // Compute total number of cache entries
  cacheEntries = 0;
  Object.keys(data).forEach(function (item) {
    cacheEntries += data[item].valid;
    cacheEntries += data[item].stale;
  });

  // Sort data by value, put OTHER always as last
  var sorted = Object.keys(data).sort(function (a, b) {
    if (a === "OTHER") {
      return 1;
    } else if (b === "OTHER") {
      return -1;
    } else {
      return data[b].valid + data[b].stale - (data[a].valid + data[a].stale);
    }
  });

  // Rebuild data object
  var tmp = {};
  sorted.forEach(function (item) {
    tmp[item] = data[item];
  });
  data = tmp;

  // Add empty space to chart
  data.empty = {};
  data.empty.valid = cacheSize - cacheEntries;

  // Fill chart with data
  Object.keys(data).forEach(function (item) {
    if (data[item].valid > 0) {
      v.push((100 * data[item].valid) / cacheSize);
      c.push(item !== "empty" ? THEME_COLORS[i++ % THEME_COLORS.length] : "#80808040");
      k.push(item);
    }

    if (data[item].stale > 0) {
      // There are no stale empty entries
      v.push((100 * data[item].stale) / cacheSize);
      c.push(THEME_COLORS[i++ % THEME_COLORS.length]);
      k.push(item + " (stale)");
    }
  });

  // Build a single dataset with the data to be pushed
  var dd = { data: v, backgroundColor: c };
  // and push it at once
  cachePieChart.data.datasets[0] = dd;
  cachePieChart.data.labels = k;
  $("#cache-pie-chart .overlay").hide();
  // Passing 'none' will prevent rotation animation for further updates
  //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
  cachePieChart.update("none");
}

function updateHostInfo() {
  $.ajax({
    url: "/api/info/host",
  })
    .done(function (data) {
      var host = data.host;
      var uname = host.uname;
      if (uname.domainname !== "(none)") {
        $("#sysinfo-hostname").text(uname.nodename + "." + uname.domainname);
      } else {
        $("#sysinfo-hostname").text(uname.nodename);
      }

      $("#sysinfo-kernel").text(
        uname.sysname +
          " " +
          uname.nodename +
          " " +
          uname.release +
          " " +
          uname.version +
          " " +
          uname.machine
      );
      clearTimeout(hostinfoTimer);
      hostinfoTimer = utils.setTimer(updateHostInfo, REFRESH_INTERVAL.hosts);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

// Walk nested objects, create a dash-separated global key and assign the value
// to the corresponding element (add percentage for DNS replies)
function setMetrics(data, prefix) {
  var cacheData = {};
  for (const [key, val] of Object.entries(data)) {
    if (prefix === "sysinfo-dns-cache-content-") {
      // Create table row for each DNS cache entry
      // (if table exists)
      if ($("#dns-cache-table").length > 0) {
        const name =
          val.name !== "OTHER"
            ? "Valid " + (val.name !== null ? val.name : "TYPE " + val.type)
            : "Other valid";
        const tr = "<tr><th>" + name + " records in cache:</th><td>" + val.count + "</td></tr>";
        // Append row to DNS cache table
        $("#dns-cache-table").append(tr);
      }

      cacheData[val.name] = val.count;
    } else if (typeof val === "object") {
      setMetrics(val, prefix + key + "-");
    } else if (prefix === "sysinfo-dns-replies-") {
      // Compute and display percentage of DNS replies in addition to the absolute value
      const lval = val.toLocaleString();
      const percent = (100 * val) / data.sum;
      $("#" + prefix + key).text(lval + " (" + percent.toFixed(1) + "%)");
    } else {
      const lval = val.toLocaleString();
      $("#" + prefix + key).text(lval);
    }
  }

  // Draw pie chart if data is available
  if (Object.keys(cacheData).length > 0) {
    updateCachePie(cacheData);
  }
}

var metricsTimer = null;

function updateMetrics() {
  $.ajax({
    url: "/api/info/metrics",
  })
    .done(function (data) {
      var metrics = data.metrics;
      $("#dns-cache-table").empty();

      // Set global cache size
      cacheSize = metrics.dns.cache.size;

      // Set metrics
      setMetrics(metrics, "sysinfo-");

      $("#cache-utilization").text(
        cacheEntries.toLocaleString() + " (" + ((100 * cacheEntries) / cacheSize).toFixed(1) + "%)"
      );

      $("div[id^='sysinfo-metrics-overlay']").hide();
      clearTimeout(metricsTimer);
      metricsTimer = utils.setTimer(updateMetrics, REFRESH_INTERVAL.metrics);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function showQueryLoggingButton(state) {
  if (state) {
    $("#loggingButton").addClass("btn-warning");
    $("#loggingButton").removeClass("btn-success");
    $("#loggingButton").text("Disable query logging");
    $("#loggingButton").data("state", "enabled");
  } else {
    $("#loggingButton").addClass("btn-success");
    $("#loggingButton").removeClass("btn-warning");
    $("#loggingButton").text("Enable query logging");
    $("#loggingButton").data("state", "disabled");
  }
}

function getLoggingButton() {
  $.ajax({
    url: "/api/config/dns/queryLogging",
  })
    .done(function (data) {
      showQueryLoggingButton(data.config.dns.queryLogging);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(".confirm-restartdns").confirm({
  text:
    "Are you sure you want to send a restart command to your DNS server?<br><br>" +
    "This will clear the DNS cache and may temporarily interrupt your internet connection.<br>" +
    "Furthermore, you will be logged out of the web interface as consequence of this action.",
  title: "Confirmation required",
  confirm: function () {
    $.ajax({
      url: "/api/action/restartdns",
      type: "POST",
    }).fail(function (data) {
      apiFailure(data);
    });
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS server",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flushlogs").confirm({
  text:
    "Are you sure you want to flush your logs?<br><br>" +
    "<strong>This will clear all logs and cannot be undone.</strong>",
  title: "Confirmation required",
  confirm: function () {
    $.ajax({
      url: "/api/action/flush/logs",
      type: "POST",
    }).fail(function (data) {
      apiFailure(data);
    });
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flusharp").confirm({
  text:
    "Are you sure you want to flush your network table?<br><br>" +
    "<strong>This will clear all entries and cannot be undone.</strong>",
  title: "Confirmation required",
  confirm: function () {
    $.ajax({
      url: "/api/action/flush/arp",
      type: "POST",
    }).fail(function (data) {
      apiFailure(data);
    });
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush my network table",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$("#loggingButton").confirm({
  text:
    "Are you sure you want to switch query logging mode?<br><br>" +
    "<strong>This will restart the DNS server.</strong><br>" +
    "As consequence of this action, your DNS cache will be cleared and you may temporarily loose your internet connection.<br>" +
    "Furthermore, you will be logged out of the web interface.",
  title: "Confirmation required",
  confirm: function () {
    const data = {};
    data.config = {};
    data.config.dns = {};
    data.config.dns.queryLogging = $("#loggingButton").data("state") !== "enabled";
    $.ajax({
      url: "/api/config/dns/queryLogging",
      type: "PATCH",
      dataType: "json",
      processData: false,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(data),
    })
      .done(function (data) {
        showQueryLoggingButton(data.config.dns.queryLogging);
      })
      .fail(function (data) {
        apiFailure(data);
      });
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, change query logging",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(function () {
  updateHostInfo();
  updateMetrics();
  getLoggingButton();

  var ctx = document.getElementById("cachePieChart").getContext("2d");
  cachePieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{ data: [], parsing: false }],
    },
    plugins: [htmlLegendPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: true,
      elements: {
        arc: {
          borderColor: $(".box").css("background-color"),
        },
      },
      plugins: {
        htmlLegend: {
          containerID: "cache-legend",
        },
        legend: {
          display: false,
        },
        tooltip: {
          // Disable the on-canvas tooltip
          enabled: false,
          external: customTooltips,
          callbacks: {
            title: function () {
              return "Cache content";
            },
            label: doughnutTooltip,
          },
        },
      },
      animation: {
        duration: 750,
      },
    },
  });
});
