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

      // Hide buttons if all messages were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      $(row).attr("data-id", data.ip);
      // Create buttons without data-* attributes in HTML
      const $deleteBtn = $(
        '<button type="button" class="btn btn-danger btn-xs"><span class="far fa-trash-alt"></span></button>'
      )
        .attr("id", "deleteLease_" + data.ip)
        .attr("data-del-ip", data.ip)
        .attr("title", "Delete lease")
        .attr("data-toggle", "tooltip");
      const $copyBtn = $(
        '<button type="button" class="btn btn-secondary btn-xs copy-to-static"><i class="fa fa-fw fa-copy"></i></button>'
      )
        .attr("title", "Copy to static leases")
        .attr("data-toggle", "tooltip")
        .data("hwaddr", data.hwaddr || "")
        .data("ip", data.ip || "")
        .data("hostname", data.name || "");
      $("td:eq(6)", row).empty().append($deleteBtn, " ", $copyBtn);
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
  // Trigger input to update the table
  $("#dhcp-hosts").trigger("input");
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

function parseStaticDHCPLine(line) {
  // Accepts: [hwaddr][,ipaddr][,hostname] (all optional, comma-separated, no advanced tokens)
  // Returns null if advanced/invalid, or {hwaddr, ipaddr, hostname}

  // If the line is empty, return an object with empty fields
  if (!line.trim())
    return {
      hwaddr: "",
      ipaddr: "",
      hostname: "",
    };

  // Advanced if contains id:, set:, tag:, ignore
  if (/id:|set:|tag:|ignore|lease_time|,\s*,/.test(line)) return "advanced";

  // Split the line by commas and trim whitespace
  const parts = line.split(",").map(s => s.trim());

  // If there are more than 3 parts or less than 2, it's considered advanced
  if (parts.length > 3 || parts.length < 2) return "advanced";

  // Check if first part is a valid MAC address
  const haveMAC = parts.length > 0 && utils.validateMAC(parts[0]);
  const hwaddr = haveMAC ? parts[0].trim() : "";

  // Check if the first or second part is a valid IPv4 or IPv6 address
  const hasSquareBrackets0 = parts[0][0] === "[" && parts[0].at(-1) === "]";
  const ipv60 = hasSquareBrackets0 ? parts[0].slice(1, -1) : parts[0];
  const hasSquareBrackets1 = parts.length > 1 && parts[1][0] === "[" && parts[1].at(-1) === "]";
  const ipv61 = hasSquareBrackets1 ? parts[1].slice(1, -1) : parts.length > 1 ? parts[1] : "";
  const firstIsValidIP = utils.validateIPv4(parts[0]) || utils.validateIPv6(ipv60);
  const secondIsValidIP =
    parts.length > 1 && (utils.validateIPv4(parts[1]) || utils.validateIPv6(ipv61));
  const ipaddr = firstIsValidIP ? parts[0].trim() : secondIsValidIP ? parts[1].trim() : "";
  const haveIP = ipaddr.length > 0;

  // Check if the second or third part is a valid hostname
  let hostname = "";
  if (parts.length > 2 && parts[2].length > 0) hostname = parts[2].trim();
  else if (parts.length > 1 && parts[1].length > 0 && (!haveIP || !haveMAC))
    hostname = parts[1].trim();

  return {
    hwaddr,
    ipaddr,
    hostname,
  };
}

// Save button for each row updates only that line in the textarea
$(document).on("click", ".save-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const row = $(this).closest("tr");
  const hwaddr = row.find(".static-hwaddr").text().trim();
  const ipaddr = row.find(".static-ipaddr").text().trim();
  const hostname = row.find(".static-hostname").text().trim();

  // Validate MAC and IP before saving
  const macValid = !hwaddr || utils.validateMAC(hwaddr);
  const ipValid = !ipaddr || utils.validateIPv4(ipaddr) || utils.validateIPv6(ipaddr);
  if (!macValid || !ipValid) {
    utils.showAlert(
      "error",
      "fa-times",
      "Cannot save: Invalid MAC or IP address",
      "Please correct the highlighted fields before saving."
    );
    return;
  }

  const lines = $("#dhcp-hosts").val().split(/\r?\n/);
  // Only update if at least one field is non-empty
  lines[rowIdx] =
    hwaddr || ipaddr || hostname ? [hwaddr, ipaddr, hostname].filter(Boolean).join(",") : "";
  $("#dhcp-hosts").val(lines.join("\n"));
  // Optionally, re-render the table to reflect changes
  renderStaticDHCPTable();
});

// Delete button for each row removes that line from the textarea and updates the table
$(document).on("click", ".delete-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const lines = $("#dhcp-hosts").val().split(/\r?\n/);
  lines.splice(rowIdx, 1);
  $("#dhcp-hosts").val(lines.join("\n"));
  renderStaticDHCPTable();
});

// Add button for each row inserts a new empty line after this row
$(document).on("click", ".add-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const lines = $("#dhcp-hosts").val().split(/\r?\n/);
  lines.splice(rowIdx + 1, 0, "");
  $("#dhcp-hosts").val(lines.join("\n"));
  renderStaticDHCPTable();
  // Focus the new row after render
  setTimeout(() => {
    $("#StaticDHCPTable tbody tr")
      .eq(rowIdx + 1)
      .find("td:first")
      .focus();
  }, 10);
});

// Update table on load and whenever textarea changes
$(() => {
  processDHCPConfig();
  renderStaticDHCPTable();
  $("#dhcp-hosts").on("input", renderStaticDHCPTable);
});

// When editing a cell, disable all action buttons except the save button in the current row
$(document).on("focus input", "#StaticDHCPTable td[contenteditable]", function () {
  const row = $(this).closest("tr");
  // Disable all action buttons in all rows
  $(
    "#StaticDHCPTable .save-static-row, #StaticDHCPTable .delete-static-row, #StaticDHCPTable .add-static-row"
  ).prop("disabled", true);
  // Enable only the save button in the current row
  row.find(".save-static-row").prop("disabled", false);
  // Show a hint below the current row if not already present
  if (!row.next().hasClass("edit-hint-row")) {
    row.next(".edit-hint-row").remove(); // Remove any existing hint
    row.after(
      '<tr class="edit-hint-row"><td colspan="4" class="text-info" style="font-style:italic;">Please save this line before editing another or leaving the page, otherwise your changes will be lost.</td></tr>'
    );
  }
});
// On save, re-enable all buttons and remove the hint
$(document).on("click", ".save-static-row", function () {
  $(
    "#StaticDHCPTable .save-static-row, #StaticDHCPTable .delete-static-row, #StaticDHCPTable .add-static-row"
  ).prop("disabled", false);
  $(".edit-hint-row").remove();
});
// On table redraw, ensure all buttons are enabled and hints are removed
function renderStaticDHCPTable() {
  const tbody = $("#StaticDHCPTable tbody");
  tbody.empty();
  const lines = $("#dhcp-hosts").val().split(/\r?\n/);
  for (const [idx, line] of lines.entries()) {
    const parsed = parseStaticDHCPLine(line);
    if (parsed === "advanced") {
      const tr = $(
        '<tr class="table-warning"><td colspan="4" style="font-style:italic;color:#888;">Advanced settings present in line ' +
          (idx + 1) +
          "</td></tr>"
      );
      tr.data("original-line", line);
      tbody.append(tr);
      continue;
    }

    const tr = $("<tr>")
      .append($('<td contenteditable="true" class="static-hwaddr"></td>'))
      .append($('<td contenteditable="true" class="static-ipaddr"></td>'))
      .append($('<td contenteditable="true" class="static-hostname"></td>'))
      .append(
        $("<td></td>")
          .append(
            $(
              '<button type="button" class="btn btn-success btn-xs save-static-row"><i class="fa fa-fw fa-floppy-disk"></i></button>'
            )
              .attr("data-row", idx)
              .attr("title", "Save changes to this line")
              .attr("data-toggle", "tooltip")
          )
          .append(" ")
          .append(
            $(
              '<button type="button" class="btn btn-danger btn-xs delete-static-row"><i class="fa fa-fw fa-trash"></i></button>'
            )
              .attr("data-row", idx)
              .attr("title", "Delete this line")
              .attr("data-toggle", "tooltip")
          )
          .append(" ")
          .append(
            $(
              '<button type="button" class="btn btn-primary btn-xs add-static-row"><i class="fa fa-fw fa-plus"></i></button>'
            )
              .attr("data-row", idx)
              .attr("title", "Add new line after this")
              .attr("data-toggle", "tooltip")
          )
      );
    // Set cell values, with placeholder for empty hwaddr
    tr.find(".static-hwaddr").text(parsed.hwaddr);
    tr.find(".static-ipaddr").text(parsed.ipaddr);
    tr.find(".static-hostname").text(parsed.hostname);
    tbody.append(tr);
  }

  tbody.find(".save-static-row, .delete-static-row, .add-static-row").prop("disabled", false);
  tbody.find(".edit-hint-row").remove();
}

// Copy button for each lease row copies the lease as a new static lease line
$(document).on("click", ".copy-to-static", function () {
  const hwaddr = $(this).data("hwaddr") || "";
  const ip = $(this).data("ip") || "";
  const hostname = $(this).data("hostname") || "";
  const line = [hwaddr, ip, hostname].filter(Boolean).join(",");
  const textarea = $("#dhcp-hosts");
  const val = textarea.val();
  textarea.val(val ? val + "\n" + line : line).trigger("input");
});

// Add line numbers to the textarea for static DHCP hosts
document.addEventListener("DOMContentLoaded", function () {
  const textarea = document.getElementById("dhcp-hosts");
  const linesElem = document.getElementById("dhcp-hosts-lines");
  let lastLineCount = 0;

  function updateLineNumbers(force) {
    if (!textarea || !linesElem) return;
    const lines = textarea.value.split("\n").length || 1;
    if (!force && lines === lastLineCount) return;
    lastLineCount = lines;
    let html = "";
    for (let i = 1; i <= lines; i++) html += i + "<br>";
    linesElem.innerHTML = html;
    // Apply the same styles to the lines element as the textarea
    for (const property of [
      "fontFamily",
      "fontSize",
      "fontWeight",
      "letterSpacing",
      "lineHeight",
      "padding",
      "height",
    ]) {
      linesElem.style[property] = globalThis.getComputedStyle(textarea)[property];
    }

    // Match height and scroll
    linesElem.style.height = textarea.offsetHeight > 0 ? textarea.offsetHeight + "px" : "auto";
  }

  function syncScroll() {
    linesElem.scrollTop = textarea.scrollTop;
  }

  if (textarea && linesElem) {
    textarea.addEventListener("input", function () {
      updateLineNumbers(false);
    });
    textarea.addEventListener("scroll", syncScroll);
    window.addEventListener("resize", function () {
      updateLineNumbers(true);
    });
    updateLineNumbers(true);
    syncScroll();
  }
});

$(document).on("input blur paste", "#StaticDHCPTable td.static-hwaddr", function () {
  const val = $(this).text().trim();
  if (val && !utils.validateMAC(val)) {
    $(this).addClass("table-danger");
    $(this).removeClass("table-success");
    $(this).attr("title", "Invalid MAC address format");
  } else {
    $(this).addClass("table-success");
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
  }
});

$(document).on("input blur paste", "#StaticDHCPTable td.static-ipaddr", function () {
  const val = $(this).text().trim();
  if (val && !(utils.validateIPv4(val) || utils.validateIPv6(val))) {
    $(this).addClass("table-danger");
    $(this).removeClass("table-success");
    $(this).attr("title", "Invalid IP address format");
  } else {
    $(this).addClass("table-success");
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
  }
});
