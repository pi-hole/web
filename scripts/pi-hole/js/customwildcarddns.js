/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */
/* author DjoSmer */
/* global utils:false */

$(function () {
  $("#btnAdd").on("click", addCustomWildcardDNS);

  const token = $("#token").text();
  const groupColumn = 0;
  const table = $("#customWildcardDNSTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/customwildcarddns/actions.php",
      data: {action: "get", token: token},
      type: "POST",
    },
    columns: [
      {
        data: 'name',
        visible: false
      },
      {
        data: 'domain'
      },
      {
        data: 'ip'
      },
      {
        data: 'enabled',
        orderable: false, searchable: false,
        render: function (data, type, row) {
          if (type === 'display') {
            const id = `enabled_${row.name}_${row.domain}_checkbox`.replaceAll('.', '')
            const checked = data ? 'checked' : '';
            return `<input type="checkbox" id="${id}" ${checked} class="updateCustomWildcardDNS" data-row="${encodeURIComponent(JSON.stringify(row))}"/>`;
          }
          return data;
        },
      },
      {
        orderable: false, searchable: false,
        render: function (data, type, row) {
          if (type === 'display') {
            return `<button type="button" class="btn btn-danger btn-xs deleteCustomWildcardDNS" data-row="${encodeURIComponent(JSON.stringify(row))}"><span class="far fa-trash-alt"></span></button>`;
          }
          return false;
        },
      }
    ],
    columnDefs: [
      {
        targets: 1,
        orderData: [0, 1]
      },
      {
        targets: 2,
        orderData: [0, 2]
      }
    ],
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    order: [[groupColumn, "asc"]],
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("LocalWildcardDNSTable", data);
    },
    stateLoadCallback: function () {
      return utils.stateLoadCallback("LocalWildcardDNSTable");
    },
    drawCallback: function () {
      const api = this.api();
      const rows = api.rows({page: 'current'}).nodes();
      let last = null;

      api.column(groupColumn, {page: 'current'})
        .data()
        .each(function (group, i) {
          if (last !== group) {
            $(rows)
              .eq(i)
              .before(`<tr class="group"><td colspan="3">${group}</td><td><button type="button" class="btn btn-danger btn-xs deleteGroupCustomWildcardDNS" data-name="${group}"><span class="far fa-trash-alt"></span></button></td></tr>`);

            last = group;
          }
        });

      $(".deleteGroupCustomWildcardDNS").on("click", function () {
        const data = {
          name: $(this).data('name'),
          domain: '*'
        };
        deleteCustomWildcardDNS(data);
      });$(".deleteCustomWildcardDNS").on("click", function () {
        const data = JSON.parse(decodeURIComponent($(this).data('row')));
        deleteCustomWildcardDNS(data);
      });
      $(".updateCustomWildcardDNS").on("change", updateCustomWildcardDNS);
    },
  });

  // Disable autocorrect in the search box
  const input = document.querySelector("input[type=search]");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("autocorrect", "off");
  input.setAttribute("autocapitalize", "off");
  input.setAttribute("spellcheck", false);


  function addCustomWildcardDNS() {
    const domain = utils.escapeHtml($("#domain").val());
    const ip = utils.escapeHtml($("#ip").val());
    const wildcardName = utils.escapeHtml($("#wildcardName").val());

    utils.disableAll();
    utils.showAlert("info", "", "Adding custom Wildcard DNS record...", "");

    $.ajax({
      url: "scripts/pi-hole/php/customwildcarddns/actions.php",
      method: "post",
      dataType: "json",
      data: {action: "add", domain: domain, ip: ip, name: wildcardName, token: token},
      success: function (response) {
        utils.enableAll();
        if (response.success) {
          utils.showAlert(
            "success",
            "far fa-check-circle",
            "Custom WildcardDNS added",
            wildcardName + ": " + domain + " -> " + ip
          );

          // Clean up field values and reload table data
          $("#domain").val("");
          $("#ip").val("");
          $("#wildcardName").val("");
          table.ajax.reload();
          $("#wildcardName").focus();
        } else {
          utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
        }
      },
      error: function () {
        utils.enableAll();
        utils.showAlert("error", "fas fa-times", "Error while adding custom Wildcard DNS record", "");
      },
    });
  }

  function deleteCustomWildcardDNS(data) {
    data.action = 'delete';
    data.token = token;

    utils.disableAll();
    utils.showAlert("info", "", "Deleting custom Wildcard DNS record...", "");

    $.ajax({
      url: "scripts/pi-hole/php/customwildcarddns/actions.php",
      method: "post",
      dataType: "json",
      data: data,
      success: function (response) {
        utils.enableAll();
        if (response.success) {
          utils.showAlert(
            "success",
            "far fa-check-circle",
            "Custom WildcardDNS deleted",
            data.name + ": " + data.domain
          );
          table.ajax.reload();
        } else {
          utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
        }
      },
      error: function (jqXHR, exception) {
        utils.enableAll();
        utils.showAlert("error", "fas fa-times", "Error while deleting custom Wildcard DNS record", "");
        console.log(exception); // eslint-disable-line no-console
      },
    });
  }

  function updateCustomWildcardDNS() {
    const data = JSON.parse(decodeURIComponent($(this).data('row')));
    data.action = 'update';
    data.token = token;
    data.enabled = this.checked;

    utils.disableAll();
    utils.showAlert("info", "", "Updating custom Wildcard DNS record...", "");

    $.ajax({
      url: "scripts/pi-hole/php/customwildcarddns/actions.php",
      method: "post",
      dataType: "json",
      data: data,
      success: function (response) {
        utils.enableAll();
        if (response.success) {
          utils.showAlert(
            "success",
            "far fa-check-circle",
            "Custom WildcardDNS updated",
            data.name + ": " + data.domain + " -> " + data.ip
          );
          table.ajax.reload();
        } else {
          utils.showAlert("error", "fas fa-times", "Failure! Something went wrong", response.message);
        }
      },
      error: function (jqXHR, exception) {
        utils.enableAll();
        utils.showAlert("error", "fas fa-times", "Error while updating custom Wildcard DNS record", "");
        console.log(exception); // eslint-disable-line no-console
      },
    });
  }
});


