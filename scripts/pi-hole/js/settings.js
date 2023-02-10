/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global updateHostInfo:false, updateCacheInfo:false, createDynamicConfigTabs:false */

$(function () {
  updateHostInfo();
  updateCacheInfo();
  createDynamicConfigTabs();
});

// Change "?tab=" parameter in URL for save and reload
$(".nav-tabs a").on("shown.bs.tab", function (e) {
  var tab = e.target.hash.substring(1);
  window.history.pushState("", "", "?tab=" + tab);
  window.scrollTo(0, 0);
});

function initSettingsLevel() {
  // Restore settings level from local storage (if available) or default to 0
  var level = localStorage.getItem("settings-level");
  if (level === null) {
    level = "0";
  }

  // Set the settings level
  $("#settings-level").val(level);
  applySettingsLevel(level);
}

function applySettingsLevel(level) {
  if (level === "2") {
    $(".settings-level-0").show();
    $(".settings-level-1").show();
    $(".settings-level-2").show();
  } else if (level === "1") {
    $(".settings-level-0").show();
    $(".settings-level-1").show();
    $(".settings-level-2").hide();
  } else {
    $(".settings-level-0").show();
    $(".settings-level-1").hide();
    $(".settings-level-2").hide();
  }
}

// Handle hiding of alerts
$(function () {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });

  $("#settings-level").on("change", function () {
    var level = $(this).val();
    applySettingsLevel(level);
    localStorage.setItem("settings-level", level);
  });

  initSettingsLevel();
});
