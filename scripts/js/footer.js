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

function secondsTimeSpanToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function piholeChanged(blocking, timer = null) {
  const status = document.getElementById("status");
  const enableElement = document.getElementById("pihole-enable");
  const disableElement = document.getElementById("pihole-disable");
  const enableTimer = document.getElementById("enableTimer");

  if (timer !== null && Number.parseFloat(timer) > 0) {
    enableTimer.textContent = Date.now() + Number.parseFloat(timer) * 1000;
    setTimeout(countDown, 100);
  }

  switch (blocking) {
    case "enabled": {
      status.innerHTML = "<i class='fa fa-circle fa-fw text-green-light'></i>&nbsp;&nbsp;Active";
      enableElement.classList.add("d-none");
      disableElement.classList.remove("d-none", "active");

      break;
    }

    case "disabled": {
      status.innerHTML = "<i class='fa fa-circle fa-fw text-red'></i>&nbsp;&nbsp;Blocking disabled";
      enableElement.classList.remove("d-none");
      disableElement.classList.add("d-none");

      break;
    }

    case "failure": {
      status.innerHTML =
        "<i class='fa-solid fa-triangle-exclamation fa-fw text-red'></i>&nbsp;&nbsp;<span class='text-red'>DNS server failure</span>";
      enableElement.classList.add("d-none");
      disableElement.classList.add("d-none");

      break;
    }

    default: {
      status.innerHTML = "<i class='fa fa-circle fa-fw text-red'></i>&nbsp;&nbsp;Status unknown";
      enableElement.classList.add("d-none");
      disableElement.classList.add("d-none");
    }
  }
}

function countDown() {
  const enableLabel = document.getElementById("enableLabel");
  const enableTimer = document.getElementById("enableTimer");
  const target = new Date(Number.parseInt(enableTimer.textContent, 10));
  const seconds = Math.round((target.getTime() - Date.now()) / 1000);

  // Stop and remove timer when user enabled early
  if (!utils.isVisible(document.getElementById("pihole-enable"))) {
    enableLabel.textContent = "Enable Blocking";
    return;
  }

  if (seconds > 0) {
    setTimeout(countDown, 1000);
    enableLabel.textContent = `Enable Blocking (${secondsTimeSpanToHMS(seconds)})`;
  } else {
    enableLabel.textContent = "Enable Blocking";
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

  if (action === "enable") {
    btnStatus = $("#flip-status-enable");
  } else if (action === "disable") {
    btnStatus = $("#flip-status-disable");
  }

  btnStatus.innerHTML = "<i class='fa fa-spinner fa-spin'> </i>";
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
      if (data.blocking === `${action}d`) {
        btnStatus.innerHTML = "";
        piholeChanged(data.blocking, data.timer);
      }
    })
    .fail(data => {
      apiFailure(data);
    });
}

function testCookies() {
  if (navigator.cookieEnabled) return true;

  // set and read cookie
  document.cookie = "cookietest=1";
  const ret = document.cookie.includes("cookietest=");

  // delete cookie
  document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";

  return ret;
}

function applyCheckboxRadioStyle() {
  // Get all radio/checkboxes for theming...
  const inputs = document.querySelectorAll("input[type='radio'], input[type='checkbox']");

  for (const input of inputs) {
    // ...except for the two radio buttons on the custom disable timer,
    // as well as every element with an id that starts with "status_"
    if (
      input.id === "selSec" ||
      input.id === "selMin" ||
      input.id === "expert-settings" ||
      input.id === "only-changed" ||
      input.id.startsWith("status_")
    ) {
      continue;
    }

    // Get parent and update classes
    const parent = input.parentElement;
    if (parent) {
      parent.className = "icheck-primary";
    }
  }
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

  const queryFreqElem = document.getElementById("query_frequency");

  queryFreqElem.innerHTML = `<i class="fa fa-fw fa-gauge-high text-green-light"></i>&nbsp;&nbsp;${freqFormatted}&thinsp;${unit}`;
  queryFreqElem.title = title;
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
      document.getElementById("num_groups").textContent = intl.format(database.groups);
      document.getElementById("num_clients").textContent = intl.format(database.clients);
      document.getElementById("num_lists").textContent = intl.format(database.lists);
      document.getElementById("num_gravity").textContent = intl.format(database.gravity);

      const numAllowedEl = document.getElementById("num_allowed");
      numAllowedEl.textContent = intl.format(database.domains.allowed + database.regex.allowed);
      numAllowedEl.title =
        `Allowed: ${intl.format(database.domains.allowed)} exact domains and ` +
        `${intl.format(database.regex.allowed)} regex filters are enabled`;

      const numDeniedEl = document.getElementById("num_denied");
      numDeniedEl.textContent = intl.format(database.domains.denied + database.regex.denied);
      numDeniedEl.title =
        `Denied: ${intl.format(database.domains.denied)} exact domains and ` +
        `${intl.format(database.regex.denied)} regex filters are enabled`;
      updateQueryFrequency(intl, ftl.query_frequency);

      const sysInfoCpuFtl = document.getElementById("sysinfo-cpu-ftl");
      if (sysInfoCpuFtl !== null) {
        sysInfoCpuFtl.textContent = `(${ftl["%cpu"].toFixed(1)}% used by FTL)`;
      }

      const sysInfoRamFtl = document.getElementById("sysinfo-ram-ftl");
      if (sysInfoRamFtl !== null) {
        sysInfoRamFtl.textContent = `(${ftl["%mem"].toFixed(1)}% used by FTL)`;
      }

      const sysInfoPidFtl = document.getElementById("sysinfo-pid-ftl");
      if (sysInfoPidFtl !== null) {
        sysInfoPidFtl.textContent = ftl.pid;
      }

      const sysInfoUptimeFtl = document.getElementById("sysinfo-uptime-ftl");
      if (sysInfoUptimeFtl !== null) {
        const startDate = moment()
          .subtract(ftl.uptime, "milliseconds")
          .format("dddd, MMMM Do YYYY, HH:mm:ss");
        sysInfoUptimeFtl.textContent = startDate;
      }

      const destructiveActions = document.querySelectorAll(".destructive_action");
      for (const element of destructiveActions) {
        element.disabled = !ftl.allow_destructive;
        element.title = ftl.allow_destructive
          ? ""
          : "Destructive actions are disabled by a config setting";
      }

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
          ? ((100 * system.memory.swap.used) / system.memory.swap.total).toFixed(1) + " %"
          : "N/A";
      let color = percentRAM > 75 ? "text-red" : "text-green-light";

      const memoryEl = document.getElementById("memory");
      const sysInfoRam = document.getElementById("sysinfo-memory-ram");
      const sysInfoSwapEl = document.getElementById("sysinfo-memory-swap");
      const cpuEl = document.getElementById("cpu");
      const sysInfoCpu = document.getElementById("sysinfo-cpu");
      const statusEl = document.getElementById("status");
      const sysInfoUptime = document.getElementById("sysinfo-uptime");
      const sysInfoSystemOverlay = document.getElementById("sysinfo-system-overlay");

      memoryEl.innerHTML =
        '<i class="fa fa-fw fa-memory ' +
        color +
        '"></i>&nbsp;&nbsp;Memory usage:&nbsp;' +
        percentRAM.toFixed(1) +
        "&thinsp;%";
      memoryEl.title =
        "Total memory: " + totalRAM.toFixed(1) + " " + totalRAMUnit + ", Swap usage: " + swap;

      if (sysInfoRam !== null) {
        sysInfoRam.textContent =
          percentRAM.toFixed(1) + "% of " + totalRAM.toFixed(1) + " " + totalRAMUnit + " is used";
      }

      if (sysInfoSwapEl !== null) {
        if (system.memory.swap.total > 0) {
          sysInfoSwapEl.textContent =
            percentSwap.toFixed(1) +
            "% of " +
            totalSwap.toFixed(1) +
            " " +
            totalSwapUnit +
            " is used";
        } else {
          sysInfoSwapEl.textContent = "No swap space available";
        }
      }

      color = system.cpu.load.raw[0] > system.cpu.nprocs ? "text-red" : "text-green-light";

      cpuEl.innerHTML =
        '<i class="fa fa-fw fa-microchip ' +
        color +
        '"></i>&nbsp;&nbsp;Load:&nbsp;' +
        system.cpu.load.raw[0].toFixed(2) +
        "&nbsp;/&nbsp;" +
        system.cpu.load.raw[1].toFixed(2) +
        "&nbsp;/&nbsp;" +
        system.cpu.load.raw[2].toFixed(2);
      cpuEl.title =
        "Load averages for the past 1, 5, and 15 minutes\non a system with " +
        system.cpu.nprocs +
        " core" +
        (system.cpu.nprocs > 1 ? "s" : "") +
        " running " +
        system.procs +
        " processes " +
        (system.cpu.load.raw[0] > system.cpu.nprocs
          ? " (load is higher than the number of cores)"
          : "");

      if (sysInfoCpu !== null) {
        sysInfoCpu.textContent =
          system.cpu["%cpu"].toFixed(1) +
          "% on " +
          system.cpu.nprocs +
          " core" +
          (system.cpu.nprocs > 1 ? "s" : "") +
          " running " +
          system.procs +
          " processes";
      }

      const startdate = moment()
        .subtract(system.uptime, "seconds")
        .format("dddd, MMMM Do YYYY, HH:mm:ss");

      statusEl.title =
        "System uptime: " +
        moment.duration(1000 * system.uptime).humanize() +
        " (running since " +
        startdate +
        ")";

      if (sysInfoUptime !== null) {
        sysInfoUptime.textContent =
          moment.duration(1000 * system.uptime).humanize() + " (running since " + startdate + ")";
        if (sysInfoSystemOverlay !== null) {
          sysInfoSystemOverlay.style.display = "none";
        }
      }

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

// Method to compare two versions.
// Returns 1 if v2 is smaller, -1 if v1 is smaller, 0 if equal.
function versionCompare(v1, v2) {
  // Check if both versions are strings
  if (typeof v1 !== "string" || typeof v2 !== "string") {
    return 0;
  }

  // Remove possible leading "v" in v1 and v2
  const v1Clean = v1.startsWith("v") ? v1.slice(1) : v1;
  const v2Clean = v2.startsWith("v") ? v2.slice(1) : v2;

  const v1Parts = v1Clean.split(".").map(Number);
  const v2Parts = v2Clean.split(".").map(Number);

  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  for (let i = 0; i < maxLength; i++) {
    const num1 = v1Parts[i] || 0;
    const num2 = v2Parts[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
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
    const versionsEl = document.getElementById("versions");
    const updateHintEl = document.getElementById("update-hint");
    versionsEl.innerHTML = "";
    updateHintEl.innerHTML = "";

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
          versionsEl.innerHTML +=
            "<li><strong>" +
            v.name +
            "</strong> " +
            localVersion +
            '&nbsp;&middot; <a class="lookatme" data-lookatme-text="Update available!" href="' +
            v.url +
            '" rel="noopener noreferrer" target="_blank">Update available!</a></li>';
          // if at least one component can be updated, display the update-hint footer
          updateAvailable = true;
        } else {
          versionsEl.innerHTML += "<li><strong>" + v.name + "</strong> " + localVersion + "</li>";
        }
      }
    }

    if (dockerUpdate)
      updateHintEl.innerHTML =
        'To install updates, <a href="https://github.com/pi-hole/docker-pi-hole#upgrading-persistence-and-customizations" rel="noopener noreferrer" target="_blank">replace this old container with a fresh upgraded image</a>.';
    else if (updateAvailable)
      updateHintEl.innerHTML =
        'To install updates, run <code><a href="https://docs.pi-hole.net/main/update/" rel="noopener noreferrer" target="_blank">pihole -up</a></code>.';

    clearTimeout(versionTimer);
    versionTimer = utils.setTimer(updateVersionInfo, REFRESH_INTERVAL.version);
  });
}

$(() => {
  if (!globalThis._isLoginPage) updateInfo();

  const enableTimer = document.getElementById("enableTimer");
  if (enableTimer) {
    const target = new Date(Number.parseInt(enableTimer.textContent, 10));
    const seconds = Math.round((target.getTime() - Date.now()) / 1000);
    if (seconds > 0) {
      setTimeout(countDown, 100);
    }
  }

  const cookieInfoElement = document.getElementById("cookieInfo");
  if (!testCookies() && cookieInfoElement) {
    cookieInfoElement.classList.remove("d-none");
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
document.getElementById("pihole-enable").addEventListener("click", e => {
  e.preventDefault();
  localStorage.removeItem("countDownTarget");
  piholeChange("enable", "");
});
document.getElementById("pihole-disable-indefinitely").addEventListener("click", e => {
  e.preventDefault();
  piholeChange("disable", "0");
});
document.getElementById("pihole-disable-10s").addEventListener("click", e => {
  e.preventDefault();
  piholeChange("disable", "10");
});
document.getElementById("pihole-disable-30s").addEventListener("click", e => {
  e.preventDefault();
  piholeChange("disable", "30");
});
document.getElementById("pihole-disable-5m").addEventListener("click", e => {
  e.preventDefault();
  piholeChange("disable", "300");
});
document.getElementById("pihole-disable-custom").addEventListener("click", e => {
  e.preventDefault();
  const btnMins = document.getElementById("btnMins");
  let custVal = document.getElementById("customTimeout").value;
  custVal = btnMins.classList.contains("active") ? custVal * 60 : custVal;
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
    const settingsSelector = document.querySelector(".settings-selector");
    const boxes = document.querySelectorAll(".box");
    const visibleBoxes = [...boxes].filter(box => utils.isVisible(box));

    if (settingsSelector && visibleBoxes.length === 0) {
      globalThis.location.href = `${document.body.dataset.webhome}settings/system`;
    }
  }
}

function addAdvancedInfo() {
  const advancedInfoSource = document.getElementById("advanced-info-data");
  const advancedInfoTarget = document.getElementById("advanced-info");
  if (!advancedInfoSource || !advancedInfoTarget) return;

  const isTLS = location.protocol === "https:";
  const clientIP = advancedInfoSource.dataset.clientIp;
  const XForwardedFor = globalThis.atob(advancedInfoSource.dataset.xff || "") || null;
  const starttime = Number.parseFloat(advancedInfoSource.dataset.starttime);
  const endtime = Number.parseFloat(advancedInfoSource.dataset.endtime);
  const totaltime = 1000 * (endtime - starttime);

  // Show advanced info
  // Add TLS and client IP info
  const classes = isTLS ? "fa-lock text-green" : "fa-lock-open";
  const title = `Your connection is ${isTLS ? "" : "NOT "}end-to-end encrypted (TLS/SSL)`;
  advancedInfoTarget.innerHTML =
    `Client: <i class="fa-solid fa-fw ${classes}" title="${title}"></i>` +
    '&nbsp;<span id="client-id"></span><br>';

  // Add client IP info
  const clientIdEl = document.getElementById("client-id");
  clientIdEl.textContent = XForwardedFor ?? clientIP;

  // If X-Forwarded-For is set, show the X-Forwarded-For in italics and add
  // the real client IP as tooltip
  if (XForwardedFor) {
    clientIdEl.style.fontStyle = "italic";
    clientIdEl.title = `Original remote address: ${clientIP}`;
  }

  // Add render time info
  const renderTime = totaltime > 0.5 ? totaltime.toFixed(1) : totaltime.toFixed(3);
  advancedInfoTarget.innerHTML += `Render time: ${renderTime} ms`;
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
    console.log(`DataTables warning: ${message}`);
  };
}
