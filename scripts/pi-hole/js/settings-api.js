/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues: false, apiFailure: false, QRious: false */

var apiSessionsTable = null;
var ownSessionID = null;
var TOTPdata = null;

function renderBool(data, type) {
  // Display and search content
  if (type === "display" || type === "filter") {
    var icon = "fa-xmark";
    if (data === true) {
      icon = "fa-check";
    }

    return '<i class="fa-solid ' + icon + '"></i>';
  }

  // Sorting content
  return data;
}

$(function () {
  apiSessionsTable = $("#APISessionsTable").DataTable({
    ajax: {
      url: "/api/auth/sessions",
      type: "GET",
      dataSrc: "sessions",
    },
    order: [[1, "asc"]],
    columns: [
      { data: null, width: "22px" },
      { data: "id" },
      { data: "valid", render: renderBool },
      { data: null },
      { data: "login_at", render: utils.renderTimestamp },
      { data: "valid_until", render: utils.renderTimestamp },
      { data: "remote_addr", type: "ip-address" },
      { data: "user_agent" },
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
      $('button[id^="deleteSession_"]').on("click", deleteSession);

      // Hide buttons if all messages were deleted
      var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.ip);
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteSession_' +
        data.id +
        '" data-del-id="' +
        data.id +
        '" title="Delete ' +
        (data.current_session
          ? "your current session\nWARNING: This will require you to re-login"
          : "this session") +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(8)", row).html(button);
      if (data.current_session) {
        ownSessionID = data.id;
        $("td:eq(6)", row).html(
          '<strong title="This is the session you are currently using for the web interface">' +
            data.remote_addr +
            "</strong>"
        );
        let icon = "";
        let title = "";
        if (data.tls.mixed) {
          title = "Session is PARTIALLY end-to-end encrypted";
          icon = "fa-triangle-exclamation";
        } else if (data.tls.login) {
          title = "Session is end-to-end encrypted (TLS/SSL)";
          icon = "fa-check";
        } else {
          title = "Session is NOT end-to-end encrypted (TLS/SSL)";
          icon = "fa-xmark";
        }

        $("td:eq(3)", row).html('<i class="fa-solid ' + icon + '" title="' + title + '"></i>');
      }
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
          apiSessionsTable.rows({ page: "current" }).select();
        },
      },
      {
        text: '<span class="far fa-plus-square"></span>',
        titleAttr: "Select All",
        className: "btn-sm datatable-bt selectMore",
        action: function () {
          apiSessionsTable.rows({ page: "current" }).select();
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
            ids.push(parseInt($(this).attr("data-id"), 10));
          });
          // Delete all selected rows at once
          delSession(ids);
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
      emptyTable: "No active sessions found.",
    },
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback: function (settings, data) {
      utils.stateSaveCallback("api-sessions-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("api-sessions-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      // Apply loaded state to table
      return data;
    },
  });
  apiSessionsTable.on("init select deselect", function () {
    utils.changeTableButtonStates(apiSessionsTable);
  });
});

function deleteSession() {
  // Passes the button data-del-id attribute as ID
  var ids = [$(this).attr("data-del-id")];
  delSessions(ids);
}

function delSessions(ids) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  // Exploit prevention: Return early for non-numeric IDs
  for (const id of ids) {
    if (Object.hasOwnProperty.call(ids, id) && isNaN(ids[id])) return;
  }

  // Convert all ids to integers
  ids = ids.map(function (value) {
    return parseInt(value, 10);
  });

  // Check if own session is selected
  let ownSessionDelete = false;
  if (ids.includes(ownSessionID)) {
    ownSessionDelete = true;
    // Strip own session ID from array
    ids = ids.filter(function (value) {
      return value !== ownSessionID;
    });
  }

  // Loop through IDs and delete them
  for (const id of ids) {
    if (Object.hasOwnProperty.call(ids, id)) {
      delSession(ids[id]);
    }
  }

  // Delete own session last (if selected)
  if (ownSessionDelete) {
    delSession(ownSessionID);
  }
}

function delSession(id) {
  $.ajax({
    url: "/api/auth/session/" + id,
    method: "DELETE",
  })
    .done(function () {
      if (id !== ownSessionID) {
        // Reload table to remove session
        apiSessionsTable.ajax.reload();
      } else {
        // Reload page to clear session
        location.reload();
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function processWebServerConfig() {
  $.ajax({
    url: "/api/config/webserver?detailed=true",
  })
    .done(function (data) {
      setConfigValues("webserver", "webserver", data.config.webserver);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$("#modal-totp").on("shown.bs.modal", function () {
  $.ajax({
    url: "/api/auth/totp",
  })
    .done(function (data) {
      TOTPdata = data.totp;
      $("#totp_secret").text(data.totp.secret);
      var qrlink =
        "otpauth://totp/" +
        data.totp.issuer +
        ":" +
        data.totp.account +
        "?secret=" +
        data.totp.secret +
        "&issuer=" +
        data.totp.issuer +
        "&algorithm=" +
        data.totp.algorithm +
        "&digits=" +
        data.totp.digits +
        "&period=" +
        data.totp.period;
      /* eslint-disable-next-line no-new */
      new QRious({
        element: document.getElementById("qrcode"),
        value: qrlink,
        level: "Q",
        size: 300,
      });
      $("#qrcode-spinner").hide();
      $("#qrcode").show();
    })
    .fail(function (data) {
      apiFailure(data);
    });
});

// Trigger keyup event when pasting into the TOTP code input field
$("#totp_code").on("paste", function (e) {
  $(e.target).keyup();
});

$("#totp_code").on("keyup", function () {
  var code = parseInt($(this).val(), 10);
  if (TOTPdata.codes.includes(code)) {
    $("#totp_div").removeClass("has-error");
    $("#totp_div").addClass("has-success");
    $("#totp_code").prop("disabled", true);
    $("#totp_submit").prop("disabled", false);
    $("#totp_submit").removeClass("btn-default");
    $("#totp_submit").addClass("btn-success");
  }
});

function setTOTPSecret(secret) {
  $.ajax({
    url: "/api/config",
    type: "PATCH",
    data: JSON.stringify({ config: { webserver: { api: { totp_secret: secret } } } }),
    contentType: "application/json",
  })
    .done(function () {
      $("#button-enable-totp").addClass("hidden");
      $("#button-disable-totp").removeClass("hidden");
      $("#totp_code").val("");
      $("#modal-totp").modal("hide");
      var verb = secret.length > 0 ? "enabled" : "disabled";
      alert(
        "Two-factor authentication has been " +
          verb +
          ", you will need to re-login to continue using the web interface."
      );
      location.reload();
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

$("#totp_submit").on("click", function () {
  // Enable TOTP
  setTOTPSecret(TOTPdata.secret);
});

$("#button-disable-totp").confirm({
  text: "Are you sure you want to disable 2FA authentication on your Pi-hole?",
  title: "Confirmation required",
  confirm: function () {
    // Disable TOTP
    setTOTPSecret("");
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, disable 2FA",
  cancelButton: "No, keep 2FA enabled",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});

$(document).ready(function () {
  processWebServerConfig();
  // Check if TOTP is enabled
  $.ajax({
    url: "/api/auth",
  }).done(function (data) {
    if (data.session.totp === false) $("#button-enable-totp").removeClass("hidden");
    else $("#button-disable-totp").removeClass("hidden");
  });
});
