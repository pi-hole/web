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
$("body").tooltip({ selector: '[data-toggle="tooltip"]', container: "body" });

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
        '<button type="button" class="btn btn-secondary btn-xs copy-to-static"><span class="fa fa-fw fa-copy"></span></button>'
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
  if (/id:|set:|tag:|ignore|lease_time|,\s*,/v.test(line)) return "advanced";

  // Split the line by commas and trim whitespace
  const parts = line.split(",").map(s => s.trim());

  // If there are more than 3 parts or less than 2, it's considered advanced
  if (parts.length > 3 || parts.length < 2) return "advanced";

  // Check if first part is a valid MAC address
  const haveMAC = parts.length > 0 && utils.validateMAC(parts[0]);
  const hwaddr = haveMAC ? parts[0].trim() : "";

  // Check if the first or second part is a valid IPv4 or IPv6 address
  const firstIsValidIP = utils.validateIPv4(parts[0]) || utils.validateIPv6Brackets(parts[0]);
  const secondIsValidIP =
    parts.length > 1 && (utils.validateIPv4(parts[1]) || utils.validateIPv6Brackets(parts[1]));
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
  const row = $(`tr[data-row="${rowIdx}"]`);
  const hwaddr = row.find(".static-hwaddr").text().trim();
  const ipaddr = row.find(".static-ipaddr").text().trim();
  const hostname = row.find(".static-hostname").text().trim();

  // Validate MAC and IP before saving
  const macValid = !hwaddr || utils.validateMAC(hwaddr);
  const ipValid = !ipaddr || utils.validateIPv4(ipaddr) || utils.validateIPv6Brackets(ipaddr);
  const nameValid = !hostname || utils.validateHostnameStrict(hostname);
  if (!macValid || !ipValid || !nameValid) {
    utils.showAlert(
      "error",
      "fa-times",
      "Cannot save: Invalid value found on the table",
      "Please correct the highlighted fields before saving."
    );
    return;
  }

  const lines = $("#dhcp-hosts").val().split(/\r?\n/v);
  // Only update if at least one field is non-empty
  lines[rowIdx] =
    hwaddr || ipaddr || hostname ? [hwaddr, ipaddr, hostname].filter(Boolean).join(",") : "";
  $("#dhcp-hosts").val(lines.join("\n"));

  // Update "data-original-line" to containing the new saved values
  row.attr("data-original-line", lines[rowIdx]);

  // Hide the tooltips and remove Save and Cancel buttons
  $(this).siblings(".cancel-static-row").tooltip("hide").remove();
  $(this).tooltip("hide").remove();
  // then remove highlight colors from all cells on this row
  $("td", row).blur();

  // Check if all rows were already saved (no rows are still being edited)
  if ($("#StaticDHCPTable .save-static-row").length === 0) {
    // Re-enable all table buttons
    $("#StaticDHCPTable button").prop("disabled", false);
    // and re-enable the textarea
    $("#dhcp-hosts").prop("disabled", false);
  }
});

// Cancel button: restores the original line value when editing a row
$(document).on("click", ".cancel-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const row = $(`tr[data-row="${rowIdx}"]`);

  // Get the original values
  const originalLine = row.attr("data-original-line");

  if (originalLine) {
    const values = originalLine.split(",");

    // Reset with original values, ensuring index exists
    row.find(".static-hwaddr").text(values[0] ? values[0].trim() : "");
    row.find(".static-ipaddr").text(values[1] ? values[1].trim() : "");
    row.find(".static-hostname").text(values[2] ? values[2].trim() : "");
  } else {
    // Optional: Handle empty state, e.g., clear fields or set defaults
    row.find(".static-hwaddr, .static-ipaddr, .static-hostname").text("");
  }

  // Trigger "blur" event to remove highlight colors and titles from all cells on this row
  row.find(".static-hwaddr, .static-ipaddr, .static-hostname").blur();

  // Then hide the tooltip and remove Save and Cancel buttons
  $(this).siblings(".save-static-row").tooltip("hide").remove();
  $(this).tooltip("hide").remove();

  // Check if all rows were already saved or canceled (no rows are still being edited)
  if ($("#StaticDHCPTable .save-static-row").length === 0) {
    // Re-enable all table buttons
    $("#StaticDHCPTable button").prop("disabled", false);
    // and re-enable the textarea
    $("#dhcp-hosts").prop("disabled", false);
  }
});

// Delete button for each row removes that line from the textarea and updates the table
$(document).on("click", ".delete-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const lines = $("#dhcp-hosts").val().split(/\r?\n/v);
  lines.splice(rowIdx, 1);
  $("#dhcp-hosts").val(lines.join("\n"));
  // Hide the tooltip
  $(this).tooltip("hide");
  renderStaticDHCPTable();
});

// Add button for each row inserts a new empty line after this row
$(document).on("click", ".add-static-row", function () {
  const rowIdx = Number.parseInt($(this).data("row"), 10);
  const lines = $("#dhcp-hosts").val().split(/\r?\n/v);
  lines.splice(rowIdx + 1, 0, "");
  $("#dhcp-hosts").val(lines.join("\n"));
  // Hide the tooltip
  $(this).tooltip("hide");
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
  $("#StaticDHCPTable .delete-static-row, #StaticDHCPTable .add-static-row").prop("disabled", true);

  // Add save button (a hint asking to click on the button will be shown below the table - CSS pseudo-element)
  if (row.find(".save-static-row").length === 0) {
    const idx = row.attr("data-row");
    const saveBtn = $(
      '<button type="button" class="btn btn-success btn-xs save-static-row"><span class="fa fa-fw fa-check"></span></button>'
    )
      .attr("data-row", idx)
      .attr("title", "Confirm changes to this line")
      .attr("data-toggle", "tooltip");
    const cancelBtn = $(
      '<button type="button" class="btn btn-warning btn-xs cancel-static-row"><span class="fa fa-fw fa-undo"></span></button>'
    )
      .attr("data-row", idx)
      .attr("title", "Cancel changes and restore original values")
      .attr("data-toggle", "tooltip");

    // Add the save button to the actions column
    row.find("td").last().prepend(saveBtn, " ", cancelBtn, " ");

    // Disable the textarea to avoid losing unsaved changes to the table
    $("#dhcp-hosts").prop("disabled", true);
  }
});

// On table redraw, ensure all buttons are enabled and hints are removed
function renderStaticDHCPTable() {
  const tbody = $("#StaticDHCPTable tbody");
  tbody.empty();
  const lines = $("#dhcp-hosts").val().split(/\r?\n/v);
  for (const [idx, line] of lines.entries()) {
    const parsed = parseStaticDHCPLine(line);

    const delBtn = $(
      '<button type="button" class="btn btn-danger btn-xs delete-static-row"><span class="fa fa-fw fa-trash"></span></button>'
    )
      .attr("data-row", idx)
      .attr("title", "Delete this line")
      .attr("data-toggle", "tooltip");

    const addBtn = $(
      '<button type="button" class="btn btn-primary btn-xs add-static-row"><span class="fa fa-fw fa-plus"></span></button>'
    )
      .attr("data-row", idx)
      .attr("title", "Add new line after this")
      .attr("data-toggle", "tooltip");

    // Create the new row - store the original data, in case we need to restore the values
    const tr = $("<tr></tr>").attr("data-row", idx).attr("data-original-line", line);

    if (parsed === "advanced") {
      tr.addClass("table-warning").append(
        `<td colspan="3" class="text-muted"><em>Advanced settings present in line</em> ${idx + 1}</td>`
      );
    } else {
      const cell = '<td contenteditable="true"></td>';
      // Append 3 cells containing parsed values, with placeholder for empty hwaddr
      tr.append($(cell).addClass("static-hwaddr").text(parsed.hwaddr))
        .append($(cell).addClass("static-ipaddr").text(parsed.ipaddr))
        .append($(cell).addClass("static-hostname").text(parsed.hostname));
    }

    // Append a last cell containing the buttons
    tr.append($('<td class="actions"></td>').append(delBtn, " ", addBtn));

    tbody.append(tr);
  }

  tbody.find(".delete-static-row, .add-static-row").prop("disabled", false);
  showLineNumbers();
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
function showLineNumbers() {
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
    ]) {
      linesElem.style[property] = globalThis.getComputedStyle(textarea)[property];
    }

    // Update "--num-lines" variable and let CSS handle the height
    $(".dhcp-hosts-wrapper").css("--num-lines", lines);
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
}

$(document).on("input blur paste", "#StaticDHCPTable td.static-hwaddr", function () {
  const val = $(this).text().trim();
  if (val && !utils.validateMAC(val)) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid MAC address format");
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
  }
});

$(document).on("input blur paste", "#StaticDHCPTable td.static-ipaddr", function () {
  const val = $(this).text().trim();
  if (val && !(utils.validateIPv4(val) || utils.validateIPv6Brackets(val))) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid IP address format");
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
  }
});

$(document).on("input blur paste", "#StaticDHCPTable td.static-hostname", function () {
  const val = $(this).text().trim();
  if (val && !utils.validateHostnameStrict(val)) {
    $(this).addClass("table-danger");
    $(this).attr("title", "Invalid hostname: only letters, digits, hyphens, and dots allowed");
  } else {
    $(this).removeClass("table-danger");
    $(this).attr("title", "");
  }
});
