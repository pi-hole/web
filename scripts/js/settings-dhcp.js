/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false */

"use strict";

let dhcpLeaesTable = null;
const toasts = {};

// DHCP leases tooltips
$(() => {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});

function renderHostnameCLID(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    if (data === "*") {
      return "<em>---</em>";
    }

    return data;
  }

  // Sorting content
  return data;
}

$(() => {
  dhcpLeaesTable = $("#DHCPLeasesTable").DataTable({
    ajax: {
      url: document.body.dataset.apiurl + "/dhcp/leases",
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
        render() {
          return "";
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback() {
      $('button[id^="deleteLease_"]').on("click", deleteLease);
      $('button[id^="copyLease_"]').on("click", copyLease);

      // Hide buttons if all messages were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data.ip);
      const copyButton =
        '<button type="button" class="btn btn-default btn-xs" id="copyLease_"' +
        'data-hwaddr="' +
        data.hwaddr +
        '" data-ip="' +
        data.ip +
        '" data-name="' +
        data.name +
        '" title="Copy as static DHCP lease">' +
        '<span class="far fa-copy"></span></button>';
      const deleteButton =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteLease_' +
        data.ip +
        '" data-del-ip="' +
        data.ip +
        '"><span class="far fa-trash-alt"></span></button>';
      $("td:eq(6)", row).html(copyButton + "&nbsp;" + deleteButton);
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
        action() {
          dhcpLeaesTable.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action() {
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
        action() {
          // For each ".selected" row ...
          $("tr.selected").each(function () {
            // ... delete the row identified by "data-id".
            delLease($(this).attr("data-id"));
          });
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
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("dhcp-leases-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("dhcp-leases-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
  dhcpLeaesTable.on("init select deselect", () => {
    utils.changeTableButtonStates(dhcpLeaesTable);
  });
});

function copyLease() {
  const button = $(this);
  const hwaddr = button.data("hwaddr");
  const ip = button.data("ip");
  const name = button.data("name");

  // Handle cases where name is not available
  const hostname = name === "*" || name === null ? "" : name;

  const textToCopy = `${hwaddr},${ip},${hostname}`;

  navigator.clipboard
    .writeText(textToCopy)
    .then(() => {
      utils.showAlert("success", "far fa-copy", "Copied to clipboard!", textToCopy);
    })
    .catch(error => {
      console.error("Could not copy text:", error); // eslint-disable-line no-console
      utils.showAlert(
        "error",
        "",
        "Failed to copy to clipboard",
        "See browser console for details"
      );
    });
}

function deleteLease() {
  // Passes the button data-del-id attribute as IP
  delLease($(this).attr("data-del-ip"));
}

function delLease(ip) {
  utils.disableAll();
  toasts[ip] = utils.showAlert("info", "", "Deleting lease...", ip, null);

  $.ajax({
    url: document.body.dataset.apiurl + "/dhcp/leases/" + encodeURIComponent(ip),
    method: "DELETE",
  })
    .done(response => {
      utils.enableAll();
      if (response === undefined) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted lease",
          ip,
          toasts[ip]
        );
        dhcpLeaesTable.ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting lease: " + ip,
          response.lease,
          toasts[ip]
        );
      }

      // Clear selection after deletion
      dhcpLeaesTable.rows().deselect();
      utils.changeTableButtonStates(dhcpLeaesTable);
    })
    .fail((jqXHR, exception) => {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting lease: " + ip,
        jqXHR.responseText,
        toasts[ip]
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function fillDHCPhosts(data) {
  $("#dhcp-hosts").val(data.value.join("\n"));
}

function processDHCPConfig() {
  $.ajax({
    url: document.body.dataset.apiurl + "/config/dhcp?detailed=true",
  })
    .done(data => {
      fillDHCPhosts(data.config.dhcp.hosts);
      setConfigValues("dhcp", "dhcp", data.config.dhcp);
    })
    .fail(data => {
      apiFailure(data);
    });
}

$(() => {
  processDHCPConfig();
});
