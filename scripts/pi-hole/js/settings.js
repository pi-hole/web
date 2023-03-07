/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

// Handle hiding of alerts
$(function () {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });
});

// Globally available function to set config values
// eslint-disable-next-line no-unused-vars
function setConfigValues(topic, key, value) {
  // If the value is an object, we need to recurse
  if (!("description" in value)) {
    Object.keys(value).forEach(function (subkey) {
      var subvalue = value[subkey];
      setConfigValues(topic, key + "." + subkey, subvalue);
    });
    return;
  }

  // else: we have a setting we can set
  var escapedKey = key.replace(/\./g, "\\.");
  if (value.type === "enum (string)") {
    // Remove all options from select
    $("#" + escapedKey + " option").remove();
    // Add allowed select items (if available)
    value.allowed.forEach(function (allowedValue) {
      var newopt = $("<option></option>")
          .attr("value", allowedValue.item)
          .text(allowedValue.description)
          $("#" + escapedKey).append(newopt);
    });
    // Select the current value
    $("#" + escapedKey + "-" + value.value).trigger("click");
  } else if (value.type === "boolean") {
    // Select checkboxes (if available)
    $("#" + escapedKey).prop("checked", value.value);
  } else if (value.type === "string array") {
    // Set input field values from array (if available)
    $("#" + escapedKey).val(value.value.join("\n"));
  } else {
    // Set input field values (if available)
    $("#" + escapedKey).val(value.value);
  }
}
