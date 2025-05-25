/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, moment:false */

"use strict";

const HUMAN_DATE_FMT = "dddd, MMMM Do YYYY, HH:mm:ss";

function secondsTimeSpanToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Format memory size with appropriate unit
function formatMemorySize(sizeInKB) {
  const isGB = sizeInKB >= 1024 * 1024;
  const size = sizeInKB / (isGB ? 1024 * 1024 : 1024);
  const unit = isGB ? "GB" : "MB";

  return { value: utils.formatNumber(size, 1), unit };
}

// Format system uptime information
function formatUptime(uptimeSeconds) {
  const startDate = moment().subtract(uptimeSeconds, "seconds").format(HUMAN_DATE_FMT);
  const humanUptime = moment.duration(1000 * uptimeSeconds).humanize();

  return { startDate, humanUptime };
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
      status.innerHTML = "<i class='fa fa-circle fa-fw text-green-light mr-2'></i>Active";
      enableElement.classList.add("d-none");
      disableElement.classList.remove("d-none", "active");

      break;
    }

    case "disabled": {
      status.innerHTML = "<i class='fa fa-circle fa-fw text-red mr-2'></i>Blocking disabled";
      enableElement.classList.remove("d-none");
      disableElement.classList.add("d-none");

      break;
    }

    case "failure": {
      status.innerHTML =
        "<i class='fa-solid fa-triangle-exclamation fa-fw text-red mr-2'></i><span class='text-red'>DNS server failure<span>";
      enableElement.classList.add("d-none");
      disableElement.classList.add("d-none");

      break;
    }

    default: {
      status.innerHTML = "<i class='fa fa-circle fa-fw text-red mr-2'></i>Status unknown";
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
  utils
    .fetchFactory(`${document.body.dataset.apiurl}/dns/blocking`)
    .then(data => {
      piholeChanged(data.blocking, data.timer);
      utils.setTimer(checkBlocking, utils.REFRESH_INTERVAL.blocking);
    })
    .catch(() => {
      utils.setTimer(checkBlocking, 3 * utils.REFRESH_INTERVAL.blocking);
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

  utils
    .fetchFactory(`${document.body.dataset.apiurl}/dns/blocking`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        blocking: action === "enable",
        timer: Number.parseInt(duration, 10) > 0 ? Number.parseInt(duration, 10) : null,
      }),
    })
    .then(data => {
      if (data.blocking === `${action}d`) {
        btnStatus.innerHTML = "";
        piholeChanged(data.blocking, data.timer);
      }
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

// Initialize the global timers
let systemTimer = null;
let versionTimer = null;
let ftlinfoTimer = null;

function updateInfo() {
  checkBlocking();
  updateSystemInfo();
  updateFtlInfo();
  updateVersionInfo();
}

function updateQueryFrequency(frequency) {
  // Calculate rate and determine appropriate unit
  const baseRate = Number.parseFloat(frequency) * 60;
  const isHighFrequency = baseRate > 100;

  // Determine final rate and unit based on frequency
  const rate = isHighFrequency ? baseRate / 60 : baseRate;
  const unit = isHighFrequency ? "q/s" : "q/min";

  // Determine the number of fraction digits based on the rate
  // - 0 fraction digits for frequencies >= 10
  // - 1 fraction digit for frequencies between 1 and 10
  // - 2 fraction digits for frequencies < 1
  const fractionDigits = rate >= 10 ? 0 : rate < 1 ? 2 : 1;
  const freqFormatted = utils.formatNumber(rate, fractionDigits);

  const queryFreqElem = document.getElementById("query_frequency");
  queryFreqElem.innerHTML = `<i class="fa fa-fw fa-gauge-high text-green-light mr-2"></i>${freqFormatted}&thinsp;${unit}`;
  queryFreqElem.title = isHighFrequency ? "Queries per second" : "Queries per minute";
}

function updateFtlInfo() {
  utils.fetchFactory(`${document.body.dataset.apiurl}/info/ftl`).then(({ ftl }) => {
    updateGeneralFtlInfo(ftl);
    updateFtlSysinfoElements(ftl);

    clearTimeout(ftlinfoTimer);
    ftlinfoTimer = utils.setTimer(updateFtlInfo, utils.REFRESH_INTERVAL.ftl);
  });
}

function updateGeneralFtlInfo(ftl) {
  const { domains, regex, groups, clients, lists, gravity } = ftl.database;

  document.getElementById("num_groups").textContent = utils.formatNumber(groups);
  document.getElementById("num_clients").textContent = utils.formatNumber(clients);
  document.getElementById("num_lists").textContent = utils.formatNumber(lists);
  document.getElementById("num_gravity").textContent = utils.formatNumber(gravity);

  const allowedEl = document.getElementById("num_allowed");
  allowedEl.textContent = utils.formatNumber(domains.allowed + regex.allowed);
  allowedEl.title =
    `Allowed: ${utils.formatNumber(domains.allowed)} exact domains and ` +
    `${utils.formatNumber(regex.allowed)} regex filters are enabled`;

  const deniedEl = document.getElementById("num_denied");
  deniedEl.textContent = utils.formatNumber(domains.denied + regex.denied);
  deniedEl.title =
    `Denied: ${utils.formatNumber(domains.denied)} exact domains and ` +
    `${utils.formatNumber(regex.denied)} regex filters are enabled`;

  updateQueryFrequency(ftl.query_frequency);
}

function updateFtlSysinfoElements(ftl) {
  if (!document.body.classList.contains("page-settings-system")) return;

  const sysInfoCpuFtl = document.getElementById("sysinfo-cpu-ftl");
  sysInfoCpuFtl.textContent = `(${utils.toPercent(ftl["%cpu"], 1)} used by FTL)`;

  const sysInfoRamFtl = document.getElementById("sysinfo-ram-ftl");
  sysInfoRamFtl.textContent = `(${utils.toPercent(ftl["%mem"], 1)} used by FTL)`;

  const sysInfoPidFtl = document.getElementById("sysinfo-pid-ftl");
  sysInfoPidFtl.textContent = ftl.pid;

  const sysInfoUptimeFtl = document.getElementById("sysinfo-uptime-ftl");
  const startDate = moment().subtract(ftl.uptime, "milliseconds").format(HUMAN_DATE_FMT);
  sysInfoUptimeFtl.textContent = startDate;

  const destructiveActions = document.querySelectorAll(".destructive_action");
  for (const element of destructiveActions) {
    if (!ftl.allow_destructive) {
      element.disabled = true;
      element.title = "Destructive actions are disabled by a config setting";
    } else {
      element.removeAttribute("disabled");
      element.removeAttribute("title");
    }
  }
}

function updateGeneralSystemInfo(system) {
  const memoryEl = document.getElementById("memory");
  const cpuEl = document.getElementById("cpu");
  const statusEl = document.getElementById("status");

  const percentRAM = system.memory.ram["%used"];
  const percentSwap = system.memory.swap["%used"];
  const ramColor = percentRAM > 75 ? "text-red" : "text-green-light";
  const swapUsage = system.memory.swap.total > 0 ? utils.toPercent(percentSwap, 1) : "N/A";
  const { value, unit } = formatMemorySize(system.memory.ram.total);

  memoryEl.innerHTML = `<i class="fa fa-fw fa-memory ${ramColor} mr-2"></i>Memory usage: ${utils.toPercent(percentRAM, 1)}`;
  memoryEl.title = `Total memory: ${value} ${unit}, Swap usage: ${swapUsage}`;

  const cores = system.cpu.nprocs;
  const [load1, load5, load15] = system.cpu.load.raw;
  const isHighLoad = load1 > cores;
  const loadColor = isHighLoad ? "text-red" : "text-green-light";
  const loadWarning = isHighLoad ? " (load is higher than the number of cores)" : "";

  cpuEl.innerHTML =
    `<i class="fa fa-fw fa-microchip ${loadColor} mr-2"></i>Load: ` +
    `${utils.formatNumber(load1, 2)} / ${utils.formatNumber(load5, 2)} / ${utils.formatNumber(load15, 2)}`;
  cpuEl.title =
    "Load averages for the past 1, 5, and 15 minutes\non a system with " +
    `${cores} ${utils.pluralize(cores, "core")} running ${system.procs} ` +
    `${utils.pluralize(system.procs, "process", "processes")}${loadWarning}`;

  const { startDate, humanUptime } = formatUptime(system.uptime);
  statusEl.title = `System uptime: ${humanUptime} (running since ${startDate})`;
}

function updateSysinfoElements(system) {
  if (!document.body.classList.contains("page-settings-system")) return;

  const sysInfoRam = document.getElementById("sysinfo-memory-ram");
  const sysInfoSwapEl = document.getElementById("sysinfo-memory-swap");
  const sysInfoCpu = document.getElementById("sysinfo-cpu");
  const sysInfoUptime = document.getElementById("sysinfo-uptime");
  const sysInfoSystemOverlay = document.getElementById("sysinfo-system-overlay");

  const percentRAM = system.memory.ram["%used"];
  const { value, unit } = formatMemorySize(system.memory.ram.total);
  sysInfoRam.textContent = `${utils.toPercent(percentRAM, 1)} of ${value} ${unit} is used`;

  if (system.memory.swap.total > 0) {
    const percentSwap = system.memory.swap["%used"];
    const { value, unit } = formatMemorySize(system.memory.swap.total);
    sysInfoSwapEl.textContent = `${utils.toPercent(percentSwap, 1)} of ${value} ${unit} is used`;
  } else {
    sysInfoSwapEl.textContent = "No swap space available";
  }

  const cores = system.cpu.nprocs;
  sysInfoCpu.textContent =
    `${utils.toPercent(system.cpu["%cpu"], 1)} on ${cores} ${utils.pluralize(cores, "core")} ` +
    `running ${system.procs} ${utils.pluralize(system.procs, "process", "processes")}`;

  const { startDate, humanUptime } = formatUptime(system.uptime);
  sysInfoUptime.textContent = `${humanUptime} (running since ${startDate})`;

  sysInfoSystemOverlay.classList.add("d-none");
}

function updateSystemInfo() {
  utils.fetchFactory(`${document.body.dataset.apiurl}/info/system`).then(({ system }) => {
    updateGeneralSystemInfo(system);
    updateSysinfoElements(system);

    clearTimeout(systemTimer);
    systemTimer = utils.setTimer(updateSystemInfo, utils.REFRESH_INTERVAL.system);
  });
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
  utils.fetchFactory(`${document.body.dataset.apiurl}/info/version`).then(({ version }) => {
    const versionsEl = document.getElementById("versions");
    const updateHintEl = document.getElementById("update-hint");
    versionsEl.innerHTML = "";
    updateHintEl.innerHTML = "";
    let updateAvailable = false;
    let isDockerUpdateAvailable = false;

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

    for (const v of versions) {
      if (v.local === null) continue;

      // reset update status for each component
      let updateComponentAvailable = false;
      let localVersion = v.local;
      let url = v.url;

      if (v.branch !== null && v.hash !== null) {
        if (v.branch === "master") {
          const baseVersion = v.local.split("-")[0];
          localVersion = `<a href="${url}/${baseVersion}" rel="noopener noreferrer" target="_blank">${baseVersion}</a>`;
          // Update available
          updateComponentAvailable = versionCompare(v.local, v.remote) === -1;
        } else {
          // non-master branch
          localVersion = `vDev (${v.branch}, ${v.hash})`;
          if (v.hash_remote && v.hash !== v.hash_remote) {
            // hashes differ > Update available
            updateComponentAvailable = true;
            // link to the commit history instead of release page
            url = url.replace("releases", `commits/${v.branch}`);
          }
        }
      }

      if (v.name === "Docker Tag") {
        if (versionCompare(v.local, v.remote) === -1) {
          // Display update information for the docker tag
          updateComponentAvailable = true;
          isDockerUpdateAvailable = true;
        } else {
          // Display the link for the current tag
          localVersion = `<a href="${url}/${localVersion}" rel="noopener noreferrer" target="_blank">${localVersion}</a>`;
        }
      }

      // Display update information of individual components only if we are not running in a Docker container
      const showUpdate =
        (version.docker.local === null || v.name === "Docker Tag") && updateComponentAvailable;

      versionsEl.innerHTML += showUpdate
        ? `<li><strong>${v.name}</strong> ${localVersion} &middot; <a class="lookatme" data-lookatme-text="Update available!" href="${url}" rel="noopener noreferrer" target="_blank">Update available!</a></li>`
        : `<li><strong>${v.name}</strong> ${localVersion}</li>`;

      // if at least one component can be updated, display the update-hint footer
      updateAvailable ||= showUpdate;
    }

    if (updateAvailable) {
      updateHintEl.classList.remove("d-none");
      updateHintEl.innerHTML = isDockerUpdateAvailable
        ? 'To install updates, <a href="https://github.com/pi-hole/docker-pi-hole#upgrading-persistence-and-customizations" rel="noopener noreferrer" target="_blank">replace this old container with a fresh upgraded image</a>.'
        : 'To install updates, run <code><a href="https://docs.pi-hole.net/main/update/" rel="noopener noreferrer" target="_blank">pihole -up</a></code>.';
    }

    clearTimeout(versionTimer);
    versionTimer = utils.setTimer(updateVersionInfo, utils.REFRESH_INTERVAL.version);
  });
}

// Handle Enable/Disable buttons
function setupEnableDisableButtons(buttonId, action, duration, preCallback = null) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.addEventListener("click", event => {
    event.preventDefault();

    if (preCallback) {
      preCallback();
    }

    // Check if duration is a function and call it if it is
    const actualDuration = typeof duration === "function" ? duration() : duration;

    piholeChange(action, actualDuration);
  });
}

setupEnableDisableButtons("pihole-enable", "enable", "", () => {
  localStorage.removeItem("countDownTarget");
});

setupEnableDisableButtons("pihole-disable-indefinitely", "disable", "0");
setupEnableDisableButtons("pihole-disable-10s", "disable", "10");
setupEnableDisableButtons("pihole-disable-30s", "disable", "30");
setupEnableDisableButtons("pihole-disable-5m", "disable", "300");

setupEnableDisableButtons("pihole-disable-custom", "disable", () => {
  const btnMins = document.getElementById("btnMins");
  const custVal = document.getElementById("customTimeout").value;
  return btnMins.classList.contains("active") ? custVal * 60 : custVal;
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

  const { clientIp, xff, startTime, endTime } = advancedInfoSource.dataset;

  // Add TLS and client IP info
  const isTLS = location.protocol === "https:";
  const totalTime = 1000 * (Number.parseFloat(endTime) - Number.parseFloat(startTime));
  const iconClasses = isTLS ? "fa-lock text-green" : "fa-lock-open";
  const title = `Your connection is ${isTLS ? "" : "NOT "}end-to-end encrypted (TLS/SSL)`;
  const renderTime = utils.formatNumber(totalTime, totalTime > 0.5 ? 1 : 3);

  advancedInfoTarget.innerHTML =
    `Client: <i class="fa-solid fa-fw mr-1 ${iconClasses}" title="${title}"></i>` +
    `<span id="client-id"></span><br>Render time: ${renderTime} ms`;

  // Add client IP info
  const xForwardedFor = globalThis.atob(xff || "") || null;
  const clientIdEl = document.getElementById("client-id");
  clientIdEl.textContent = xForwardedFor ?? clientIp;

  // If X-Forwarded-For is set, show the X-Forwarded-For in italics and add
  // the real client IP as the title
  if (xForwardedFor) {
    clientIdEl.style.fontStyle = "italic";
    clientIdEl.title = `Original remote address: ${clientIp}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage = document.body.classList.contains("page-login");
  if (!isLoginPage) updateInfo();

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

  if (!isLoginPage) {
    // Run check immediately after page loading ...
    utils.checkMessages();
    // ... and then periodically
    utils.setInter(utils.checkMessages, utils.REFRESH_INTERVAL.messages);
  }

  initSettingsLevel();
  addAdvancedInfo();
});

// Install custom AJAX error handler for DataTables if $.fn.dataTable is available
if ($.fn.dataTable) {
  $.fn.dataTable.ext.errMode = (settings, helpPage, message) => {
    // eslint-disable-next-line no-console
    console.log(`DataTables warning: ${message}`);
  };
}
