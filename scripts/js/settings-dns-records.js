/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils: false, apiFailure:false, setConfigValues: false */

"use strict";

const disabledByEnv = {
  hosts: false,
  cnameRecords: false,
};

function hostsDomain(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  // We split both on spaces and tabs to support both formats
  // Also, we remove any comments after the name(s)
  const name = data
    .split(/[\t ]+/u)
    .slice(1)
    .join(" ")
    .split("#", 1)[0]
    .trim();
  return name;
}

function hostsIP(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  // We split both on spaces and tabs to support both formats
  const ip = data.split(/[\t ]+/u, 1)[0].trim();
  return ip;
}

function cnameDomain(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[0].trim();
}

function cnameTarget(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[1].trim();
}

function cnameTtl(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr.length > 2 ? CNAMEarr[2] : "-";
}

function cnameTtlRaw(data) {
  const CNAMEarr = data.split(",");
  return CNAMEarr.length > 2 ? CNAMEarr[2].trim() : "";
}

function actionColumnIndex(endpoint) {
  return endpoint === "hosts" ? 2 : 3;
}

function editInputField(id, type, placeholder, value) {
  return (
    '<input id="' +
    id +
    '" type="' +
    type +
    '" class="form-control" placeholder="' +
    placeholder +
    '" value="' +
    value +
    '" autocomplete="off" spellcheck="false" autocapitalize="none" autocorrect="off">'
  );
}

function createIconButton(styleClasses, options) {
  const button = document.createElement("button");
  button.type = "button";
  if (options.id) {
    button.id = options.id;
  }

  button.classList.add("btn", "btn-xs", ...styleClasses);

  if (options.extraClasses) {
    button.classList.add(...options.extraClasses);
  }

  if (options.title) {
    button.title = options.title;
  }

  if (options.disabled) {
    button.disabled = true;
  }

  if (options.dataset) {
    for (const [key, value] of Object.entries(options.dataset)) {
      button.dataset[key] = value;
    }
  }

  const icon = document.createElement("span");
  icon.classList.add(...options.iconClasses);
  button.append(icon);
  return button;
}

function appendEditActionButtons(cell, dataId) {
  const saveButton = createIconButton(["btn-success"], {
    extraClasses: ["btn-save-dns-record"],
    title: "Save",
    iconClasses: ["fa", "fa-check"],
    dataset: { id: dataId },
  });
  const cancelButton = createIconButton(["btn-default"], {
    extraClasses: ["btn-cancel-dns-record"],
    title: "Cancel",
    iconClasses: ["fa", "fa-xmark"],
  });
  cell.append(saveButton, cancelButton);
}

function buildEditRow(endpoint, data) {
  const dataId = utils.hexEncode(data);
  const editTr = document.createElement("tr");
  editTr.classList.add("dns-record-edit-row");

  const appendCell = html => {
    const td = document.createElement("td");
    td.innerHTML = html;
    editTr.append(td);
  };

  if (endpoint === "hosts") {
    appendCell(
      editInputField(
        "edit-host-domain-" + dataId,
        "url",
        "Domain",
        utils.escapeHtml(hostsDomain(data))
      )
    );
    appendCell(
      editInputField(
        "edit-host-ip-" + dataId,
        "text",
        "Associated IP",
        utils.escapeHtml(hostsIP(data))
      )
    );
    const actionCell = document.createElement("td");
    appendEditActionButtons(actionCell, dataId);
    editTr.append(actionCell);
    return $(editTr);
  }

  appendCell(
    editInputField(
      "edit-cname-domain-" + dataId,
      "url",
      "Domain",
      utils.escapeHtml(cnameDomain(data))
    )
  );
  appendCell(
    editInputField(
      "edit-cname-target-" + dataId,
      "url",
      "Target Domain",
      utils.escapeHtml(cnameTarget(data))
    )
  );
  appendCell(
    editInputField("edit-cname-ttl-" + dataId, "number", "", utils.escapeHtml(cnameTtlRaw(data)))
  );
  const actionCell = document.createElement("td");
  appendEditActionButtons(actionCell, dataId);
  editTr.append(actionCell);
  return $(editTr);
}

function closeAllEditRows(endpoint) {
  $(`#${endpoint}-Table tbody tr.dns-record-edit-row`).remove();
  $(`#${endpoint}-Table tbody tr.shown`).removeClass("shown");
}

function closeEditRow(endpoint, dataTr) {
  dataTr.next("tr.dns-record-edit-row").remove();
  dataTr.removeClass("shown");
}

function toggleEditRow(endpoint, button) {
  const dataTr = $(button).closest("tr");
  const table = $(`#${endpoint}-Table`).DataTable();

  if (dataTr.next("tr.dns-record-edit-row").length > 0) {
    closeEditRow(endpoint, dataTr);
    return;
  }

  closeAllEditRows(endpoint);
  buildEditRow(endpoint, table.row(dataTr).data()).insertAfter(dataTr);
  dataTr.addClass("shown");
}

function buildHostsRecord(dataId) {
  return (
    $("#edit-host-ip-" + dataId)
      .val()
      .trim() +
    " " +
    $("#edit-host-domain-" + dataId)
      .val()
      .trim()
  );
}

function buildCnameRecord(dataId) {
  let elem =
    $("#edit-cname-domain-" + dataId)
      .val()
      .trim() +
    "," +
    $("#edit-cname-target-" + dataId)
      .val()
      .trim();
  const ttlInput = $("#edit-cname-ttl-" + dataId).val();
  const ttlVal = ttlInput === "" ? NaN : Math.trunc(ttlInput);
  if (Number.isFinite(ttlVal) && ttlVal >= 0) {
    elem += "," + ttlVal;
  }

  return elem;
}

function updateHostsRecord(oldTag, newTag, dataTr) {
  if (oldTag === newTag) {
    closeEditRow("hosts", dataTr);
    return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Updating DNS record...", newTag);
  const baseUrl = document.body.dataset.apiurl + "/config/dns/hosts/";
  const deleteUrl = baseUrl + encodeURIComponent(oldTag);
  const putUrl = baseUrl + encodeURIComponent(newTag);

  $.ajax({
    url: putUrl,
    method: "PUT",
  })
    .then(() =>
      $.ajax({
        url: deleteUrl,
        method: "DELETE",
      })
    )
    .done(() => {
      utils.enableAll();
      utils.showAlert("success", "fas fa-pencil-alt", "Successfully updated DNS record", newTag);
      $("#hosts-Table").DataTable().ajax.reload(null, false);
    })
    .fail((data, exception) => {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while updating DNS record: <code>" + utils.escapeHtml(oldTag) + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function updateCnameRecord(oldTag, newTag, dataTr) {
  if (oldTag === newTag) {
    closeEditRow("cnameRecords", dataTr);
    return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Updating local CNAME record...", newTag);
  const baseUrl = document.body.dataset.apiurl + "/config/dns/cnameRecords/";
  const deleteUrl = baseUrl + encodeURIComponent(oldTag);
  const putUrl = baseUrl + encodeURIComponent(newTag);

  $.ajax({
    url: putUrl,
    method: "PUT",
  })
    .then(() =>
      $.ajax({
        url: deleteUrl,
        method: "DELETE",
      })
    )
    .done(() => {
      utils.enableAll();
      utils.showAlert(
        "success",
        "fas fa-pencil-alt",
        "Successfully updated local CNAME record",
        newTag
      );
      utils.loadingOverlay(true);
      $("#cnameRecords-Table").DataTable().ajax.reload(null, false);
    })
    .fail((data, exception) => {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while updating CNAME record: <code>" + utils.escapeHtml(oldTag) + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function populateDataTable(endpoint) {
  let columns = "";
  if (endpoint === "hosts") {
    columns = [
      { data: null, render: hostsDomain },
      { data: null, type: "ip-address", render: hostsIP },
      { data: null, width: "70px", orderable: false },
    ];
  } else {
    columns = [
      { data: null, render: cnameDomain },
      { data: null, render: cnameTarget },
      { data: null, width: "40px", render: cnameTtl },
      { data: null, width: "70px", orderable: false },
    ];
  }

  $.ajax({
    url: document.body.dataset.apiurl + "/config/dns/" + endpoint + "?detailed=true",
  }).done(data => {
    // Set the title icons if needed
    setConfigValues("dns", "dns", data.config.dns);

    // disable input fields if set by env var
    if (data.config.dns[endpoint].flags.env_var) {
      disabledByEnv[endpoint] = true;
      $(`.${endpoint}`).prop("disabled", true);
      $(`#${endpoint}-Table`).DataTable().rows().invalidate().draw(false);
    }
  });

  $(`#${endpoint}-Table`).DataTable({
    ajax: {
      url: document.body.dataset.apiurl + "/config/dns/" + endpoint,
      type: "GET",
      dataSrc: `config.dns.${endpoint}`,
    },
    autoWidth: false,
    columns,
    columnDefs: [
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback() {
      closeAllEditRows(endpoint);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data);

      const editButton = createIconButton(["btn-warning"], {
        id: `edit${endpoint}${utils.hexEncode(data)}`,
        title: "Edit record",
        iconClasses: ["fas", "fa-pencil-alt"],
        dataset: { action: "edit", type: endpoint },
        disabled: disabledByEnv[endpoint],
      });
      const deleteButton = createIconButton(["btn-danger"], {
        id: `delete${endpoint}${utils.hexEncode(data)}`,
        title: "Delete record",
        iconClasses: ["far", "fa-trash-alt"],
        dataset: { action: "delete", type: endpoint, tag: data },
        disabled: disabledByEnv[endpoint],
      });

      $(`td:eq(${actionColumnIndex(endpoint)})`, row)
        .empty()
        .append(editButton, deleteButton);
    },
    dom:
      "<'row'<'col-sm-5'l><'col-sm-7'f>>" +
      "<'row'<'col-sm-12'p>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-12'p>>" +
      "<'row'<'col-sm-12'i>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"],
    ],
    language: {
      emptyTable() {
        return endpoint === "hosts"
          ? "No local DNS records defined."
          : "No local CNAME records defined.";
      },
    },
    stateSave: true,
    stateDuration: 0,
    processing: true,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback(`${endpoint}-records-table`, data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback(`${endpoint}-records-table`);
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
}

function deleteRecord() {
  if ($(this).attr("data-type") === "hosts") {
    delHosts($(this).attr("data-tag"));
  } else {
    delCNAME($(this).attr("data-tag"));
  }
}

function delHosts(elem) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting DNS record...", elem);
  const url = document.body.dataset.apiurl + "/config/dns/hosts/" + encodeURIComponent(elem);

  $.ajax({
    url,
    method: "DELETE",
  })
    .done(() => {
      utils.enableAll();
      utils.showAlert("success", "fas fa-trash-alt", "Successfully deleted DNS record", elem);
      $("#hosts-Table").DataTable().ajax.reload(null, false);
    })
    .fail((data, exception) => {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while deleting DNS record: <code>" + elem + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function delCNAME(elem) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting local CNAME record...", elem);
  const url = document.body.dataset.apiurl + "/config/dns/cnameRecords/" + encodeURIComponent(elem);

  $.ajax({
    url,
    method: "DELETE",
  })
    .done(() => {
      utils.enableAll();
      utils.showAlert(
        "success",
        "fas fa-trash-alt",
        "Successfully deleted local CNAME record",
        elem
      );
      // Show loading overlay
      utils.loadingOverlay(true);
      $("#cnameRecords-Table").DataTable().ajax.reload(null, false);
    })
    .fail((data, exception) => {
      utils.enableAll();
      apiFailure(data);
      utils.showAlert(
        "error",
        "",
        "Error while deleting CNAME record: <code>" + elem + "</code>",
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

$(() => {
  populateDataTable("hosts");
  populateDataTable("cnameRecords");

  for (const endpoint of ["hosts", "cnameRecords"]) {
    const tableId = `#${endpoint}-Table`;

    $(`${tableId} tbody`).on("click", "button[data-action='edit']", function (event) {
      event.stopPropagation();
      toggleEditRow(endpoint, this);
    });

    $(`${tableId} tbody`).on("click", "button[data-action='delete']", function (event) {
      event.stopPropagation();
      deleteRecord.call(this);
    });

    $(tableId).on("click", ".btn-cancel-dns-record", function (event) {
      event.stopPropagation();
      const dataTr = $(this).closest("tr.dns-record-edit-row").prev();
      closeEditRow(endpoint, dataTr);
    });

    $(tableId).on("click", ".btn-save-dns-record", function (event) {
      event.stopPropagation();
      const dataId = $(this).attr("data-id");
      const dataTr = $(this).closest("tr.dns-record-edit-row").prev();
      const oldTag = dataTr.attr("data-id");

      if (endpoint === "hosts") {
        updateHostsRecord(oldTag, buildHostsRecord(dataId), dataTr);
      } else {
        updateCnameRecord(oldTag, buildCnameRecord(dataId), dataTr);
      }
    });
  }

  $("#btnAdd-host").on("click", () => {
    utils.disableAll();
    const elem = $("#Hip").val().trim() + " " + $("#Hdomain").val().trim();
    const url = document.body.dataset.apiurl + "/config/dns/hosts/" + encodeURIComponent(elem);
    utils.showAlert("info", "", "Adding DNS record...", elem);
    $.ajax({
      url,
      method: "PUT",
    })
      .done(() => {
        utils.enableAll();
        utils.showAlert("success", "fas fa-plus", "Successfully added DNS record", elem);
        $("#Hdomain").val("");
        $("#Hip").val("");
        $("#hosts-Table").DataTable().ajax.reload(null, false);
      })
      .fail((data, exception) => {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while adding DNS record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });

  $("#btnAdd-cname").on("click", () => {
    utils.disableAll();
    let elem = $("#Cdomain").val().trim() + "," + $("#Ctarget").val().trim();
    const ttlInput = $("#Cttl").val();
    const ttlVal = ttlInput === "" ? NaN : Math.trunc(ttlInput);
    if (Number.isFinite(ttlVal) && ttlVal >= 0) {
      elem += "," + ttlVal;
    }

    const url =
      document.body.dataset.apiurl + "/config/dns/cnameRecords/" + encodeURIComponent(elem);
    utils.showAlert("info", "", "Adding DNS record...", elem);
    $.ajax({
      url,
      method: "PUT",
    })
      .done(() => {
        utils.enableAll();
        utils.showAlert("success", "fas fa-plus", "Successfully added CNAME record", elem);
        // Show loading overlay
        utils.loadingOverlay(true);
        $("#Cdomain").val("");
        $("#Ctarget").val("");
        $("#cnameRecords-Table").DataTable().ajax.reload(null, false);
      })
      .fail((data, exception) => {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while adding CNAME record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });

  // Add a small legend below the CNAME table
  $("#cnameRecords-Table").after(
    "<small>* <strong>TTL</strong> in seconds <em>(optional)</em></small>"
  );
});
