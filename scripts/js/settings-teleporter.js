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

// Upload file to Pi-hole
function importZIP() {
  const file = document.getElementById("file").files[0];
  if (file === undefined) {
    alert("Please select a file to import.");
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

  utils
    .fetchFactory(`${document.body.dataset.apiurl}/teleporter`, {
      method: "POST",
      body: formData,
    })
    .then(data => {
      $("#import-spinner").hide();
      $("#modal-import-success").hide();
      $("#modal-import-error").hide();
      $("#modal-import-info").hide();

      if (Object.hasOwn(data, "error")) {
        $("#modal-import-error").show();
        $("#modal-import-error-title").text(`Error: ${data.error.message}`);
        if (data.error.hint !== null) $("#modal-import-error-message").text(data.error.hint);
      } else if (Object.hasOwn(data, "files")) {
        $("#modal-import-success").show();
        $("#modal-import-success-title").text("Import successful");

        const fileList = data.files.map(file => `<li>${utils.escapeHtml(file)}</li>`);
        const html = `<p>Processed files:</p><ul>${fileList.join("")}</ul>`;

        $("#modal-import-success-message").html(html);
        $("#modal-import-gravity").show();
      }

      $("#modal-import").modal("show");
    })
    .catch(error => {
      alert("An unexpected error occurred.");
      console.error(error); // eslint-disable-line no-console
    });
}

// Inspired by https://stackoverflow.com/a/59576416/2087442
$("#GETTeleporter").on("click", () => {
  $.ajax({
    url: `${document.body.dataset.apiurl}/teleporter`,
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
    method: "GET",
    xhrFields: {
      responseType: "blob",
    },
    success(data, status, xhr) {
      const a = document.createElement("a");
      const url = globalThis.URL.createObjectURL(data);

      a.href = url;
      a.download = xhr.getResponseHeader("Content-Disposition").match(/filename="([^"]*)"/)[1];
      document.body.append(a);
      a.click();
      a.remove();

      globalThis.URL.revokeObjectURL(url);
    },
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // Show warning if not accessed over HTTPS
  if (location.protocol !== "https:") {
    document.getElementById("encryption-warning").classList.remove("d-none");
  }
});
