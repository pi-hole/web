/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Precord see LICENSE file for your rights under this license. */

/* global utils: false, apiFailure:false, setConfigValues: false */

function hostsDomain(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  // We split both on spaces and tabs to support both formats
  // Also, we remove any comments after the name(s)
  const name = data
    .split(/[\t ]+/)
    .slice(1)
    .join(" ")
    .split("#")[0]
    .trim();
  return name;
}

function hostsIP(data) {
  // Split record in format IP NAME1 [NAME2 [NAME3 [NAME...]]]
  // We split both on spaces and tabs to support both formats
  const ip = data.split(/[\t ]+/)[0].trim();
  return ip;
}

function CNAMEdomain(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[0].trim();
}

function CNAMEtarget(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr[1].trim();
}

function CNAMEttl(data) {
  // Split record in format <cname>,<target>[,<TTL>]
  const CNAMEarr = data.split(",");
  return CNAMEarr.length > 2 ? CNAMEarr[2] : "-";
}

function populateDataTable(endpoint) {
  let columns = "";
  if (endpoint === "hosts") {
    columns = [
      { data: null, render: hostsDomain },
      { data: null, type: "ip-address", render: hostsIP },
      { data: null, width: "22px", orderable: false },
    ];
  } else {
    columns = [
      { data: null, render: CNAMEdomain },
      { data: null, render: CNAMEtarget },
      { data: null, width: "40px", render: CNAMEttl },
      { data: null, width: "22px", orderable: false },
    ];
  }

  const setByEnv = false;
  $.ajax({
    url: `/api/config/dns/${endpoint}?detailed=true`,
  }).done(data => {
    // Set the title icons if needed
    setConfigValues("dns", "dns", data.config.dns);

    // disable input fields if set by env var
    if (data.config.dns[endpoint].flags.env_var) {
      $(`.${endpoint}`).prop("disabled", true);
    }
  });

  $(`#${endpoint}-Table`).DataTable({
    ajax: {
      url: `/api/config/dns/${endpoint}`,
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
      $(`button[id^="delete${endpoint}"]`).on("click", deleteRecord);

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data);
      const button = `<button type="button"
                      class="btn btn-danger btn-xs"
                      id="delete${endpoint}${utils.hexEncode(data)}"
                      data-tag="${data}"
                      data-type="${endpoint}"
                      ${setByEnv ? "disabled" : ""}>
                      <span class="far fa-trash-alt"></span>
                    </button>`;
      $(`td:eq(${endpoint === "hosts" ? 2 : 3})`, row).html(button);
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

$(() => {
  populateDataTable("hosts");
  populateDataTable("cnameRecords");
});

function deleteRecord() {
  if ($(this).attr("data-type") === "hosts") delHosts($(this).attr("data-tag"));
  else delCNAME($(this).attr("data-tag"));
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

$(document).ready(() => {
  $("#btnAdd-host").on("click", () => {
    utils.disableAll();
    const elem = $("#Hip").val() + " " + $("#Hdomain").val();
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
        utils.showAlert("error", "", "Error while deleting DNS record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });

  $("#btnAdd-cname").on("click", () => {
    utils.disableAll();
    let elem = $("#Cdomain").val() + "," + $("#Ctarget").val();
    const ttlVal = Number.parseInt($("#Cttl").val(), 10);
    if (isFinite(ttlVal) && ttlVal >= 0) elem += "," + ttlVal;
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
        $("#Cdomain").val("");
        $("#Ctarget").val("");
        $("#cnameRecords-Table").DataTable().ajax.reload(null, false);
      })
      .fail((data, exception) => {
        utils.enableAll();
        apiFailure(data);
        utils.showAlert("error", "", "Error while deleting CNAME record", data.responseText);
        console.log(exception); // eslint-disable-line no-console
      });
  });

  // Add a small legend below the CNAME table
  $("#cnameRecords-Table").after(
    "<small>* <strong>TTL</strong> in seconds <em>(optional)</em></small>"
  );
});
