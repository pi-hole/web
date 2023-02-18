/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure: false, applyCheckboxRadioStyle: false */
/* exported createDynamicConfigTabs */

function addAllowedValues(allowed) {
  if (typeof allowed === "object") {
    return (
      "<p>Available options: <ul><li>" +
      allowed
        .map(function (option) {
          return "<code>" + option.item + "</code>: " + utils.escapeHtml(option.description);
        })
        .join("</li><li>") +
      "</li></ul></p>"
    );
  } else if (typeof allowed === "string") {
    return "<p><small>Allowed value: " + utils.escapeHtml(allowed) + "</small></p>";
  }
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
    '<div class="box box-warning">' +
    '<div class="box-header no-user-select">' +
    '<h3 class="box-title">' +
    key +
    (value.modified ? '&nbsp;&nbsp;<i class="far fa-edit" title="Modified"></i>' : "") +
    (value.flags.advanced
      ? '&nbsp;&nbsp;<i class="fas fa-cogs" title="This is an expert-level setting"></i>'
      : "") +
    "</h3>" +
    "<p>" +
    utils.escapeHtml(value.description).replace("\n", "<br>") +
    "</p>" +
    "</div>" +
    '<div class="box-body">' +
    '<div class="form-group">';
  var defaultValueHint = "";
  if (value.modified) {
    defaultValueHint = "";
    if (value.default !== null) {
      var defVal = utils.escapeHtml(JSON.stringify(value.default));
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

  switch (value.type) {
    case "IPv4 address":
    case "IPv6 address":
    case "string": {
      box +=
        '<label class="col-sm-4 control-label">Value (string)</label>' +
        '<div class="col-sm-8">' +
        '<input type="text" class="form-control" value="' +
        value.value +
        '"> ' +
        defaultValueHint +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "boolean": {
      box +=
        '<div><input type="checkbox" ' +
        (value.value ? " checked" : "") +
        ' id="' +
        key +
        '-checkbox"><label for="' +
        key +
        '-checkbox">Enabled ' +
        defaultValueHint +
        "</label>" +
        " </div>";

      break;
    }

    case "double": {
      box +=
        '<label class="col-sm-4 control-label">Value</label>' +
        '<div class="col-sm-8">' +
        '<input type="number" class="form-control" value="' +
        value.value +
        '"> ' +
        defaultValueHint +
        "</div>";

      break;
    }

    case "integer": {
      box +=
        '<label class="col-sm-4 control-label">Value (integer)</label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" class="form-control" value="' +
        value.value +
        '"> ' +
        defaultValueHint +
        "</div>";

      break;
    }

    case "unsigned integer": {
      box +=
        '<label class="col-sm-4 control-label">Value (unsigned integer)</label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" min="0" class="form-control" value="' +
        value.value +
        '"> ' +
        defaultValueHint +
        "</div>";

      break;
    }

    case "unsigned integer (16 bit)": {
      box +=
        '<label class="col-sm-4 control-label">Value (unsigned 16bit integer)</label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" min="0" max="65535" class="form-control" value="' +
        value.value +
        '"> ' +
        defaultValueHint +
        "</div>";

      break;
    }

    case "string array": {
      box +=
        '<label class="col-sm-5 control-label">Values (one item per line)</label>' +
        '<div class="col-sm-7">' +
        '<textarea class="form-control">' +
        value.value.join("\n") +
        "</textarea> " +
        defaultValueHint +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "enum (string)": {
      box +=
        '<label class="col-sm-4 control-label">Selected Option</label>' +
        '<div class="col-sm-8">' +
        '<select class="form-control">';
      value.allowed.forEach(function (option) {
        box +=
          '<option value="' +
          option.item +
          '"' +
          (option.item === value.value ? " selected" : "") +
          ">" +
          option.item +
          "</option>";
      });
      box +=
        "</select> " +
        defaultValueHint +
        "</div>" +
        '<div class="col-sm-12">' +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    default: {
      box += "TYPE " + value.type + " NOT DEFINED";
    }
  }

  box += "</div></div> ";
  var topKey = key.split(".")[0];
  // Add the box to the left or right column depending on which is shorter
  // This is done to reduce gaps between boxes
  var elem =
    $("#advanced-content-" + topKey + "-left").height() <=
    $("#advanced-content-" + topKey + "-right").height() + 10
      ? $("#advanced-content-" + topKey + "-left")
      : $("#advanced-content-" + topKey + "-right");
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
            '<div class="col-md-6" id="advanced-content-' +
            topic.name +
            '-left"></div>' +
            '<div class="col-md-6" id="advanced-content-' +
            topic.name +
            '-right"></div>' +
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

      applyCheckboxRadioStyle();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(document).ready(function () {
  createDynamicConfigTabs();
});
