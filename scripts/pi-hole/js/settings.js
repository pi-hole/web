/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false */

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

function generateDNSServers() {
  // Build array from multiline string, one item per line
  var servers = $("#dns-servers").text().split("\n");
  console.log(servers);
}

function fillDNSupstreams(value, servers) {
  var row =
    '<div class="col-lg-6">' +
    '<div class="box box-warning">' +
    '<div class="box-header with-border">' +
    '<h1 class="box-title">Upstream DNS Servers</h1>' +
    "</div>" +
    '<div class="box-body">' +
    '<div class="row">' +
    '<div class="col-sm-12">' +
    '<table class="table table-bordered">' +
    "<thead>" +
    "<tr>" +
    '<th colspan="2">IPv4</th>' +
    '<th colspan="2">IPv6</th>' +
    "<th>Name</th>" +
    "</tr>" +
    "</thead>" +
    "<tbody>";
  servers.forEach(element => {
    row += "<tr>";
    // Build checkboxes for IPv4 and IPv6
    const variants = [element.v4, element.v6];
    for (let v = 0; v < 2; v++) {
      const variant = variants[v];
      for (let index = 0; index < 2; index++) {
        if (variant.length > index) {
          row += '<td title="' + variant[index] + '"><input type="checkbox" id="DNSupstreams"';
          if (variant[index] in value.value || variant[index] + "#53" in value.value) {
            row += " checked";
          }

          row += "></td>";
        } else {
          row += "<td></td>";
        }
      }
    }

    // Build name
    row += "<td>" + element.name + "</td>";
  });
  // Close table
  row +=
    "</tbody>" +
    "</table>" +
    "<p>ECS (Extended Client Subnet) defines a mechanism for recursive resolvers to send partial client IP address information to authoritative DNS name servers. Content Delivery Networks (CDNs) and latency-sensitive services use this to give geo-located responses when responding to name lookups coming through public DNS resolvers. <em>Note that ECS may result in reduced privacy.</em></p>" +
    "<p> Custom DNS servers can be added by specifying the IP address (and optionally the port number separated by a <code>#</code>) of the server. If the port number is not specified, the default port 53 will be used. The following box contains one server per line:</p>";
  // Append textbox showing the current values
  row +=
    '<label class="col-sm-5 control-label">Values (one server per line)</label>' +
    '<div class="col-sm-7">' +
    '<textarea class="form-control" id="dns-servers">' +
    value.value.join("\n") +
    "</textarea> " +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>" +
    "</div>";

  $("#dns-content").append(row);
}

function generateRow(topic, key, value, fullConfig = null) {
  if (topic === "dns" && key === "upstreams") {
    console.log(value, fullConfig);
    fillDNSupstreams(value, fullConfig.dns_servers);
    return;
  }

  if (!("description" in value)) {
    Object.keys(value).forEach(function (subkey) {
      var subvalue = value[subkey];
      row = generateRow(topic, key + "." + subkey, subvalue);
    });
    return;
  }

  var row =
    '<div class="col-md-6 ' +
    (value.flags.advanced ? 'advanced-setting" hidden' : '"') +
    ">" +
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
  var resetToDefault = "";
  if (value.modified) {
    resetToDefault =
      '<button type="button" class="btn btn-default btn-sm pull-right" onclick="resetToDefault(\'' +
      topic +
      "','" +
      key +
      '\')" title="Default option is: ' +
      utils.escapeHtml(JSON.stringify(value.default)) +
      '"><i class="fas fa-redo"></i>&nbsp&nbsp;Reset to default</button>';
  }

  switch (value.type) {
    case "string": {
      row +=
        '<label class="col-sm-4 control-label">Value (string)</label>' +
        '<div class="col-sm-8">' +
        '<input type="text" class="form-control" value="' +
        value.value +
        '"> ' +
        resetToDefault +
        addAllowedValues(value.allowed) +
        "</div>";

      break;
    }

    case "boolean": {
      row +=
        '<label class="col-sm-4 control-label">Enabled</label>' +
        '<div class="col-sm-8">' +
        '<input type="checkbox" ' +
        (value.value ? " checked" : "") +
        "> " +
        resetToDefault +
        " </div>";

      break;
    }

    case "integer": {
      row +=
        '<label class="col-sm-4 control-label">Value (integer)</label>' +
        '<div class="col-sm-8">' +
        '<input type="number" step="1" class="form-control" value="' +
        value.value +
        '"> ' +
        resetToDefault +
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
        resetToDefault +
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
        resetToDefault +
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
        resetToDefault +
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
        resetToDefault +
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
  $("#" + topic + "-content").append(row);
}

function createDynamicConfigTabs() {
  $.ajax({
    url: "/api/config?detailed=true",
  })
    .done(function (data) {
      var navTabs = $(".nav-tabs");
      var tabContent = $(".tab-content");

      // Remove the teleporter tab (it is added as the last tab after the loop)
      var teleporter = $(".nav-tabs > li").last();
      navTabs.remove(teleporter);

      // Create the tabs for the dynamic config topics
      data.topics.forEach(function (topic) {
        var nav =
          '<li role="presentation"><a href="#' +
          topic.name +
          '" aria-controls="' +
          topic.name +
          '" aria-expanded="false" role="tab" data-toggle="tab">' +
          topic.title +
          "</a></li>";
        navTabs.append(nav);
        var content =
          '<div id="' +
          topic.name +
          '" class="tab-pane fade">' +
          '<div class="row">' +
          '<div class="col-md-12">' +
          '<div class="box">' +
          '<div class="box-header with-border">' +
          '<h3 class="box-title">' +
          topic.title +
          "</h3>" +
          "<p>" +
          topic.description +
          "</p>" +
          '<p><input type="checkbox" id="advanced-settings-toggle-' +
          topic.name +
          '"><label for="advanced-settings-toggle-' +
          topic.name +
          '">&nbsp;Show advanced settings</label></p>' +
          "</div>" +
          '<div class="box-body">' +
          '<div class="row">' +
          '<div class="col-lg-12" id="' +
          topic.name +
          '-content">' +
          "</div>" +
          '<div class="overlay" id="settings-' +
          topic.name +
          '-overlay">' +
          '<i class="fa fa-sync fa-spin"></i>' +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>" +
          "</div>";
        tabContent.append(content);
      });

      navTabs.append(teleporter);

      // Create the content for the dynamic config topics
      Object.keys(data.config).forEach(function (topic) {
        Object.keys(data.config[topic]).forEach(function (key) {
          var value = data.config[topic][key];
          generateRow(topic, key, value, data);
        });
        $("#settings-" + topic + "-overlay").hide();

        $("input[id^='advanced-settings-toggle']").on("click", function (data) {
          var checked = data.target.checked;
          // Synchronize all advanced settings checkboxes
          $("input[id^='advanced-settings-toggle']").prop("checked", checked);
          // Show/hide all advanced settings
          $(".advanced-setting").toggle(checked);
        });
      });

      // Remove the overlay
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
