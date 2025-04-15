/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false*/

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // Handle hiding of alerts
  const dataHideElements = document.querySelectorAll("[data-hide]");
  for (const element of dataHideElements) {
    element.addEventListener("click", () => {
      const hideClass = element.dataset.hide;
      const closestElement = element.closest(`.${hideClass}`);
      if (closestElement) $(closestElement).hide();
    });
  }

  // Handle saving of settings
  const saveButton = document.querySelector(".save-button");
  if (!saveButton) return;
  saveButton.addEventListener("click", () => {
    saveSettings();
  });
});

// Globally available function to set config values
globalThis.setConfigValues = function (topic, key, value) {
  // If the value is an object, we need to recurse
  if (!Object.hasOwn(value, "description")) {
    for (const [subkey, subvalue] of Object.entries(value)) {
      // If the key is empty, we are at the top level
      const newKey = key === "" ? subkey : `${key}.${subkey}`;
      globalThis.setConfigValues(topic, newKey, subvalue);
    }

    return;
  }

  // else: we have a setting we can set
  const escapedKey = key.replaceAll(".", "\\.");
  const envTitle = $(`[data-configkeys~='${key}']`);

  if (
    envTitle.parents().parents().hasClass("settings-level-expert") &&
    envTitle.find(".expert-warning").length === 0
  ) {
    envTitle.append(
      `<span class="expert-warning">&nbsp;&nbsp;<i class="fas fa-wrench" title="Expert level setting"></i></span>`
    );
  }

  if (value.flags.restart_dnsmasq && envTitle.find(".restart-warning").length === 0) {
    envTitle.append(
      `<span class="restart-warning">&nbsp;&nbsp;<i class="fas fa-redo text-orange" title="Setting requires FTL restart on change"></i></span>`
    );
  }

  if (value.flags.env_var) {
    // If this setting has been set by environment variable, display a padlock in the section title
    if (envTitle.find(".env-warning").length === 0) {
      envTitle.append(
        `<span class="env-warning">&nbsp;&nbsp;<i class="fas fa-lock text-orange env-warning" title="Settings overwritten by an environmental variable are read-only"></i></span>`
      );
    }

    $(`#${escapedKey}`).prop("disabled", "disabled");
  }

  switch (value.type) {
    case "enum (unsigned integer)": // fallthrough
    case "enum (string)": {
      // Remove all options from select
      $(`#${escapedKey} option`).remove();
      // Add allowed select items (if available)
      for (const allowedValue of value.allowed) {
        $(`#${escapedKey}-${allowedValue.item}`).prop("disabled", value.flags.env_var);
        const newopt = $("<option></option>")
          .attr("value", allowedValue.item)
          .text(allowedValue.description);
        $(`#${escapedKey}`).append(newopt);
      }

      // Select the current value
      $(`#${escapedKey}`).val(value.value).trigger("click");

      // Also select matching radio button (if any)
      $(`#${escapedKey}-${value.value}`).prop("checked", true);

      break;
    }

    case "boolean": {
      // Select checkboxes (if available)
      $(`#${escapedKey}`).prop("checked", value.value);

      break;
    }

    case "string array": {
      // Set input field values from array (if available)
      $(`#${escapedKey}`).val(value.value.join("\n"));
      break;
    }

    default: {
      // Set input field values (if available)
      // Set text if this is a <span> or <code> element
      if ($(`#${escapedKey}`).is("span") || $(`#${escapedKey}`).is("code")) {
        $(`#${escapedKey}`).text(value.value);
      } else {
        // Set value if this is an <input> element
        $(`#${escapedKey}`).val(value.value);
      }
    }
  }
};

function saveSettings() {
  utils.disableAll();

  const settings = {};
  const keyElements = document.querySelectorAll("[data-key]");

  for (const element of keyElements) {
    const { key } = element.dataset;
    let { value } = element;

    // If this is a checkbox, use the checked state
    if (element.matches('input[type="checkbox"]')) {
      value = element.checked;
    }

    // If this is a radio button, skip all but the checked one
    if (element.matches('input[type="radio"]') && !element.checked) continue;

    // If this is a string array, split the value into an array
    if (element.matches("textarea")) {
      value = element.value === "" ? [] : element.value.split("\n");
    }

    // If this is an integer number, parse it accordingly
    if (element.dataset.type === "integer") {
      value = Number.parseInt(value, 10);
    }

    // If this is a floating point value, parse it accordingly
    if (element.dataset.type === "float") {
      value = Number.parseFloat(value);
    }

    // Build deep object
    // Transform "foo.bar.baz" into {foo: {bar: {baz: value}}}
    const parts = key.split(".");
    const obj = {};
    let tmp = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      tmp[parts[i]] = {};
      tmp = tmp[parts[i]];
    }

    tmp[parts.at(-1)] = value;

    // Merge deep object into settings
    $.extend(true, settings, obj);
  }

  // Apply changes
  $.ajax({
    url: `${document.body.dataset.apiurl}/config`,
    method: "PATCH",
    dataType: "json",
    processData: false,
    data: JSON.stringify({ config: settings }),
    contentType: "application/json; charset=utf-8",
  })
    .done(() => {
      utils.enableAll();
      // Success
      utils.showAlert(
        "success",
        "fa-solid fa-fw fa-floppy-disk",
        "Successfully saved and applied settings",
        ""
      );
      // Show loading overlay
      utils.loadingOverlay(true);
    })
    .fail((data, exception) => {
      utils.enableAll();
      utils.showAlert("error", "", "Error while applying settings", data.responseText);
      console.log(exception); // eslint-disable-line no-console
      apiFailure(data);
    });
}
