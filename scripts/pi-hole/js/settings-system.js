/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false */
/* exported updateHostInfo, updateCacheInfo */

var hostinfoTimer = null;

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
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === "object") {
      setMetrics(val, prefix + key + "-");
    } else if (prefix === "sysinfo-dns-replies-") {
      // Compute and display percentage of DNS replies in addition to the absolute value
      $("#" + prefix + key).text(val + " (" + ((100 * val) / data.sum).toFixed(1) + "%)");
    } else {
      $("#" + prefix + key).text(val);
    }
  }
}

var metricsTimer = null;

function updateMetrics() {
  $.ajax({
    url: "/api/info/metrics",
  })
    .done(function (data) {
      var metrics = data.metrics;
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
});
