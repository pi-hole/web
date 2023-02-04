/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, checkMessages:false, apiFailure:false */
var token = $("#token").text();

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
        var nav = '<li role="presentation"><a href="#' + topic.name + '" aria-controls="' + topic.name + '" aria-expanded="false" role="tab" data-toggle="tab">' + topic.title + '</a></li>';
        navTabs.append(nav);
        var content = '<div id="' + topic.name + '" class="tab-pane fade"> \
        <div class="row"> \
          <div class="col-md-12"> \
            <div class="box"> \
              <div class="box-header with-border"> \
                <h3 class="box-title">' + topic.title + '</h3> \
                <p>' + topic.description + '</p> \
                <p><input type="checkbox" id="advanced-settings-toggle-' + topic.name + '"><label for="advanced-settings-toggle-' + topic.name + '">&nbsp;Show advanced settings</label></p> \
              </div> \
              <div class="box-body"> \
                <div class="row"> \
                  <div class="col-lg-12" id="' + topic.name + '-content"> \
                  </div> \
                  <div class="overlay" id="settings-' + topic.name + '-overlay"> \
                    <i class="fa fa-sync fa-spin"></i> \
                  </div> \
                </div> \
              </div> \
            </div> \
          </div>';
        tabContent.append(content);
      });

      navTabs.append(teleporter);

      // Create the content for the dynamic config topics
      Object.keys(data.config).forEach(function (topic) {
        Object.keys(data.config[topic]).forEach(function (key) {
          var value = data.config[topic][key];
          console.log(topic, value);
          if('description' in value) {
            var row = '<div class="col-md-6 ' + (value.flags.advanced ? 'advanced-setting" hidden':'"') + '> \
                        <div class="box box-warning"> \
                          <div class="box-header with-border"> \
                            <h3 class="box-title">' + key + (value.modified ? '&nbsp;&nbsp;<i class="far fa-edit" title="Modified"></i>':'') + (value.flags.advanced ? '&nbsp;&nbsp;<i class="fas fa-cogs" title="This is an advanced setting"></i>':'') + '</h3> \
                            <p>' + utils.escapeHtml(value.description).replace("\n","<br>") + '</p> \
                          </div> \
                          <div class="box-body"> \
                            <div class="row"> \
                              <div class="col-lg-12"> \
                                <div class="form-group">';
            var resetToDefault = '';
            if(value.modified) {
              resetToDefault = '<button type="button" class="btn btn-default btn-sm pull-right" onclick="resetToDefault(\'' + topic + '\',\'' + key + '\')" title="Default option is: \"' + JSON.stringify(value.default) + '\""><i class="fas fa-redo"></i>&nbsp&nbsp;Reset to default</button>';
            }
            if(value['type'] == "string") {
              row += '<label class="col-sm-4 control-label">Value (string)</label> \
                      <div class="col-sm-8"> \
                        <input type="text" class="form-control" value="' + value.value + '"> ' + resetToDefault + '\
                        <p><small>Allowed value: ' + utils.escapeHtml(value.allowed) + '</small></p> \
                        </div>';
            } else if(value['type'] == "boolean") {
              row += '<label class="col-sm-4 control-label">Enabled</label> \
                      <div class="col-sm-8"> \
                        <input type="checkbox" ' + (value.value ? ' checked':'') + '> ' + resetToDefault + '\
                        </div>';
            } else if(value['type'] == "integer") {
              row += '<label class="col-sm-4 control-label">Value (integer)</label> \
                      <div class="col-sm-8"> \
                        <input type="number" step="1" class="form-control" value="' + value.value + '"> ' + resetToDefault + '\
                        </div>';
            } else if(value['type'] == "unsigned integer") {
              row += '<label class="col-sm-4 control-label">Value (unsigned integer)</label> \
                      <div class="col-sm-8"> \
                        <input type="number" step="1" min="0" class="form-control" value="' + value.value + '"> ' + resetToDefault + '\
                        </div>';
            } else if(value['type'] == "unsigned integer (16 bit)") {
              row += '<label class="col-sm-4 control-label">Value (unsigned 16bit integer)</label> \
                      <div class="col-sm-8"> \
                        <input type="number" step="1" min="0" max="65535" class="form-control" value="' + value.value + '"> ' + resetToDefault + '\
                        </div>';
            } else if(value['type'] == "string array") {
              row += '<label class="col-sm-5 control-label">Values (one item per line)</label> \
                      <div class="col-sm-7"> \
                        <textarea class="form-control">' + value.value.join("\n") + '</textarea> ' + resetToDefault + '\
                        </div>';
            } else if(value['type'] == "enum (string)") {
              row += '<label class="col-sm-4 control-label">Selected Option</label> \
                      <div class="col-sm-8"> \
                        <select class="form-control">';
              value.allowed.forEach(function(option) {
                row += '<option value="' + option.item + '"' + (option.item == value.value ? ' selected':'') + '>' + option.item + '</option>';
              });
              row += '</select> ' + resetToDefault + '\
                    </div> \
                    <div class="col-sm-12"> \
                      <p>Available options: <ul><li>' + value.allowed.map(function(option) { return '<code>' + option.item + '</code>: ' + utils.escapeHtml(option.description); }).join('</li><li>') + '</li></ul></p> \
                    </div>';
            } else {
              row += "TYPE " + value.type + " NOT DEFINED";
            }
            row +='          </div> \
                            </div> \
                          </div> \
                        </div> ';
          }
          $("#" + topic + "-content").append(row);
        });
        $('#settings-' + topic + '-overlay').hide();

        $("input[id^='advanced-settings-toggle']").on("click", function(data) {
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
