/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false, initCheckboxRadioStyle:false */

var hostinfoTimer = null;
function updateHostInfo() {
  $.ajax({
    url: "/api/info/host",
  })
    .done(function (data) {
      var host = data.host;
      var uname = host.uname;
      if (uname.domainname !== "(none)") {
        $("#sysinfo-hostname").text(uname.nodename + "." + uname.domainname);
      } else {
        $("#sysinfo-hostname").text(uname.nodename);
      }

      $("#sysinfo-kernel").text(
        uname.sysname +
          " " +
          uname.nodename +
          " " +
          uname.release +
          " " +
          uname.version +
          " " +
          uname.machine
      );
      // Update every 120 seconds
      clearTimeout(hostinfoTimer);
      hostinfoTimer = setTimeout(updateHostInfo, 120000);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

var cacheinfoTimer = null;
function updateCacheInfo() {
  $.ajax({
    url: "/api/info/cache",
  })
    .done(function (data) {
      var cache = data.cache;
      $("#sysinfo-cache-size").text(cache.size);
      $("#sysinfo-cache-inserted").text(cache.inserted);
      $("#sysinfo-cache-evicted").text(cache.evicted);
      $("#sysinfo-cache-expired").text(cache.expired);
      $("#sysinfo-cache-immortal").text(cache.immortal);
      $("#sysinfo-cache-valid-a").text(cache.valid.a);
      $("#sysinfo-cache-valid-aaaa").text(cache.valid.aaaa);
      $("#sysinfo-cache-valid-cname").text(cache.valid.cname);
      $("#sysinfo-cache-valid-srv").text(cache.valid.srv);
      $("#sysinfo-cache-valid-ds").text(cache.valid.ds);
      $("#sysinfo-cache-valid-dnskey").text(cache.valid.dnskey);
      $("#sysinfo-cache-valid-other").text(cache.valid.other);
      $("#sysinfo-cache-overlay").hide();
      // Update every 10 seconds
      clearTimeout(cacheinfoTimer);
      cacheinfoTimer = setTimeout(updateCacheInfo, 10000);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

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

// Remove an element from an array (inline)
function removeFromArray(arr, what) {
  var found = arr.indexOf(what);

  while (found !== -1) {
    arr.splice(found, 1);
    found = arr.indexOf(what);
  }
}

function fillDNSupstreams(value, servers) {
  var i = 0;
  var customServers = value.value.length;
  servers.forEach(element => {
    var row = "<tr>";
    // Build checkboxes for IPv4 and IPv6
    const addresses = [element.v4, element.v6];
    for (let v = 0; v < 2; v++) {
      const address = addresses[v];
      for (let index = 0; index < 2; index++) {
        if (address.length > index) {
          row +=
            '<td title="' +
            address[index] +
            '"><div><input type="checkbox" id="DNSupstreams-' +
            i +
            '"';
          if (address[index] in value.value || address[index] + "#53" in value.value) {
            row += " checked";
            customServers--;
          }

          row += '><label for="DNSupstreams-' + i++ + '"></label></div></td>';
        } else {
          row += "<td></td>";
        }
      }
    }

    // Add server name
    row += "<td>" + element.name + "</td>";

    // Close table row
    row += "</tr>";

    // Add row to table
    $("#DNSupstreamsTable").append(row);
  });

  // Add event listener to checkboxes
  $("input[id^='DNSupstreams-']").on("change", function () {
    var upstreams = $("#DNSupstreamsTextfield").val().split("\n");
    var customServers = 0;
    $("#DNSupstreamsTable input").each(function () {
      if (this.checked && !upstreams.includes(this.title)) {
        // Add server to array
        upstreams.push(this.title);
      } else if (!this.checked && upstreams.includes(this.title)) {
        // Remove server from array
        removeFromArray(upstreams, this.title);
      }

      if (upstreams.includes(this.title)) customServers--;
    });
    // The variable will contain a negative value, we need to add the length to
    // get the correct number of custom servers
    customServers += upstreams.length;
    updateDNSserversTextfield(upstreams, customServers);
  });

  // Initialize textfield
  updateDNSserversTextfield(value.value, customServers);
}

function updateDNSserversTextfield(upstreams, customServers) {
  $("#DNSupstreamsTextfield").val(upstreams.join("\n"));
  $("#custom-servers-title").text(
    "(" + customServers + " custom server" + (customServers === 1 ? "" : "s") + " enabled)"
  );
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
    '<div class="col-md-6">' +
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
        '<label class="col-sm-4 control-label">Enabled</label>' +
        '<div class="col-sm-8">' +
        '<div><input type="checkbox" ' +
        (value.value ? " checked" : "") +
        "> " +
        defaultValueHint +
        " </div></div>";

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

function createDynamicConfigTabs() {
  $.ajax({
    url: "/api/config?detailed=true",
  })
    .done(function (data) {
      // Initialize the DNS upstreams
      fillDNSupstreams(data.config.dns.upstreams, data.dns_servers);

      // Create the content for the advanced dynamic config topics
      $("#advanced-content").empty();
      Object.keys(data.config).forEach(function (topic) {
        Object.keys(data.config[topic]).forEach(function (key) {
          var value = data.config[topic][key];
          generateRow(topic, topic + "." + key, value, data);
        });
      });
      $("#advanced-overlay").hide();

      initCheckboxRadioStyle();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(function () {
  updateHostInfo();
  updateCacheInfo();
  createDynamicConfigTabs();
});

$(".confirm-poweroff").confirm({
  text: "Are you sure you want to send a poweroff command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#poweroffform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, poweroff",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});
$(".confirm-reboot").confirm({
  text: "Are you sure you want to send a reboot command to your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    $("#rebootform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, reboot",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-restartdns").confirm({
  text: "Are you sure you want to send a restart command to your DNS server?",
  title: "Confirmation required",
  confirm: function () {
    $("#restartdnsform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flushlogs").confirm({
  text: "Are you sure you want to flush your logs?",
  title: "Confirmation required",
  confirm: function () {
    $("#flushlogsform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-flusharp").confirm({
  text: "Are you sure you want to flush your network table?",
  title: "Confirmation required",
  confirm: function () {
    $("#flusharpform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, flush my network table",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(".confirm-disablelogging-noflush").confirm({
  text: "Are you sure you want to disable logging?",
  title: "Confirmation required",
  confirm: function () {
    $("#disablelogsform-noflush").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, disable logs",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-warning",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

// Handle hiding of alerts
$(function () {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });
});

// DHCP leases tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});

// Change "?tab=" parameter in URL for save and reload
$(".nav-tabs a").on("shown.bs.tab", function (e) {
  var tab = e.target.hash.substring(1);
  window.history.pushState("", "", "?tab=" + tab);
  window.scrollTo(0, 0);
});
