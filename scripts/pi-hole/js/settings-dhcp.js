/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false */

var dhcpLeaesTable = null;

// DHCP leases tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});

function renderHostnameCLID(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    if (data === "*") {
      return "<i>---</i>";
    }

    return data;
  }

  // Sorting content
  return data;
}

$(function () {
  dhcpLeaesTable = $("#DHCPLeasesTable").DataTable({
    ajax: {
      url: "/api/dhcp/leases",
      type: "GET",
      dataSrc: "leases",
    },
    order: [[1, "asc"]],
    columns: [
      { data: null, width: "22px" },
      { data: "ip", type: "ip-address" },
      { data: "name", render: renderHostnameCLID },
      { data: "hwaddr" },
      { data: "expires", render: utils.renderTimespan },
      { data: "clientid", render: renderHostnameCLID },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 0,
        orderable: false,
        className: "select-checkbox",
        render: function () {
          return "";
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback: function () {
      $('button[id^="deleteLease_"]').on("click", deleteLeases);

      // Hide buttons if all messages were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.ip);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteLease_' +
        data.ip +
        '" data-del-ip="' +
        data.ip +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(6)", row).html(button);
    },
    select: {
      style: "multi",
      selector: "td:not(:last-child)",
      info: false,
    },
    buttons: [
      {
        text: '<span class="far fa-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectAll",
        action: function () {
          dhcpLeaesTable.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action: function () {
          dhcpLeaesTable.rows({ page: "current" }).select();
        },
      },
      {
        extend: "selectNone",
        text: '<span class="far fa-check-square"></span>',
        titleAttr: "Deselect All",
        className: "btn-sm datatable-bt removeAll",
      },
      {
        text: '<span class="far fa-trash-alt"></span>',
        titleAttr: "Delete Selected",
        className: "btn-sm datatable-bt deleteSelected",
        action: function () {
          // For each ".selected" row ...
          var ids = [];
          $("tr.selected").each(function () {
            // ... add the row identified by "data-id".
            ids.push($(this).attr("data-id"));
          });
          // Delete all selected rows at once
          deleteLeases(ids);
        },
      },
    ],
    dom:
      "<'row'<'col-sm-6'l><'col-sm-6'f>>" +
      "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-3'B><'col-sm-9'p>>" +
      "<'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable: "No DHCP leases found.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("dhcp-leases-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("dhcp-leases-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
  dhcpLeaesTable.on("init select deselect", function () {
    utils.changeTableButtonStates(dhcpLeaesTable);
  });
});

function deleteLeases(ips) {
  // If ips is not an array, it's a click event
  if (!Array.isArray(ips)) {
    ips = [$(this).attr("data-del-ip")];
  }

  // Loop through all IPs to be deleted
  for (var ip in ips) {
    if (Object.hasOwnProperty.call(ips, ip)) {
      delLease(ips[ip]);
    }
  }
}

function delLease(ip) {
  utils.disableAll();
  const toast = utils.showAlert("info", "", "Deleting lease...", ip, null);

  $.ajax({
    url: "/api/dhcp/leases/" + ip,
    method: "DELETE",
  })
    .done(function (response) {
      utils.enableAll();
      if (response === undefined) {
        utils.showAlert("success", "far fa-trash-alt", "Successfully deleted lease", ip, toast);
        dhcpLeaesTable.ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while deleting lease: " + ip, response.lease, toast);
      }

      // Clear selection after deletion
      dhcpLeaesTable.rows().deselect();
      utils.changeTableButtonStates(dhcpLeaesTable);
    })
    .fail(function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting lease: " + ip, jqXHR.responseText, toast);
      console.log(exception); // eslint-disable-line no-console
    });
}

function fillDHCPhosts(data) {
  $("#dhcp-hosts").val(data.value.join("\n"));
}

function processDHCPConfig() {
  $.ajax({
    url: "/api/config/dhcp?detailed=true",
  })
    .done(function (data) {
      fillDHCPhosts(data.config.dhcp.hosts);
      setConfigValues("dhcp", "dhcp", data.config.dhcp);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$(document).ready(function () {
  processDHCPConfig();
});
