/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure: false, applyCheckboxRadioStyle: false, fillDNSupstreams: false */
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

  // Select listening mode radio button
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

  // else: we have a setting we can display
  var row =
    '<div class="col-md-6 ' +
    (value.flags.advanced ? "advanced-setting" : "") +
    '">' +
    '<div class="box box-warning">' +
    '<div class="box-header with-border">' +
    '<h3 class="box-title">' +
    key +
    (value.modified ? '&nbsp;&nbsp;<i class="far fa-edit" title="Modified"></i>' : "") +
    (value.flags.advanced
      ? '&nbsp;&nbsp;<i class="fas fa-cogs" title="This is an advanced setting"></i>'
      : "") +
    "</h3>" +
    "<p>" +
    utils.escapeHtml(value.description).replace("\n", "<br>") +
    "</p>" +
    "</div>" +
    '<div class="box-body">' +
    '<div class="row">' +
    '<div class="col-lg-12">' +
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
      row +=
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
      row +=
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
      row +=
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
      row +=
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
      row +=
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
      row +=
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
      row +=
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
      row +=
        '<label class="col-sm-4 control-label">Selected Option</label>' +
        '<div class="col-sm-8">' +
        '<select class="form-control">';
      value.allowed.forEach(function (option) {
        row +=
          '<option value="' +
          option.item +
          '"' +
          (option.item === value.value ? " selected" : "") +
          ">" +
          option.item +
          "</option>";
      });
      row +=
        "</select> " +
        defaultValueHint +
        "</div>" +
        '<div class="col-sm-12">' +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    default: {
      row += "TYPE " + value.type + " NOT DEFINED";
    }
  }

  row += "</div></div></div></div> ";
  $("#advanced-content").append(row);
}

function fillDHCPhosts(data) {
  $("#dhcp-hosts").val(data.value.join("\n"));
}

// eslint-disable-next-line no-unused-vars
function createDynamicConfigTabs() {
  $.ajax({
    url: "/api/config?detailed=true",
  })
    .done(function (data) {
      // Initialize the DNS upstreams
      fillDNSupstreams(data.config.dns.upstreams, data.dns_servers);

      fillDHCPhosts(data.config.dhcp.hosts);

      // Create the content for the advanced dynamic config topics
      $("#advanced-content").empty();
      Object.keys(data.config).forEach(function (topic) {
        Object.keys(data.config[topic]).forEach(function (key) {
          var value = data.config[topic][key];
          generateRow(topic, topic + "." + key, value, data);
        });
      });
      $("#advanced-overlay").hide();

      applyCheckboxRadioStyle();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}
