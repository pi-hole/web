/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, moment:false */

"use strict";

globalThis._isLoginPage = false;

const REFRESH_INTERVAL = {
  logs: 500, // 0.5 sec (logs page)
  summary: 1000, // 1 sec (dashboard)
  query_log: 2000, // 2 sec (Query Log)
  blocking: 10_000, // 10 sec (all pages, sidebar)
  metrics: 10_000, // 10 sec (settings page)
  system: 20_000, // 20 sec (all pages, sidebar)
  query_types: 60_000, // 1 min (dashboard)
  upstreams: 60_000, // 1 min (dashboard)
  top_lists: 60_000, // 1 min (dashboard)
  messages: 60_000, // 1 min (all pages)
  version: 120_000, // 2 min (all pages, footer)
  ftl: 120_000, // 2 min (all pages, sidebar)
  hosts: 120_000, // 2 min (settings page)
  history: 600_000, // 10 min (dashboard)
  clients: 600_000, // 10 min (dashboard)
};

function secondsTimeSpanToHMS(s) {
  const h = Math.floor(s / 3600); //Get whole hours
  s -= h * 3600;
  const m = Math.floor(s / 60); //Get remaining minutes
  s -= m * 60;
  return h + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s); //zero padding on minutes and seconds
}

function piholeChanged(blocking, timer = null) {
  const status = $("#status");
  const ena = $("#pihole-enable");
  const dis = $("#pihole-disable");
  const enaT = $("#enableTimer");

  if (timer !== null && Number.parseFloat(timer) > 0) {
    enaT.text(Date.now() + Number.parseFloat(timer) * 1000);
    setTimeout(countDown, 100);
  }

  switch (blocking) {
    case "enabled": {
      status.html("<i class='fa fa-circle fa-fw text-green-light'></i>&nbsp;&nbsp;Active");
      ena.hide();
      dis.show();
      dis.removeClass("active");

      break;
    }

    case "disabled": {
      status.html("<i class='fa fa-circle fa-fw text-red'></i>&nbsp;&nbsp;Blocking disabled");
      ena.show();
      dis.hide();

      break;
    }

    case "failure": {
      status.html(
        "<i class='fa-solid fa-triangle-exclamation fa-fw text-red'></i>&nbsp;&nbsp;<span class='text-red'>DNS server failure</span>"
      );
      ena.hide();
      dis.hide();

      break;
    }

    default: {
      status.html("<i class='fa fa-circle fa-fw text-red'></i>&nbsp;&nbsp;Status unknown");
      ena.hide();
      dis.hide();
    }
  }
}

function countDown() {
  const ena = $("#enableLabel");
  const enaT = $("#enableTimer");
  const target = new Date(Number.parseInt(enaT.text(), 10));
  const seconds = Math.round((target.getTime() - Date.now()) / 1000);

  //Stop and remove timer when user enabled early
  if ($("#pihole-enable").is(":hidden")) {
    ena.text("Enable Blocking");
    return;
  }

  if (seconds > 0) {
    setTimeout(countDown, 1000);
    ena.text("Enable Blocking (" + secondsTimeSpanToHMS(seconds) + ")");
  } else {
    ena.text("Enable Blocking");
    piholeChanged("enabled", null);
    if (localStorage) {
      localStorage.removeItem("countDownTarget");
    }
  }
}

function checkBlocking() {
  $.ajax({
    url: document.body.dataset.apiurl + "/dns/blocking",
    method: "GET",
  })
    .done(data => {
      piholeChanged(data.blocking, data.timer);
      utils.setTimer(checkBlocking, REFRESH_INTERVAL.blocking);
    })
    .fail(data => {
      apiFailure(data);
      utils.setTimer(checkBlocking, 3 * REFRESH_INTERVAL.blocking);
    });
}

function piholeChange(action, duration) {
  let btnStatus = null;

  switch (action) {
    case "enable":
      btnStatus = $("#flip-status-enable");
      break;
    case "disable":
      btnStatus = $("#flip-status-disable");
      break;
    default: // Do nothing
      break;
  }

  btnStatus.html("<i class='fa fa-spinner fa-spin'> </i>");
  $.ajax({
    url: document.body.dataset.apiurl + "/dns/blocking",
    method: "POST",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      blocking: action === "enable",
      timer: Number.parseInt(duration, 10) > 0 ? Number.parseInt(duration, 10) : null,
    }),
  })
    .done(data => {
      if (data.blocking === action + "d") {
        btnStatus.html("");
        piholeChanged(data.blocking, data.timer);
      }
    })
    .fail(data => {
      apiFailure(data);
    });
}

function testCookies() {
  if (navigator.cookieEnabled) {
    return true;
  }

  // set and read cookie
  document.cookie = "cookietest=1";
  const ret = document.cookie.includes("cookietest=");

  // delete cookie
  document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";

  return ret;
}

function applyCheckboxRadioStyle() {
  // Get all radio/checkboxes for theming, with the exception of the two radio buttons on the custom disable timer,
  // as well as every element with an id that starts with "status_"
  const sel = $("input[type='radio'],input[type='checkbox']")
    .not("#selSec")
    .not("#selMin")
    .not("#expert-settings")
    .not("#only-changed")
    .not("[id^=status_]");
  sel.parent().removeClass();
  sel.parent().addClass("icheck-primary");
}

let systemTimer;
let versionTimer;
function updateInfo() {
  updateSystemInfo();
  updateVersionInfo();
  updateFtlInfo();
  checkBlocking();
}

function updateQueryFrequency(intl, frequency) {
  let freq = Number.parseFloat(frequency) * 60;
  let unit = "q/min";
  let title = "Queries per minute";
  if (freq > 100) {
    freq /= 60;
    unit = "q/s";
    title = "Queries per second";
  }

  // Determine number of fraction digits based on the frequency
  // - 0 fraction digits for frequencies > 10
  // - 1 fraction digit for frequencies between 1 and 10
  // - 2 fraction digits for frequencies < 1
  const fractionDigits = freq > 10 ? 0 : freq < 1 ? 2 : 1;
  const userLocale = navigator.language || "en-US";
  const freqFormatted = new Intl.NumberFormat(userLocale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(freq);

  $("#query_frequency")
    .html(
      '<i class="fa fa-fw fa-gauge-high text-green-light"></i>&nbsp;&nbsp;' +
        freqFormatted +
        "&thinsp;" +
        unit
    )
    .attr("title", title);
}

let ftlinfoTimer = null;
function updateFtlInfo() {
  $.ajax({
    url: document.body.dataset.apiurl + "/info/ftl",
  })
    .done(data => {
      const ftl = data.ftl;
      const database = ftl.database;
      const intl = new Intl.NumberFormat();
      $("#num_groups").text(intl.format(database.groups));
      $("#num_clients").text(intl.format(database.clients));
      $("#num_lists").text(intl.format(database.lists));
      $("#num_gravity").text(intl.format(database.gravity));
      $("#num_allowed")
        .text(intl.format(database.domains.allowed + database.regex.allowed))
        .attr(
          "title",
          "Allowed: " +
            intl.format(database.domains.allowed) +
            " exact domains and " +
            intl.format(database.regex.allowed) +
            " regex filters are enabled"
        );
      $("#num_denied")
        .text(intl.format(database.domains.denied + database.regex.denied))
        .attr(
          "title",
          "Denied: " +
            intl.format(database.domains.denied) +
            " exact domains and " +
            intl.format(database.regex.denied) +
            " regex filters are enabled"
        );
      updateQueryFrequency(intl, ftl.query_frequency);
      $("#sysinfo-cpu-ftl").text("(" + ftl["%cpu"].toFixed(1) + "% used by FTL)");
      $("#sysinfo-ram-ftl").text("(" + ftl["%mem"].toFixed(1) + "% used by FTL)");
      $("#sysinfo-pid-ftl").text(ftl.pid);
      const startdate = moment()
        .subtract(ftl.uptime, "milliseconds")
        .format("dddd, MMMM Do YYYY, HH:mm:ss");
      $("#sysinfo-uptime-ftl").text(startdate);

      $(".destructive_action").prop("disabled", !ftl.allow_destructive);
      $(".destructive_action").prop(
        "title",
        ftl.allow_destructive ? "" : "Destructive actions are disabled by a config setting"
      );

      clearTimeout(ftlinfoTimer);
      ftlinfoTimer = utils.setTimer(updateFtlInfo, REFRESH_INTERVAL.ftl);
    })
    .fail(data => {
      apiFailure(data);
    });
}

function updateSystemInfo() {
  $.ajax({
    url: document.body.dataset.apiurl + "/info/system",
  })
    .done(data => {
      const system = data.system;
      const percentRAM = system.memory.ram["%used"];
      const percentSwap = system.memory.swap["%used"];
      let totalRAM = system.memory.ram.total / 1024;
      let totalRAMUnit = "MB";
      if (totalRAM > 1024) {
        totalRAM /= 1024;
        totalRAMUnit = "GB";
      }

      let totalSwap = system.memory.swap.total / 1024;
      let totalSwapUnit = "MB";
      if (totalSwap > 1024) {
        totalSwap /= 1024;
        totalSwapUnit = "GB";
      }

      const swap =
        system.memory.swap.total > 0
          ? ((1e2 * system.memory.swap.used) / system.memory.swap.total).toFixed(1) + " %"
          : "N/A";
      let color;
      color = percentRAM > 75 ? "text-red" : "text-green-light";
      $("#memory").html(
        '<i class="fa fa-fw fa-memory ' +
          color +
          '"></i>&nbsp;&nbsp;Memory usage:&nbsp;' +
          percentRAM.toFixed(1) +
          "&thinsp;%"
      );
      $("#memory").prop(
        "title",
        "Total memory: " + totalRAM.toFixed(1) + " " + totalRAMUnit + ", Swap usage: " + swap
      );
      $("#sysinfo-memory-ram").text(
        percentRAM.toFixed(1) + "% of " + totalRAM.toFixed(1) + " " + totalRAMUnit + " is used"
      );
      if (system.memory.swap.total > 0) {
        $("#sysinfo-memory-swap").text(
          percentSwap.toFixed(1) + "% of " + totalSwap.toFixed(1) + " " + totalSwapUnit + " is used"
        );
      } else {
        $("#sysinfo-memory-swap").text("No swap space available");
      }

      color = system.cpu.load.raw[0] > system.cpu.nprocs ? "text-red" : "text-green-light";
      $("#cpu").html(
        '<i class="fa fa-fw fa-microchip ' +
          color +
          '"></i>&nbsp;&nbsp;Load:&nbsp;' +
          system.cpu.load.raw[0].toFixed(2) +
          "&nbsp;/&nbsp;" +
          system.cpu.load.raw[1].toFixed(2) +
          "&nbsp;/&nbsp;" +
          system.cpu.load.raw[2].toFixed(2)
      );
      $("#cpu").prop(
        "title",
        "Load averages for the past 1, 5, and 15 minutes\non a system with " +
          system.cpu.nprocs +
          " core" +
          (system.cpu.nprocs > 1 ? "s" : "") +
          " running " +
          system.procs +
          " processes " +
          (system.cpu.load.raw[0] > system.cpu.nprocs
            ? " (load is higher than the number of cores)"
            : "")
      );
      $("#sysinfo-cpu").text(
        system.cpu["%cpu"].toFixed(1) +
          "% on " +
          system.cpu.nprocs +
          " core" +
          (system.cpu.nprocs > 1 ? "s" : "") +
          " running " +
          system.procs +
          " processes"
      );

      const startdate = moment()
        .subtract(system.uptime, "seconds")
        .format("dddd, MMMM Do YYYY, HH:mm:ss");
      $("#status").prop(
        "title",
        "System uptime: " +
          moment.duration(1000 * system.uptime).humanize() +
          " (running since " +
          startdate +
          ")"
      );
      $("#sysinfo-uptime").text(
        moment.duration(1000 * system.uptime).humanize() + " (running since " + startdate + ")"
      );
      $("#sysinfo-system-overlay").hide();

      clearTimeout(systemTimer);
      systemTimer = utils.setTimer(updateSystemInfo, REFRESH_INTERVAL.system);
    })
    .fail(data => {
      apiFailure(data);
    });
}

function apiFailure(data) {
  if (data.status === 401) {
    // Unauthorized, reload page
    globalThis.location.reload();
  }
}

// Method to compare two versions. Returns 1 if v2 is smaller, -1 if v1 is
// smaller, 0 if equal
// Credits: https://www.geeksforgeeks.org/compare-two-version-numbers/
function versionCompare(v1, v2) {
  // vnum stores each numeric part of version
  let vnum1 = 0;
  let vnum2 = 0;

  // Remove possible leading "v" in v1 and v2
  if (v1[0] === "v") {
    v1 = v1.substring(1);
  }

  if (v2[0] === "v") {
    v2 = v2.substring(1);
  }

  // loop until both string are processed
  for (let i = 0, j = 0; i < v1.length || j < v2.length; ) {
    // storing numeric part of version 1 in vnum1
    while (i < v1.length && v1[i] !== ".") {
      vnum1 = vnum1 * 10 + (v1[i] - "0");
      i++;
    }

    // storing numeric part of version 2 in vnum2
    while (j < v2.length && v2[j] !== ".") {
      vnum2 = vnum2 * 10 + (v2[j] - "0");
      j++;
    }

    if (vnum1 > vnum2) return 1;
    if (vnum2 > vnum1) return -1;

    // if equal, reset variables and go for next numeric part
    vnum1 = 0;
    vnum2 = 0;
    i++;
    j++;
  }

  return 0;
}

function updateVersionInfo() {
  $.ajax({
    url: document.body.dataset.apiurl + "/info/version",
  }).done(data => {
    const version = data.version;
    let updateAvailable = false;
    let dockerUpdate = false;
    let isDocker = false;
    $("#versions").empty();
    $("#update-hint").empty();

    const versions = [
      {
        name: "Docker Tag",
        local: version.docker.local,
        remote: version.docker.remote,
        branch: null,
        hash: null,
        url: "https://github.com/pi-hole/docker-pi-hole/releases",
      },
      {
        name: "Core",
        local: version.core.local.version || "N/A",
        remote: version.core.remote.version,
        branch: version.core.local.branch,
        hash: version.core.local.hash,
        hash_remote: version.core.remote.hash,
        url: "https://github.com/pi-hole/pi-hole/releases",
      },
      {
        name: "FTL",
        local: version.ftl.local.version || "N/A",
        remote: version.ftl.remote.version,
        branch: version.ftl.local.branch,
        hash: version.ftl.local.hash,
        hash_remote: version.ftl.remote.hash,
        url: "https://github.com/pi-hole/FTL/releases",
      },
      {
        name: "Web interface",
        local: version.web.local.version || "N/A",
        remote: version.web.remote.version,
        branch: version.web.local.branch,
        hash: version.web.local.hash,
        hash_remote: version.web.remote.hash,
        url: "https://github.com/pi-hole/web/releases",
      },
    ];

    // Check if we are running in a Docker container
    if (version.docker.local !== null) {
      isDocker = true;
    }

    for (const v of versions) {
      if (v.local !== null) {
        // reset update status for each component
        let updateComponentAvailable = false;
        let localVersion = v.local;
        if (v.branch !== null && v.hash !== null) {
          if (v.branch === "master") {
            localVersion = v.local.split("-")[0];
            localVersion =
              '<a href="' +
              v.url +
              "/" +
              localVersion +
              '" rel="noopener noreferrer" target="_blank">' +
              localVersion +
              "</a>";
            if (versionCompare(v.local, v.remote) === -1) {
              // Update available
              updateComponentAvailable = true;
            }
          } else {
            // non-master branch
            localVersion = "vDev (" + v.branch + ", " + v.hash + ")";
            if (v.hash_remote && v.hash !== v.hash_remote) {
              // hash differ > Update available
              updateComponentAvailable = true;
              // link to the commit history instead of release page
              v.url = v.url.replace("releases", "commits/" + v.branch);
            }
          }
        }

        if (v.name === "Docker Tag") {
          if (versionCompare(v.local, v.remote) === -1) {
            // Display update information for the docker tag
            updateComponentAvailable = true;
            dockerUpdate = true;
          } else {
            // Display the link for the current tag
            localVersion =
              '<a href="' +
              v.url +
              "/" +
              localVersion +
              '" rel="noopener noreferrer" target="_blank">' +
              localVersion +
              "</a>";
          }
        }

        // Display update information of individual components only if we are not running in a Docker container
        if ((!isDocker || v.name === "Docker Tag") && updateComponentAvailable) {
          $("#versions").append(
            "<li><strong>" +
              v.name +
              "</strong> " +
              localVersion +
              '&nbsp;&middot; <a class="lookatme" data-lookatme-text="Update available!" href="' +
              v.url +
              '" rel="noopener noreferrer" target="_blank">Update available!</a></li>'
          );
          // if at least one component can be updated, display the update-hint footer
          updateAvailable = true;
        } else {
          $("#versions").append("<li><strong>" + v.name + "</strong> " + localVersion + "</li>");
        }
      }
    }

    if (dockerUpdate)
      $("#update-hint").html(
        'To install updates, <a href="https://github.com/pi-hole/docker-pi-hole#upgrading-persistence-and-customizations" rel="noopener noreferrer" target="_blank">replace this old container with a fresh upgraded image</a>.'
      );
    else if (updateAvailable)
      $("#update-hint").html(
        'To install updates, run <code><a href="https://docs.pi-hole.net/main/update/" rel="noopener noreferrer" target="_blank">pihole -up</a></code>.'
      );

    clearTimeout(versionTimer);
    versionTimer = utils.setTimer(updateVersionInfo, REFRESH_INTERVAL.version);
  });
}

$(() => {
  if (!globalThis._isLoginPage) updateInfo();
  const enaT = $("#enableTimer");
  const target = new Date(Number.parseInt(enaT.text(), 10));
  const seconds = Math.round((target.getTime() - Date.now()) / 1000);
  if (seconds > 0) {
    setTimeout(countDown, 100);
  }

  if (!testCookies() && $("#cookieInfo").length > 0) {
    $("#cookieInfo").show();
  }

  // Apply icheckbox/iradio style
  applyCheckboxRadioStyle();

  if (!globalThis._isLoginPage) {
    // Run check immediately after page loading ...
    utils.checkMessages();
    // ... and then periodically
    utils.setInter(utils.checkMessages, REFRESH_INTERVAL.messages);
  }
});

// Handle Enable/Disable
$("#pihole-enable").on("click", e => {
  e.preventDefault();
  localStorage.removeItem("countDownTarget");
  piholeChange("enable", "");
});
$("#pihole-disable-indefinitely").on("click", e => {
  e.preventDefault();
  piholeChange("disable", "0");
});
$("#pihole-disable-10s").on("click", e => {
  e.preventDefault();
  piholeChange("disable", "10");
});
$("#pihole-disable-30s").on("click", e => {
  e.preventDefault();
  piholeChange("disable", "30");
});
$("#pihole-disable-5m").on("click", e => {
  e.preventDefault();
  piholeChange("disable", "300");
});
$("#pihole-disable-custom").on("click", e => {
  e.preventDefault();
  let custVal = $("#customTimeout").val();
  custVal = $("#btnMins").hasClass("active") ? custVal * 60 : custVal;
  piholeChange("disable", custVal);
});

function initSettingsLevel() {
  // Apply expert settings level
  applyExpertSettings();

  const expertSettingsElement = document.getElementById("expert-settings");

  // Skip init if element is not present (e.g. on login page)
  if (!expertSettingsElement) return;

  // Restore settings level from local storage (if available) or default to "false"
  const storedExpertSettings = localStorage.getItem("expert_settings");
  if (storedExpertSettings === null) {
    localStorage.setItem("expert_settings", "false");
  }

  expertSettingsElement.checked = storedExpertSettings === "true";

  // Init the settings level toggle
  $(expertSettingsElement).bootstrapToggle({
    on: "Expert",
    off: "Basic",
    size: "small",
    offstyle: "success",
    onstyle: "danger",
    width: "80px",
  });

  // Add handler for settings level toggle
  $(expertSettingsElement).on("change", event => {
    localStorage.setItem("expert_settings", event.currentTarget.checked ? "true" : "false");
    applyExpertSettings();
  });
}

// Apply expert settings level, this will hide/show elements with the class
// "settings-level-expert" depending on the current settings level
// If "expert_settings" is not set, we default to !"true"
function applyExpertSettings() {
  const expertSettingsNodes = document.querySelectorAll(".settings-level-expert");
  if (expertSettingsNodes.length === 0) return;

  if (localStorage.getItem("expert_settings") === "true") {
    for (const element of expertSettingsNodes) element.classList.remove("d-none");
  } else {
    for (const element of expertSettingsNodes) element.classList.toggle("d-none", true);

    // If we left with an empty page (no visible boxes) after switching from
    // Expert to Basic settings, redirect to admin/settings/system instead
    //  - class settings-selector is present (this class is present in every
    //    settings pages, but not in other pages - it is there on the "all"
    //    settings page as well, even when the button has "only modified"
    //    functionality there), and
    //  - there are no visible boxes (the page is empty)
    if (document.querySelector(".settings-selector") && $(".box:visible").length === 0) {
      globalThis.location.href = `${document.body.dataset.webhome}settings/system`;
    }
  }
}

function addAdvancedInfo() {
  const advancedInfoSource = $("#advanced-info-data");
  const advancedInfoTarget = $("#advanced-info");
  const isTLS = location.protocol === "https:";
  const clientIP = advancedInfoSource.data("client-ip");
  const XForwardedFor = globalThis.atob(advancedInfoSource.data("xff") || "") || null;
  const starttime = Number.parseFloat(advancedInfoSource.data("starttime"));
  const endtime = Number.parseFloat(advancedInfoSource.data("endtime"));
  const totaltime = 1e3 * (endtime - starttime);

  // Show advanced info
  advancedInfoTarget.empty();

  // Add TLS and client IP info
  advancedInfoTarget.append(
    'Client: <i class="fa-solid fa-fw fa-lock' +
      (isTLS ? " text-green" : "-open") +
      '" title="Your connection is ' +
      (isTLS ? "" : "NOT ") +
      'end-to-end encrypted (TLS/SSL)"></i>&nbsp;<span id="client-id"></span><br>'
  );

  // Add client IP info
  $("#client-id").text(XForwardedFor ?? clientIP);
  if (XForwardedFor) {
    // If X-Forwarded-For is set, show the X-Forwarded-For in italics and add
    // the real client IP as tooltip
    $("#client-id").css("font-style", "italic");
    $("#client-id").prop("title", "Original remote address: " + clientIP);
  }

  // Add render time info
  advancedInfoTarget.append(
    "Render time: " + (totaltime > 0.5 ? totaltime.toFixed(1) : totaltime.toFixed(3)) + " ms"
  );
}

$(() => {
  initSettingsLevel();
  addAdvancedInfo();
});

// Install custom AJAX error handler for DataTables
// if $.fn.dataTable is available
if ($.fn.dataTable) {
  $.fn.dataTable.ext.errMode = function (settings, helpPage, message) {
    // eslint-disable-next-line no-console
    console.log("DataTables warning: " + message);
  };
}
