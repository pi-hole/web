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
    $("#" + escapedKey + "-" + value.value).trigger("click");
  } else if (value.type === "boolean") {
    // Select checkboxes (if available)
    $("#" + escapedKey).prop("checked", value.value);
  } else if (
    ["string", "IPv4 address", "IPv6 address", "integer", "unsigned integer"].includes(value.type)
  ) {
    // Set input field values (if available)
    $("#" + escapedKey).val(value.value);
  }
}
