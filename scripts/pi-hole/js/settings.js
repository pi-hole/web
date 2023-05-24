/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, checkMessages:false */
var token = $("#token").text();

$(function () {
  $("[data-static]").on("click", function () {
    var row = $(this).closest("tr");
    var mac = row.find("#MAC").text();
    var ip = row.find("#IP").text();
    var host = row.find("#HOST").text();
    $('input[name="AddHostname"]').val(host);
    $('input[name="AddIP"]').val(ip);
    $('input[name="AddMAC"]').val(mac);
  });

  // prepare Teleporter Modal & iframe for operation
  $("#teleporterModal").on("show.bs.modal", function () {
    $('iframe[name="teleporter_iframe"]').removeAttr("style").contents().find("body").html("");
    $(this).find("button").prop("disabled", true);
    $(this).find(".overlay").show();
  });

  // set Teleporter iframe's font, enable Modal's button(s), ...
  $('iframe[name="teleporter_iframe"]').on("load", function () {
    var font = {
      "font-family": $("pre").css("font-family"),
      "font-size": $("pre").css("font-size"),
      color: $("pre").css("color"),
    };
    var contents = $(this).contents();
    contents.find("body").css(font);
    $("#teleporterModal").find(".overlay").hide();
    var BtnEls = $(this).parents(".modal-content").find("button").prop("disabled", false);

    // force user to reload the page if necessary
    var reloadEl = contents.find("span[data-forcereload]");
    if (reloadEl.length > 0) {
      var msg = "The page must now be reloaded to display the imported entries";
      reloadEl.append(msg);
      BtnEls.toggleClass("hidden")
        .not(".hidden")
        .on("click", function () {
          // window.location.href avoids a browser warning for resending form data
          window.location = window.location.href;
        });
    }

    // expand iframe's height
    var contentHeight = contents.find("html").height();
    if (contentHeight > $(this).height()) {
      $(this).height(contentHeight);
    }
  });

  // display selected import file on button's adjacent textfield
  $("#zip_file").on("change", function () {
    var fileName = $(this)[0].files.length === 1 ? $(this)[0].files[0].name : "";
    $("#zip_filename").val(fileName);
  });
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

$(".api-token").confirm({
  text: "Make sure that nobody else can scan this code around you. They will have full access to the API without having to know the password. Note that the generation of the QR code will take some time.",
  title: "Confirmation required",
  confirm: function () {
    $("#apiTokenModal").modal("show");
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, show API token",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$("#apiTokenModal").on("show.bs.modal", function () {
  var bodyStyle = {
    "font-family": $("body").css("font-family"),
    "background-color": "white",
  };
  $('iframe[name="apiToken_iframe"]').contents().find("body").css(bodyStyle);
  var qrCodeStyle = {
    margin: "auto",
  };
  $('iframe[name="apiToken_iframe"]').contents().find("table").css(qrCodeStyle);
});

$("#DHCPchk").on("click", function () {
  $("input.DHCPgroup").prop("disabled", !this.checked);
  $("#dhcpnotice").prop("hidden", !this.checked).addClass("lookatme");
});

function loadCacheInfo() {
  $.getJSON("api.php?getCacheInfo", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Fill table with obtained values
    $("#cache-size").text(parseInt(data.cacheinfo["cache-size"], 10));
    $("#cache-inserted").text(parseInt(data.cacheinfo["cache-inserted"], 10));

    // Highlight early cache removals when present
    var cachelivefreed = parseInt(data.cacheinfo["cache-live-freed"], 10);
    $("#cache-live-freed").text(cachelivefreed);
    if (cachelivefreed > 0) {
      $("#cache-live-freed").parent("tr").children("th").children("span").addClass("lookatme");
      $("#cache-live-freed").parent("tr").children("td").addClass("lookatme");
      $("#cache-live-freed")
        .parent("tr")
        .children("td")
        .attr("lookatme-text", cachelivefreed.toString());
    } else {
      $("#cache-live-freed").parent("tr").children("th").children("span").removeClass("lookatme");
      $("#cache-live-freed").parent("tr").children("td").removeClass("lookatme");
    }

    // Update cache info every 10 seconds
    setTimeout(loadCacheInfo, 10000);
  });
}

var leasetable, staticleasetable;
$(function () {
  if (document.getElementById("DHCPLeasesTable")) {
    leasetable = $("#DHCPLeasesTable").DataTable({
      dom:
        "<'row'<'col-sm-12'f>>" +
        "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
        "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
        "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      lengthMenu: [
        [5, 10, 25, 50, 100, -1],
        [5, 10, 25, 50, 100, "All"],
      ],
      columnDefs: [
        { bSortable: false, orderable: false, targets: -1 },
        {
          targets: [0, 1],
          render: $.fn.dataTable.render.text(),
        },
        {
          targets: 2,
          render: function (data) {
            // Show "unknown", when host is "*"
            var str;
            if (data === "*") {
              str = "<i>unknown</i>";
            } else {
              str = typeof data === "string" ? utils.escapeHtml(data) : data;
            }

            return str;
          },
        },
      ],
      paging: true,
      order: [[2, "asc"]],
      stateSave: true,
      stateDuration: 0,
      stateSaveCallback: function (settings, data) {
        utils.stateSaveCallback("activeDhcpLeaseTable", data);
      },
      stateLoadCallback: function () {
        return utils.stateLoadCallback("activeDhcpLeaseTable");
      },
    });
  }

  if (document.getElementById("DHCPStaticLeasesTable")) {
    staticleasetable = $("#DHCPStaticLeasesTable").DataTable({
      dom:
        "<'row'<'col-sm-12'f>>" +
        "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
        "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
        "<'row'<'col-sm-5'i><'col-sm-7'p>>",
      lengthMenu: [
        [5, 10, 25, 50, 100, -1],
        [5, 10, 25, 50, 100, "All"],
      ],
      columnDefs: [
        { bSortable: false, orderable: false, targets: -1 },
        {
          targets: [0, 1, 2],
          render: $.fn.dataTable.render.text(),
        },
      ],
      paging: true,
      order: [[2, "asc"]],
      stateSave: true,
      stateSaveCallback: function (settings, data) {
        utils.stateSaveCallback("staticDhcpLeaseTable", data);
      },
      stateLoadCallback: function () {
        return utils.stateLoadCallback("staticDhcpLeaseTable");
      },
    });
  }

  //call draw() on each table... they don't render properly with scrollX and scrollY set... ¯\_(ツ)_/¯
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    leasetable.draw();
    staticleasetable.draw();
  });

  loadCacheInfo();
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

// Auto dismissal for info notifications
$(function () {
  var alInfo = $("#alInfo");
  if (alInfo.length > 0) {
    alInfo.delay(3000).fadeOut(2000, function () {
      alInfo.hide();
    });
  }

  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);

  // En-/disable conditional forwarding input fields based
  // on the checkbox state
  $('input[name="rev_server"]').on("click", function () {
    $('input[name="rev_server_cidr"]').prop("disabled", !this.checked);
    $('input[name="rev_server_target"]').prop("disabled", !this.checked);
    $('input[name="rev_server_domain"]').prop("disabled", !this.checked);
  });
});

// Change "?tab=" parameter in URL for save and reload
$(".nav-tabs a").on("shown.bs.tab", function (e) {
  var tab = e.target.hash.substring(1);
  window.history.pushState("", "", "?tab=" + tab);
  window.scrollTo(0, 0);
});

// Bar/Smooth chart toggle
$(function () {
  var bargraphs = $("#bargraphs");
  var chkboxData = localStorage ? localStorage.getItem("barchart_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    bargraphs.prop("checked", true);
    if (localStorage) {
      localStorage.setItem("barchart_chkbox", true);
    }
  } else {
    // Restore checkbox state
    bargraphs.prop("checked", chkboxData === "true");
  }

  bargraphs.on("click", function () {
    localStorage.setItem("barchart_chkbox", bargraphs.prop("checked"));
  });
});

$(function () {
  var colorfulQueryLog = $("#colorfulQueryLog");
  var chkboxData = localStorage ? localStorage.getItem("colorfulQueryLog_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    colorfulQueryLog.prop("checked", false);
    if (localStorage) {
      localStorage.setItem("colorfulQueryLog_chkbox", false);
    }
  } else {
    // Restore checkbox state
    colorfulQueryLog.prop("checked", chkboxData === "true");
  }

  colorfulQueryLog.on("click", function () {
    localStorage.setItem("colorfulQueryLog_chkbox", colorfulQueryLog.prop("checked"));
  });
});

// Delete dynamic DHCP lease
$('button[id="removedynamic"]').on("click", function () {
  var tr = $(this).closest("tr");
  var ipaddr = utils.escapeHtml(tr.children("#IP").text());
  var name = utils.escapeHtml(tr.children("#HOST").text());
  var ipname = name + " (" + ipaddr + ")";

  utils.disableAll();
  utils.showAlert("info", "", "Deleting DHCP lease...", ipname);
  $.ajax({
    url: "api.php",
    method: "get",
    dataType: "json",
    data: {
      delete_lease: ipaddr,
      token: token,
    },
    success: function (response) {
      utils.enableAll();
      if (response.delete_lease.startsWith("OK")) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted DHCP lease for ",
          ipname
        );
        // Remove column on success
        tr.remove();
        // We have to hide the tooltips explicitly or they will stay there forever as
        // the onmouseout event does not fire when the element is already gone
        $.each($(".tooltip"), function () {
          $(this).remove();
        });
      } else {
        utils.showAlert("error", "Error while deleting DHCP lease for " + ipname, response);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "Error while deleting DHCP lease for " + ipname, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
});

// Non-fatal dnsmasq warnings toggle
$(function () {
  var nonfatalwarnigns = $("#hideNonfatalDnsmasqWarnings");
  var chkboxData = localStorage ? localStorage.getItem("hideNonfatalDnsmasqWarnings_chkbox") : null;

  if (chkboxData === null) {
    // Initialize checkbox
    nonfatalwarnigns.prop("checked", false);
    if (localStorage) {
      localStorage.setItem("hideNonfatalDnsmasqWarnings_chkbox", false);
    }
  } else {
    // Restore checkbox state
    nonfatalwarnigns.prop("checked", chkboxData === "true");
  }

  nonfatalwarnigns.on("click", function () {
    localStorage.setItem("hideNonfatalDnsmasqWarnings_chkbox", nonfatalwarnigns.prop("checked"));
    // Call check messages to make new setting effective
    checkMessages();
  });
});
