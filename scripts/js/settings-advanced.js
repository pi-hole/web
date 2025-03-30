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
        .map(option => {
          return "<code>" + option.item + "</code>: " + utils.escapeHtml(option.description);
        })
        .join("</li><li>") +
      "</li></ul>"
    );
  }

  if (typeof allowed === "string") {
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
        '<label class="col-sm-12 control-label">Values <small>(one item per line)</small></label>' +
        '<div class="col-sm-12">' +
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
      content += '<div class="col-sm-12">';
      for (const [i, option] of value.allowed.entries()) {
        content +=
          "<div>" +
          // Radio button
          '<input type="radio" class="form-control" ' +
          `value="${option.item}" name="${key}" id="${key}_${i}" data-key="${key}"${extraAttributes}` +
          (option.item === value.value ? " checked" : "") +
          ">" +
          // Label
          `<label for="${key}_${i}"><strong>${utils.escapeHtml(option.item)}` +
          (option.item === value.default ? " <em>(default)</em>" : "") +
          "</strong></label>" +
          // Paragraph with description
          `<p class="help-block">${option.description}</p>` +
          "</div>";
      }

      content += "</div>";

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

  return '<div class="row">' + content + "</div>";
}

function generateRow(topic, key, value) {
  // If the value is an object, we need to recurse
  if (!("description" in value)) {
    for (const subkey of Object.keys(value)) {
      const subvalue = value[subkey];
      generateRow(topic, key + "." + subkey, subvalue);
    }

    return;
  }

  // else: we have a setting we can display
  const box =
    '<div class="box settings-box">' +
    '<div class="box-header with-border">' +
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

  const topKey = key.split(".")[0];
  const elem = $("#advanced-content-" + topKey + "-flex");
  elem.append(box);
}

function createDynamicConfigTabs() {
  $.ajax({
    url: document.body.dataset.apiurl + "/config?detailed=true",
  })
    .done(data => {
      // Create the tabs for the advanced dynamic config topics
      for (const n of Object.keys(data.topics)) {
        const topic = data.topics[n];

        $("#advanced-settings-tabs").append(`
          <div id="advanced-content-${topic.name}" role="tabpanel" class="tab-pane fade">
            <h3 class="page-header">${topic.description} (<code>${topic.name}</code>)</h3>
            <div class="row" id="advanced-content-${topic.name}-body">
              <div class="col-xs-12 settings-container" id="advanced-content-${topic.name}-flex"></div>
            </div>
          </div>
        `);

        // Dynamically create the settings menu
        $("#advanced-settings-menu ul").append(`
          <li role="presentation">
            <a href="#advanced-content-${topic.name}" class="btn btn-default" aria-controls="advanced-content-${topic.name}" role="pill" data-toggle="pill">${topic.description.replace(" settings", "")}</a>
          </li>
        `);
      }

      // Dynamically fill the tabs with config topics
      for (const topic of Object.keys(data.config)) {
        const value = data.config[topic];
        generateRow(topic, topic, value);
      }

      $("#advanced-overlay").hide();

      // Select the first tab and show the content
      $("#advanced-settings-menu ul li:first-child").addClass("active");
      $("#advanced-settings-tabs > div:first-child").addClass("active in");

      $("button[id='save']").on("click", () => {
        saveSettings();
      });

      applyCheckboxRadioStyle();
      applyOnlyChanged();
    })
    .fail(data => {
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
    // Show only modified settings (hide tabs menu and empty tabs).

    // Hide the tabs menu
    $("#advanced-settings-menu").hide();

    // Show all tabs, except the ones containing "data-modified='true'" attribute
    // to prevent empty tabs (using the same classes used by Boostrap3)
    $("#advanced-settings-tabs > .tab-pane").addClass("in active");
    $("#advanced-settings-tabs > .tab-pane:not(:has(h3[data-modified='true']))").removeClass(
      "in active"
    );

    // Hide all boxes with data-key attribute, except the ones with "data-modified='true'" attribute
    $(".box-title[data-key]").not("[data-modified='true']").closest(".box").hide();
  } else {
    // Show the tabs menu and activate only the first button (deactivate other buttons)
    $("#advanced-settings-menu").show();
    $("#advanced-settings-menu ul li").removeClass("active");
    $("#advanced-settings-menu ul li:first-child").addClass("active");

    // Hide all tabs, except the first one (removing the classes used by Boostrap3)
    $("#advanced-settings-tabs > .tab-pane:not(:first-child)").removeClass("in active");

    // Show all boxes with data-key attribute
    $(".box-title[data-key]").closest(".box").show();
  }
}

$(document).ready(() => {
  createDynamicConfigTabs();
  initOnlyChanged();
});
