/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false */

"use strict";

let table = null;
const toasts = {};

// DHCP leases tooltips
document.addEventListener("DOMContentLoaded", () => {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});

function renderHostnameCLID(data, type) {
  // Display and search content
  return type === "display" || type === "filter" ? (data === "*" ? "<em>---</em>" : data) : data;
}

document.addEventListener("DOMContentLoaded", () => {
  table = $("#DHCPLeasesTable").DataTable({
    ajax: {
      url: `${document.body.dataset.apiurl}/dhcp/leases`,
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

      // Hide buttons if all messages were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data.ip);
      const button =
        `<button type="button" class="btn btn-danger btn-xs" id="deleteLease_${data.ip}" data-del-ip="${data.ip}">` +
        '<span class="far fa-trash-alt"></span></button>';
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
        action() {
          table.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action() {
          table.rows({ page: "current" }).select();
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
          const selectedRows = document.querySelectorAll("tr.selected");
          for (const row of selectedRows) {
            // ... delete the row identified by "data-id".
            delLease(row.dataset.id);
          }
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

  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });
});

function deleteLease() {
  // Passes the button data-del-id attribute as IP
  delLease($(this).attr("data-del-ip"));
}

function delLease(ip) {
  utils.disableAll();
  toasts[ip] = utils.showAlert("info", "", "Deleting lease...", ip, null);

  $.ajax({
    url: `${document.body.dataset.apiurl}/dhcp/leases/${encodeURIComponent(ip)}`,
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
        table.ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          `Error while deleting lease: ${ip}`,
          response.lease,
          toasts[ip]
        );
      }

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeTableButtonStates(table);
    })
    .fail((jqXHR, exception) => {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        `Error while deleting lease: ${ip}`,
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
    url: `${document.body.dataset.apiurl}/config/dhcp?detailed=true`,
  })
    .done(data => {
      fillDHCPhosts(data.config.dhcp.hosts);
      setConfigValues("dhcp", "dhcp", data.config.dhcp);
    })
    .fail(data => {
      apiFailure(data);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  processDHCPConfig();
});
