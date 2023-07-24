/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false */

$(function () {
  // Handle hiding of alerts
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });

  // Handle saving of settings
  $(".save-button").on("click", function () {
    saveSettings();
  });
});

// Globally available function to set config values
// eslint-disable-next-line no-unused-vars
function setConfigValues(topic, key, value) {
  // If the value is an object, we need to recurse
  if (!("description" in value)) {
    Object.keys(value).forEach(function (subkey) {
      var subvalue = value[subkey];
      // If the key is empty, we are at the top level
      var newKey = key === "" ? subkey : key + "." + subkey;
      setConfigValues(topic, newKey, subvalue);
    });
    return;
  }

  // else: we have a setting we can set
  var escapedKey = key.replaceAll(".", "\\.");
  switch (value.type) {
    case "enum (unsigned integer)": // fallthrough
    case "enum (string)": {
      // Remove all options from select
      $("#" + escapedKey + " option").remove();
      // Add allowed select items (if available)
      value.allowed.forEach(function (allowedValue) {
        var newopt = $("<option></option>")
          .attr("value", allowedValue.item)
          .text(allowedValue.description);
        $("#" + escapedKey).append(newopt);
      });
      // Select the current value
      $("#" + escapedKey)
        .val(value.value)
        .trigger("click");

      // Also select matching radio button (if any)
      $("#" + escapedKey + "-" + value.value).prop("checked", true);

      break;
    }

    case "boolean": {
      // Select checkboxes (if available)
      $("#" + escapedKey).prop("checked", value.value);

      break;
    }

    case "string array": {
      // Set input field values from array (if available)
      $("#" + escapedKey).val(value.value.join("\n"));

      break;
    }

    default: {
      // Set input field values (if available)
      // Set text if this is a <span> or <code> element
      if ($("#" + escapedKey).is("span") || $("#" + escapedKey).is("code")) {
        $("#" + escapedKey).text(value.value);
      } else {
        // Set value if this is an <input> element
        $("#" + escapedKey).val(value.value);
      }
    }
  }
}

function saveSettings() {
  var settings = {};
  $("[data-key]").each(function () {
    var key = $(this).data("key");
    var value = $(this).val();

    // If this is a checkbox, use the checked state
    if ($(this).is(":checkbox")) {
      value = $(this).is(":checked");
    }

    // If this is a radio button, skip all but the checked one
    if ($(this).is(":radio") && !$(this).is(":checked")) return;

    // If this is a string array, split the value into an array
    if ($(this).is("textarea")) {
      value = $(this).val();
      value = value === "" ? [] : value.split("\n");
    }

    // If this is an integer number, parse it accordignly
    if ($(this).data("type") === "integer") {
      value = parseInt(value, 10);
    }

    // If this is a floating point value, parse it accordignly
    if ($(this).data("type") === "float") {
      value = parseFloat(value);
    }

    // Build deep object
    // Transform "foo.bar.baz" into {foo: {bar: {baz: value}}}
    var parts = key.split(".");
    var obj = {};
    var tmp = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      tmp[parts[i]] = {};
      tmp = tmp[parts[i]];
    }

    tmp[parts.at(-1)] = value;

    // Merge deep object into settings
    $.extend(true, settings, obj);
  });

  // Apply changes
  $.ajax({
    url: "/api/config",
    method: "PATCH",
    data: JSON.stringify({ config: settings }),
    contentType: "application/json; charset=utf-8",
  })
    .done(function () {
      // Success
      utils.showAlert(
        "success",
        "fa-solid fa-fw fa-floppy-disk",
        "Successfully saved and applied settings",
        ""
      );
      // Reload page
      location.reload();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}
