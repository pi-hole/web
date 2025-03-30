/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, moment:false */

const _isLoginPage = false;

const REFRESH_INTERVAL = {
  logs: 500, // 0.5 sec (logs page)
  summary: 1000, // 1 sec (dashboard)
  query_log: 2000, // 2 sec (Query Log)
  blocking: 10000, // 10 sec (all pages, sidebar)
  metrics: 10000, // 10 sec (settings page)
  system: 20000, // 20 sec (all pages, sidebar)
  query_types: 60000, // 1 min (dashboard)
  upstreams: 60000, // 1 min (dashboard)
  top_lists: 60000, // 1 min (dashboard)
  messages: 60000, // 1 min (all pages)
  version: 120000, // 2 min (all pages, footer)
  ftl: 120000, // 2 min (all pages, sidebar)
  hosts: 120000, // 2 min (settings page)
  history: 600000, // 10 min (dashboard)
  clients: 600000, // 10 min (dashboard)
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

  if (timer !== null && parseFloat(timer) > 0) {
    enaT.html(Date.now() + parseFloat(timer) * 1000);
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
  const target = new Date(parseInt(enaT.text(), 10));
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
  // Skip if page is hidden
  if (document.hidden) {
    utils.setTimer(checkBlocking, REFRESH_INTERVAL.blocking);
    return;
  }

  $.ajax({
    url: document.body.dataset.apiurl + "/dns/blocking",
    method: "GET",
  })
    .done(function (data) {
      piholeChanged(data.blocking, data.timer);
      utils.setTimer(checkBlocking, REFRESH_INTERVAL.blocking);
    })
    .fail(function (data) {
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
      timer: parseInt(duration, 10) > 0 ? parseInt(duration, 10) : null,
    }),
  })
    .done(function (data) {
      if (data.blocking === action + "d") {
        btnStatus.html("");
        piholeChanged(data.blocking, data.timer);
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function testCookies() {
  if (navigator.cookieEnabled) {
    return true;
  }

  // set and read cookie
  document.cookie = "cookietest=1";
  const ret = document.cookie.indexOf("cookietest=") !== -1;

  // delete cookie
  document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";

  return ret;
}

const iCheckStyle = "primary";
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
  sel.parent().addClass("icheck-" + iCheckStyle);
}

function initCheckboxRadioStyle() {
  function getCheckboxURL(style) {
    const extra = style.startsWith("material-") ? "material" : "bootstrap";
    const webhome = document.body.dataset.webhome;
    return webhome + "vendor/icheck/icheck-" + extra + ".min.css";
  }

  // Read from local storage, initialize if needed
  let chkboxStyle = localStorage ? localStorage.getItem("theme_icheck") : null;
  if (chkboxStyle === null) {
    chkboxStyle = "primary";
  }

  const boxsheet = $('<link href="' + getCheckboxURL(chkboxStyle) + '" rel="stylesheet">');
  // Only add the stylesheet if it's not already present
  if ($("link[href='" + boxsheet.attr("href") + "']").length === 0) boxsheet.appendTo("head");

  iCheckStyle = chkboxStyle;
  applyCheckboxRadioStyle();

  // Add handler when on settings page
  var iCheckStyle = $("#iCheckStyle");
  if (iCheckStyle !== null) {
    iCheckStyle.val(chkboxStyle);
    iCheckStyle.on("change", function () {
      const themename = $(this).val();
      localStorage.setItem("theme_icheck", themename);
      applyCheckboxRadioStyle();
    });
  }
}

let systemTimer, versionTimer;
function updateInfo() {
  updateSystemInfo();
  updateVersionInfo();
  updateFtlInfo();
  checkBlocking();
}

function updateQueryFrequency(intl, frequency) {
  let freq = parseFloat(frequency) * 60;
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
    .done(function (data) {
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
      $("#sysinfo-privacy_level").text(ftl.privacy_level);
      $("#sysinfo-ftl-overlay").hide();

      $(".destructive_action").prop("disabled", !ftl.allow_destructive);
      $(".destructive_action").prop(
        "title",
        ftl.allow_destructive ? "" : "Destructive actions are disabled by a config setting"
      );

      clearTimeout(ftlinfoTimer);
      ftlinfoTimer = utils.setTimer(updateFtlInfo, REFRESH_INTERVAL.ftl);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function updateSystemInfo() {
  $.ajax({
    url: document.body.dataset.apiurl + "/info/system",
  })
    .done(function (data) {
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
      $("#sysinfo-cpu").html(
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
    .fail(function (data) {
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
  let vnum1 = 0,
    vnum2 = 0;

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
  }).done(function (data) {
    const version = data.version;
    let updateAvailable = false;
    let dockerUpdate = false;
    let isDocker = false;
    $("#versions").empty();

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

    versions.forEach(function (v) {
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
              '" rel="noopener" target="_blank">' +
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
              '" rel="noopener" target="_blank">' +
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
              '&nbsp&middot; <a class="lookatme" lookatme-text="Update available!" href="' +
              v.url +
              '" rel="noopener" target="_blank">Update available!</a></li>'
          );
          // if at least one component can be updated, display the update-hint footer
          updateAvailable = true;
        } else {
          $("#versions").append("<li><strong>" + v.name + "</strong> " + localVersion + "</li>");
        }
      }
    });

    if (dockerUpdate)
      $("#update-hint").html(
        'To install updates, <a href="https://github.com/pi-hole/docker-pi-hole#upgrading-persistence-and-customizations" rel="noopener" target="_blank">replace this old container with a fresh upgraded image</a>.'
      );
    else if (updateAvailable)
      $("#update-hint").html(
        'To install updates, run <code><a href="https://docs.pi-hole.net/main/update/" rel="noopener" target="_blank">pihole -up</a></code>.'
      );

    clearTimeout(versionTimer);
    versionTimer = utils.setTimer(updateVersionInfo, REFRESH_INTERVAL.version);
  });
}

$(function () {
  if (!_isLoginPage) updateInfo();
  const enaT = $("#enableTimer");
  const target = new Date(parseInt(enaT.html(), 10));
  const seconds = Math.round((target.getTime() - Date.now()) / 1000);
  if (seconds > 0) {
    setTimeout(countDown, 100);
  }

  if (!testCookies() && $("#cookieInfo").length > 0) {
    $("#cookieInfo").show();
  }

  // Apply per-browser styling settings
  initCheckboxRadioStyle();

  if (!_isLoginPage) {
    // Run check immediately after page loading ...
    utils.checkMessages();
    // ... and then periodically
    utils.setInter(utils.checkMessages, REFRESH_INTERVAL.messages);
  }
});

// Handle Enable/Disable
$("#pihole-enable").on("click", function (e) {
  e.preventDefault();
  localStorage.removeItem("countDownTarget");
  piholeChange("enable", "");
});
$("#pihole-disable-indefinitely").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "0");
});
$("#pihole-disable-10s").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "10");
});
$("#pihole-disable-30s").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "30");
});
$("#pihole-disable-5m").on("click", function (e) {
  e.preventDefault();
  piholeChange("disable", "300");
});
$("#pihole-disable-custom").on("click", function (e) {
  e.preventDefault();
  let custVal = $("#customTimeout").val();
  custVal = $("#btnMins").hasClass("active") ? custVal * 60 : custVal;
  piholeChange("disable", custVal);
});

function initSettingsLevel() {
  const elem = $("#expert-settings");

  // Skip init if element is not present (e.g. on login page)
  if (elem.length === 0) {
    applyExpertSettings();
    return;
  }

  // Restore settings level from local storage (if available) or default to "false"
  if (localStorage.getItem("expert_settings") === null) {
    localStorage.setItem("expert_settings", "false");
  }

  elem.prop("checked", localStorage.getItem("expert_settings") === "true");

  // Init the settings level toggle
  elem.bootstrapToggle({
    on: "Expert",
    off: "Basic",
    size: "small",
    offstyle: "success",
    onstyle: "danger",
    width: "80px",
  });

  // Add handler for settings level toggle
  elem.on("change", function () {
    localStorage.setItem("expert_settings", $(this).prop("checked") ? "true" : "false");
    applyExpertSettings();
    addAdvancedInfo();
  });

  // Apply settings level
  applyExpertSettings();
}

function applyExpertSettings() {
  // Apply settings level, this will hide/show elements with the class
  // "settings-level-basic" or "settings-level-expert" depending on the
  // current settings level
  // If "expert_settings" is not set, we default to !"true" (basic settings)
  if (localStorage.getItem("expert_settings") === "true") {
    $(".settings-level-basic").show();
    $(".settings-level-expert").show();
  } else {
    $(".settings-level-basic").show();
    $(".settings-level-expert").hide();

    // If we left with an empty page (no visible boxes) after switching from
    // Expert to Basic settings, redirect to admin/settings/system instead
    //  - class settings-selector is present (this class is present in every
    //    settings pages, but not in other pages - it is there on the "all"
    //    settings page as well, even when the button has "only modified"
    //    functionality there), and
    //  - there are no visible boxes (the page is empty)
    if ($(".settings-selector").length > 0 && $(".box:visible").length === 0) {
      const webhome = document.body.dataset.webhome;
      globalThis.location.href = webhome + "settings/system";
    }
  }
}

function addAdvancedInfo() {
  const advancedInfoSource = $("#advanced-info-data");
  const advancedInfoTarget = $("#advanced-info");
  const isTLS = location.protocol === "https:";
  const clientIP = advancedInfoSource.data("client-ip");
  const XForwardedFor = globalThis.atob(advancedInfoSource.data("xff") ?? "");
  const starttime = parseFloat(advancedInfoSource.data("starttime"));
  const endtime = parseFloat(advancedInfoSource.data("endtime"));
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
  $("#client-id").text(XForwardedFor ? XForwardedFor : clientIP);
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

  // Show advanced info
  advancedInfoTarget.show();
}

$(function () {
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
