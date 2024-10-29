/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

// Add event listener to import button
document.getElementById("submit-import").addEventListener("click", function () {
  importZIP();
});

// Upload file to Pi-hole
function importZIP() {
  var file = document.getElementById("file").files[0];
  if (file === undefined) {
    alert("Please select a file to import.");
    return;
  }

  // https://caniuse.com/fetch - everything except IE
  // This is fine, as we dropped support for IE a while ago
  if (typeof fetch !== "function") {
    alert("Importing Tricorder files is not supported with this browser!");
    return;
  }

  // Get the selected import options
  const imports = {},
    gravity = {};
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
  // eslint-disable-next-line compat/compat
  fetch("/api/teleporter", {
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

      if ("error" in data) {
        $("#modal-import-error").show();
        $("#modal-import-error-title").text("Error: " + data.error.message);
        if (data.error.hint !== null) $("#modal-import-error-message").text(data.error.hint);
      } else if ("files" in data) {
        $("#modal-import-success").show();
        $("#modal-import-success-title").text("Import successful");
        var text = "<p>Processed files:</p><ul>";
        for (var i = 0; i < data.files.length; i++) {
          text += "<li>" + utils.escapeHtml(data.files[i]) + "</li>";
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

// Inspired by https://stackoverflow.com/a/59576416/2087442
$("#GETTeleporter").on("click", function () {
  $.ajax({
    url: "/api/teleporter",
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
    method: "GET",
    xhrFields: {
      responseType: "blob",
    },
    success: function (data, status, xhr) {
      var a = document.createElement("a");
      // eslint-disable-next-line compat/compat
      var url = window.URL.createObjectURL(data);
      a.href = url;
      a.download = xhr.getResponseHeader("Content-Disposition").match(/filename="([^"]*)"/)[1];
      document.body.append(a);
      a.click();
      a.remove();
      // eslint-disable-next-line compat/compat
      window.URL.revokeObjectURL(url);
    },
  });
});
