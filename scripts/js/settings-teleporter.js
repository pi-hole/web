/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

"use strict";

// Add event listener to import button
document.getElementById("submit-import").addEventListener("click", () => {
  importZIP();
});

// First bytes of a password-protected Teleporter archive
const ENCRYPTED_MAGIC = "PIHOLETP";

// Fields hidden away must not reappear revealed with the next password
function concealPasswords(group) {
  const $group = $(group);
  $group.find("input").attr("type", "password");
  $group.find(".field-icon").removeClass("fa-eye-slash").addClass("fa-eye");
}

function showImportPassword(show, message) {
  const $input = $("#import-password");
  if (show) {
    $("#import-password-group").slideDown(150);
    $input.toggleClass("is-invalid", message !== undefined);
    $("#import-password-feedback").text(message ?? "");
    $input.trigger("focus");
  } else {
    $("#import-password-group").slideUp(150);
    $input.val("").removeClass("is-invalid");
    concealPasswords("#import-password-group");
  }
}

// Ask for the password as soon as an encrypted archive is selected
$("#file").on("change", async function () {
  const file = this.files[0];
  if (file === undefined) {
    showImportPassword(false);
    return;
  }

  const head = new Uint8Array(await file.slice(0, ENCRYPTED_MAGIC.length).arrayBuffer());
  showImportPassword(String.fromCodePoint(...head) === ENCRYPTED_MAGIC);
});

$("#import-password").on("input", function () {
  $(this).removeClass("is-invalid");
});

// Upload file to Pi-hole
function importZIP() {
  const file = document.getElementById("file").files[0];
  if (file === undefined) {
    alert("Please select a file to import.");
    return;
  }

  const password = document.getElementById("import-password").value;
  if ($("#import-password-group").is(":visible") && password.length === 0) {
    showImportPassword(true, "Please enter the password of this archive");
    return;
  }

  // Get the selected import options
  const imports = {};
  const gravity = {};
  imports.config = document.getElementById("import.config").checked;
  imports.dhcp_leases = document.getElementById("import.dhcp_leases").checked;
  gravity.group = document.getElementById("import.gravity.group").checked;
  gravity.adlist = document.getElementById("import.gravity.adlist").checked;
  gravity.adlist_by_group = document.getElementById("import.gravity.adlist").checked;
  gravity.domainlist = document.getElementById("import.gravity.domainlist").checked;
  gravity.domainlist_by_group = document.getElementById("import.gravity.domainlist").checked;
  gravity.client = document.getElementById("import.gravity.client").checked;
  gravity.client_by_group = document.getElementById("import.gravity.client").checked;
  imports.gravity = gravity;

  const formData = new FormData();
  formData.append("import", JSON.stringify(imports));
  formData.append("file", file);
  if (password.length > 0) {
    formData.append("password", password);
  }

  fetch(document.body.dataset.apiurl + "/teleporter", {
    method: "POST",
    body: formData,
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
  })
    .then(response => response.json())
    .then(data => {
      $("#import-spinner").hide();
      $("#modal-import-success").hide();
      $("#modal-import-error").hide();
      $("#modal-import-info").hide();

      if ("error" in data && data.error.key === "password_required") {
        showImportPassword(true, "Please enter the password of this archive");
        return;
      }

      if ("error" in data) {
        // A wrong password is shown at the field, no need for the modal
        if (data.error.message === "Unable to decrypt Teleporter archive") {
          showImportPassword(true, data.error.hint);
          return;
        }

        $("#modal-import-error").show();
        $("#modal-import-error-title").text("Error: " + data.error.message);
        if (data.error.hint !== null) {
          $("#modal-import-error-message").text(data.error.hint);
        }
      } else if ("files" in data) {
        $("#modal-import-success").show();
        $("#modal-import-success-title").text("Import successful");
        let text = "<p>Processed files:</p><ul>";
        for (const importedFile of data.files) {
          text += "<li>" + utils.escapeHtml(importedFile) + "</li>";
        }

        text += "</ul>";
        $("#modal-import-success-message").html(text);
        $("#modal-import-gravity").show();
      }

      $("#modal-import").modal("show");
    })
    .catch(error => {
      alert("An unexpected error occurred.");
      console.error(error); // eslint-disable-line no-console
    });
}

$("#export-encrypt").on("change", function () {
  const encrypt = this.checked;
  $("#export-password-group")[encrypt ? "slideDown" : "slideUp"](150);
  $("#export-icon").toggleClass("fa-save", !encrypt).toggleClass("fa-lock", encrypt);
  if (encrypt) {
    $("#export-password").trigger("focus");
  } else {
    $("#export-password, #export-password-repeat").val("").removeClass("is-invalid is-valid");
    concealPasswords("#export-password-group");
  }
});

function exportPasswordsMatch() {
  const password = $("#export-password").val();
  const repeat = $("#export-password-repeat").val();
  const $repeat = $("#export-password-repeat");
  $repeat.toggleClass("is-invalid", repeat.length > 0 && repeat !== password);
  $repeat.toggleClass("is-valid", repeat.length > 0 && repeat === password);
  return password.length > 0 && repeat === password;
}

$("#export-password, #export-password-repeat").on("input", exportPasswordsMatch);

$(".toggle-password").on("click", function () {
  $(".field-icon", this).toggleClass("fa-eye fa-eye-slash");
  const $fields = $($(this).data("target"));
  $fields.attr("type", $fields.attr("type") === "password" ? "text" : "password");
});

// Inspired by https://stackoverflow.com/a/59576416/2087442
$("#GETTeleporter").on("click", () => {
  const encrypt = $("#export-encrypt").is(":checked");
  if (encrypt && !exportPasswordsMatch()) {
    const $empty =
      $("#export-password").val().length === 0 ? "#export-password" : "#export-password-repeat";
    $($empty).addClass("is-invalid").trigger("focus");
    return;
  }

  // Key derivation takes a few seconds on slow hardware
  const $button = $("#GETTeleporter").addClass("disabled");
  const iconClass = $("#export-icon").attr("class");
  $("#export-icon").attr("class", "fa fa-spinner fa-pulse fa-xl");

  $.ajax({
    url: document.body.dataset.apiurl + (encrypt ? "/teleporter/export" : "/teleporter"),
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
    method: encrypt ? "POST" : "GET",
    contentType: encrypt ? "application/json" : undefined,
    data: encrypt ? JSON.stringify({ password: $("#export-password").val() }) : undefined,
    xhrFields: {
      responseType: "blob",
    },
    success(data, status, xhr) {
      const a = document.createElement("a");
      const url = URL.createObjectURL(data);

      a.href = url;
      a.download = xhr
        .getResponseHeader("Content-Disposition")
        .match(/filename="(?<filename>[^"]*)"/u).groups.filename;
      document.body.append(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(url);
    },
    async error(xhr) {
      const text = xhr.response instanceof Blob ? await xhr.response.text() : xhr.responseText;
      utils.showAlert("error", "", "Export failed", text);
    },
    complete() {
      $button.removeClass("disabled");
      $("#export-icon").attr("class", iconClass);
    },
  });
});

$(() => {
  // Show warning if not accessed over HTTPS
  if (location.protocol !== "https:") {
    $("#encryption-warning").show();
  }
});
