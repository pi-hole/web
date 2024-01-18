/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure: false, applyCheckboxRadioStyle: false, saveSettings:false */
/* exported createDynamicConfigTabs */

function addAllowedValues(allowed) {
  if (typeof allowed === "object") {
    return (
      "<p>Available options:</p><ul><li>" +
      allowed
        .map(function (option) {
          return "<code>" + option.item + "</code>: " + utils.escapeHtml(option.description);
        })
        .join("</li><li>") +
      "</li></ul>"
    );
  } else if (typeof allowed === "string") {
    return "<p><small>Allowed value: " + utils.escapeHtml(allowed) + "</small></p>";
  }
}

function boxIcons(value) {
  return (
    '<span class="box-icons">' +
    (value.modified
      ? '<i class="far fa-edit text-light-blue" title="Modified from default"></i>'
      : "") +
    (value.flags.restart_dnsmasq
      ? '<i class="fas fa-redo text-orange" title="Setting requires FTL restart on change"></i>'
      : "") +
    (value.flags.env_var
      ? '<i class="fas fa-lock text-orange" title="Settings overwritten by an environmental variable are read-only"></i>'
      : "") +
    "</span>"
  );
}

function valueDetails(key, value) {
  // Define default hint text
  let defaultValueHint = "";
  if (value.modified) {
    defaultValueHint = "";
    if (value.default !== null) {
      let defVal = utils.escapeHtml(JSON.stringify(value.default));
      switch (defVal) {
        case "true": {
          defVal = "enabled";

          break;
        }

        case "false": {
          defVal = "disabled";

          break;
        }

        case '""':
        case "[]": {
          defVal = "empty";

          break;
        }
        // No default
      }

      defaultValueHint = "<p>Default Value: " + defVal + "</p>";
    }
  }

  // Define extraAttributes, if needed
  let extraAttributes = "";
  if (value.flags.env_var) {
    extraAttributes = " disabled";
  }

  // Format the output depending on the value type
  let content = "";
  switch (value.type) {
    case "IPv4 address":
    case "IPv6 address":
    case "string": {
      content +=
        '<label class="col-sm-2 control-label">Value <small>(string)</small></label>' +
        '<div class="col-sm-10">' +
        '<input type="text" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "boolean": {
      content +=
        '<div class="col-sm-12">' +
        '<div><input type="checkbox" ' +
        (value.value ? " checked" : "") +
        ' id="' +
        key +
        '-checkbox" data-key="' +
        key +
        '"' +
        extraAttributes +
        '><label for="' +
        key +
        '-checkbox">Enabled ' +
        defaultValueHint +
        "</label></div>" +
        " </div>";

      break;
    }

    case "double": {
      content +=
        '<label class="col-sm-2 control-label">Value</label>' +
        '<div class="col-sm-10">' +
        '<input type="number" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '" data-type="float"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        "</div>";

      break;
    }

    case "integer": {
      content +=
        '<label class="col-sm-2 control-label">Value <small>(integer)</small></label>' +
        '<div class="col-sm-10">' +
        '<input type="number" step="1" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '" data-type="integer"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        "</div>";

      break;
    }

    case "unsigned integer": {
      content +=
        '<label class="col-sm-4 control-label">Value <small>(unsigned integer)</small></label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" min="0" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '" data-type="integer"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        "</div>";

      break;
    }

    case "unsigned integer (16 bit)": {
      content +=
        '<label class="col-sm-4 control-label">Value <small>(unsigned 16bit integer)</small></label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" min="0" max="65535" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '" data-type="integer"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        "</div>";

      break;
    }

    case "string array": {
      content +=
        '<label class="col-sm-4 control-label">Values <small>(one item per line)</small></label>' +
        '<div class="col-sm-8">' +
        '<textarea class="form-control field-sizing-content" data-key="' +
        key +
        '"' +
        extraAttributes +
        ">" +
        value.value.join("\n") +
        "</textarea> " +
        defaultValueHint +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "enum (unsigned integer)": // fallthrough
    case "enum (string)": {
      content +=
        '<label class="col-sm-4 control-label">Selected Option</label>' +
        '<div class="col-sm-8">' +
        '<select class="form-control" data-key="' +
        key +
        '"' +
        extraAttributes +
        ">";
      value.allowed.forEach(function (option) {
        content +=
          '<option value="' +
          option.item +
          '"' +
          (option.item === value.value ? " selected" : "") +
          ">" +
          option.item +
          "</option>";
      });
      content +=
        "</select> " +
        defaultValueHint +
        "</div>" +
        '<div class="col-sm-12">' +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "password (write-only string)": {
      content +=
        '<label class="col-sm-2 control-label">Value <small>(string)</small></label>' +
        '<div class="col-sm-10">' +
        '<input type="password" class="form-control" value="' +
        value.value +
        '" data-key="' +
        key +
        '"' +
        extraAttributes +
        "> " +
        defaultValueHint +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    default: {
      content += "TYPE " + value.type + " NOT DEFINED";
    }
  }

  return '<div class="form-group row">' + content + "</div>";
}

function generateRow(topic, key, value) {
  // If the value is an object, we need to recurse
  if (!("description" in value)) {
    Object.keys(value).forEach(function (subkey) {
      var subvalue = value[subkey];
      generateRow(topic, key + "." + subkey, subvalue);
    });
    return;
  }

  // else: we have a setting we can display
  var box =
    '<div class="box settings-box">' +
    '<div class="box-header">' +
    '<h3 class="box-title" data-key="' +
    key +
    '" data-modified="' +
    (value.modified ? "true" : "false") +
    '">' +
    key +
    boxIcons(value) +
    "</h3>" +
    "</div>" +
    '<div class="box-body">' +
    utils.escapeHtml(value.description).replaceAll("\n", "<br>") +
    "</div>" +
    '<div class="box-footer">' +
    valueDetails(key, value) +
    "</div></div> ";

  var topKey = key.split(".")[0];
  var elem = $("#advanced-content-" + topKey + "-flex");
  elem.append(box);
}

function createDynamicConfigTabs() {
  $.ajax({
    url: "/api/config?detailed=true",
  })
    .done(function (data) {
      // Create the content for the advanced dynamic config topics
      Object.keys(data.topics).forEach(function (n) {
        var topic = data.topics[n];
        $("#advanced-content").append(
          '<div class="col-lg-12" id="advanced-content-' +
            topic.name +
            '">' +
            '<div class="box box-success">' +
            '<div class="box-header with-border no-user-select">' +
            '<h3 class="box-title">' +
            topic.description +
            " (<code>" +
            topic.name +
            "</code>)" +
            "</h3>" +
            "</div>" +
            '<div class="box-body">' +
            '<div class="row" id="advanced-content-' +
            topic.name +
            '-body">' +
            '<div class="col-xs-12 settings-container" id="advanced-content-' +
            topic.name +
            '-flex"></div>' +
            "</div>" +
            "</div>" +
            "</div>" +
            "</div>"
        );
      });
      Object.keys(data.config).forEach(function (topic) {
        var value = data.config[topic];
        generateRow(topic, topic, value, data);
      });
      $("#advanced-overlay").hide();

      $("button[id='save']").on("click", function () {
        saveSettings();
      });

      applyCheckboxRadioStyle();
      applyOnlyChanged();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function initOnlyChanged() {
  const elem = $("#only-changed");

  // Restore settings level from local storage (if available) or default to "false"
  if (localStorage.getItem("only-changed") === null) {
    localStorage.setItem("only-changed", "false");
  }

  elem.prop("checked", localStorage.getItem("only-changed") === "true");

  elem.bootstrapToggle({
    on: "Modified settings",
    off: "All settings",
    onstyle: "primary",
    offstyle: "success",
    size: "small",
    width: "180px",
  });

  elem.on("change", function () {
    localStorage.setItem("only-changed", $(this).prop("checked") ? "true" : "false");
    applyOnlyChanged();
  });

  elem.bootstrapToggle(localStorage.getItem("only-changed") === "true" ? "on" : "off");
  elem.trigger("change");
}

function applyOnlyChanged() {
  if (localStorage.getItem("only-changed") === "true") {
    // Hide all boxes that have a data-key attribute
    $(".box-title[data-key]").not("[data-modified='true']").closest(".box").hide();
  } else {
    // Show all boxes that have a data-key attribute
    $(".box-title[data-key]").closest(".box").show();
  }

  // Hide group headers on the all settings page after toggling to show only
  // modified settings if there are no modified settings within that group. This
  // prevents empty boxes when only-changed is enabled by hiding all boxes if
  // the box does not have at least one visible box as a child
  $(".box-title:not([data-key])").each(function () {
    const box = $(this).closest(".box");
    if (
      box.find(".box-title[data-key]:visible").length === 0 &&
      localStorage.getItem("only-changed") === "true"
    ) {
      box.hide();
    } else {
      box.show();
    }
  });
}

$(document).ready(function () {
  createDynamicConfigTabs();
  initOnlyChanged();
});
