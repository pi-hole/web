/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, Chart:false, THEME_COLORS:false, customTooltips:false, htmlLegendPlugin:false,doughnutTooltip:false */

var hostinfoTimer = null;
var cachePieChart = null;
var cacheSize = 0;

var querytypeids = [];
function updateCachePie(data) {
  var v = [],
    c = [],
    k = [],
    i = 0,
    sum = 0;

  // Compute total number of queries
  Object.keys(data).forEach(function (item) {
    sum += data[item];
  });

  // Sort data by value, put OTHER always as last
  var sorted = Object.keys(data).sort(function (a, b) {
    if (a === "OTHER") {
      return 1;
    } else if (b === "OTHER") {
      return -1;
    } else {
      return data[b] - data[a];
    }
  });

  // Rebuild data object
  var tmp = {};
  sorted.forEach(function (item) {
    tmp[item] = data[item];
  });
  data = tmp;

  // Add empty space to chart
  data.empty = cacheSize - sum;
  sum = cacheSize;

  // Fill chart with data
  querytypeids = [];
  Object.keys(data).forEach(function (item) {
    v.push((100 * data[item]) / sum);
    c.push(item !== "empty" ? THEME_COLORS[i % THEME_COLORS.length] : "#80808040");
    k.push(item);
    querytypeids.push(i + 1);

    i++;
  });

  // Build a single dataset with the data to be pushed
  var dd = { data: v, backgroundColor: c };
  // and push it at once
  cachePieChart.data.datasets[0] = dd;
  cachePieChart.data.labels = k;
  $("#cache-pie-chart .overlay").hide();
  cachePieChart.update();

  // Don't use rotation animation for further updates
  cachePieChart.options.animation.duration = 0;
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
      // Update every 120 seconds
      clearTimeout(hostinfoTimer);
      hostinfoTimer = setTimeout(updateHostInfo, 120000);
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
      $("#" + prefix + key).text(lval + " (" + ((100 * val) / data.sum).toFixed(1) + "%)");
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

      $("div[id^='sysinfo-metrics-overlay']").hide();
      // Update every 10 seconds
      clearTimeout(metricsTimer);
      metricsTimer = setTimeout(updateMetrics, 10000);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function showQueryLoggingButton() {
  $.ajax({
    url: "/api/config/dns/queryLogging",
  })
    .done(function (data) {
      if (data.config.dns.queryLogging) {
        $("#disableLoggingButton").show();
        $("#enableLoggingButton").hide();
      } else {
        $("#disableLoggingButton").hide();
        $("#enableLoggingButton").show();
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(".confirm-poweroff").confirm({
  text: "Are you sure you want to send a poweroff command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#poweroffform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, poweroff",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});
$(".confirm-reboot").confirm({
  text: "Are you sure you want to send a reboot command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#rebootform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, reboot",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-restartdns").confirm({
  text: "Are you sure you want to send a restart command to your DNS server?",
  title: "Confirmation required",
  confirm: function () {
    $("#restartdnsform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flushlogs").confirm({
  text: "Are you sure you want to flush your logs?",
  title: "Confirmation required",
  confirm: function () {
    $("#flushlogsform").submit();
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
  text: "Are you sure you want to flush your network table?",
  title: "Confirmation required",
  confirm: function () {
    $("#flusharpform").submit();
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

$(".confirm-disablelogging-noflush").confirm({
  text: "Are you sure you want to disable logging?",
  title: "Confirmation required",
  confirm: function () {
    $("#disablelogsform-noflush").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, disable logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(function () {
  updateHostInfo();
  updateMetrics();
  showQueryLoggingButton();

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
