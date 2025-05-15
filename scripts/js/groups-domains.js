/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, getGroups:false, updateFtlInfo:false, processGroupResult:false, delGroupItems:false, handleTableOrderChange:false */
/* exported initTable */

"use strict";

let table;
let queryParams = {};

document.addEventListener("DOMContentLoaded", () => {
  queryParams = utils.parseQueryString();

  // Tabs: Domain/Regex handling
  // sync description fields, reset inactive inputs on tab change
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    const tabHref = $(this).attr("href");
    let val;
    if (tabHref === "#tab_domain") {
      val = $("#new_regex_comment").val();
      $("#new_domain_comment").val(val);
      $("#new_regex").val("");
    } else if (tabHref === "#tab_regex") {
      val = $("#new_domain_comment").val();
      $("#new_regex_comment").val(val);
      $("#new_domain").val("");
      $("#wildcard_checkbox").prop("checked", false);
    }

    clearTimeout(suggestTimeout);
    $("#suggest_domains").hide();
  });

  $("#add_deny, #add_allow").on("click", addDomain);

  // Domain suggestion handling
  let suggestTimeout;
  $("#new_domain").on("input", event => {
    hideSuggestDomains();
    clearTimeout(suggestTimeout);
    suggestTimeout = setTimeout(showSuggestDomains, 1000, event.target.value);
  });

  utils.setBsSelectDefaults();
  getGroups();
});

// Show a list of suggested domains based on the user's input
function showSuggestDomains(value) {
  const newDomainEl = $("#new_domain");
  const suggestDomainEl = $("#suggest_domains");

  function createButton(hostname) {
    // Purposefully omit 'btn' class to save space on padding
    return $('<button type="button" class="btn-link btn-block text-right">')
      .append($("<em>").text(hostname))
      .on("click", () => {
        hideSuggestDomains();
        newDomainEl.val(hostname);
      });
  }

  try {
    const parts = new URL(value).hostname.split(".");
    const table = $("<table>");

    for (let i = 0; i < parts.length - 1; ++i) {
      const hostname = parts.slice(i).join(".");

      table.append(
        $("<tr>")
          .append($('<td class="text-nowrap text-right">').text(i === 0 ? "Did you mean" : "or"))
          .append($("<td>").append(createButton(hostname)))
      );
    }

    suggestDomainEl.slideUp("fast", () => {
      suggestDomainEl.html(table);
      suggestDomainEl.slideDown("fast");
    });
  } catch (error) {
    const { message } = error;
    const isValidUrlError =
      error instanceof TypeError &&
      (message.includes("Invalid URL") || message.includes("is not a valid URL"));

    if (!isValidUrlError) {
      throw error;
    }
  }
}

function hideSuggestDomains() {
  $("#suggest_domains").slideUp("fast");
}

globalThis.initTable = function () {
  table = $("#domainsTable").DataTable({
    processing: true,
    ajax: {
      url: `${document.body.dataset.apiurl}/domains`,
      dataSrc: "domains",
      type: "GET",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, orderable: false, width: "15px" },
      { data: "domain" },
      { data: null, searchable: false },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "22px", orderable: false },
    ],
    columnDefs: [
      {
        targets: 1,
        className: "select-checkbox",
        render() {
          return "";
        },
      },
      {
        targets: 3,
        render(data) {
          return `${data.kind}_${data.type}`;
        },
      },
      {
        targets: "_all",
        render: $.fn.dataTable.render.text(),
      },
    ],
    drawCallback() {
      // Hide buttons if all domains were deleted
      const hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
      $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

      $('button[id^="deleteDomain_"]').on("click", deleteDomain);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback(row, data) {
      const dataId = `${utils.hexEncode(data.domain)}_${data.type}_${data.kind}`;
      row.dataset.id = dataId;

      const dateAdded = utils.datetime(data.date_added, false);
      const dateModified = utils.datetime(data.date_modified, false);
      // Tooltip for domain
      const tooltip = `Added: ${dateAdded}\nLast modified: ${dateModified}\nDatabase ID: ${data.id}`;

      const domainText = utils.escapeHtml(data.unicode);
      const showOriginal = data.domain !== data.unicode;
      const domainSuffix = showOriginal ? ` (${utils.escapeHtml(data.domain)})` : "";

      const domainHtml = `<code id="domain_${dataId}" title="${tooltip}" class="breakall">${domainText}${domainSuffix}</code>`;

      $("td:eq(1)", row).html(domainHtml);

      // Drop-down type selector
      const currentType = `${data.type}/${data.kind}`;
      const options = [
        {
          value: "allow/exact",
          text: "Exact allow",
          selected: data.type === "allow" && data.kind === "exact",
        },
        {
          value: "allow/regex",
          text: "Regex allow",
          selected: data.type === "allow" && data.kind === "regex",
        },
        {
          value: "deny/exact",
          text: "Exact deny",
          selected: data.type === "deny" && data.kind === "exact",
        },
        {
          value: "deny/regex",
          text: "Regex deny",
          selected: data.type === "deny" && data.kind === "regex",
        },
      ];

      const optionsHtml = options
        .map(
          opt =>
            `<option value="${opt.value}"${opt.selected ? " selected" : ""}>${opt.text}</option>`
        )
        .join("");

      $("td:eq(2)", row).html(`
        <select id="type_${dataId}" class="form-control">${optionsHtml}</select>
        <input type="hidden" id="old_type_${dataId}" value="${currentType}">
      `);
      const typeEl = $(`#type_${dataId}`, row);
      typeEl.on("change", editDomain);

      // Initialize bootstrap-toggle for status field (enabled/disabled)
      $("td:eq(3)", row).html(
        `<input type="checkbox" id="enabled_${dataId}"${data.enabled ? " checked" : ""}>`
      );

      const statusEl = $(`#enabled_${dataId}`, row);
      statusEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px",
      });
      statusEl.on("change", editDomain);

      // Comment field
      $("td:eq(4)", row).html(`<input id="comment_${dataId}" class="form-control">`);
      const commentEl = $(`#comment_${dataId}`, row);
      commentEl.val(data.comment);
      commentEl.on("change", editDomain);

      // Group assignment field (multi-select)
      $("td:eq(5)", row).empty();
      $("td:eq(5)", row).append(
        `<select class="selectpicker" id="multiselect_${dataId}" multiple></select>`
      );
      const selectEl = $(`#multiselect_${dataId}`, row);
      // Add all known groups
      for (const group of groups) {
        const dataSub = group.enabled ? "" : 'data-subtext="(disabled)"';

        selectEl.append($(`<option ${dataSub}/>`).val(group.id).text(group.name));
      }

      // Select assigned groups
      selectEl.val(data.groups);
      // Initialize bootstrap-select
      const applyBtn = `#btn_apply_${dataId}`;
      selectEl
        // fix dropdown if it would stick out right of the viewport
        .on("show.bs.select", () => {
          const winWidth = $(globalThis).width();
          const dropdownEl = $("body > .bootstrap-select.dropdown");
          if (dropdownEl.length === 0) return;

          // Remove align-right class to recalculate
          dropdownEl.removeClass("align-right");
          const width = dropdownEl.width();
          const left = dropdownEl.offset().left;
          if (left + width > winWidth) {
            dropdownEl.addClass("align-right");
          }
        })
        .on("changed.bs.select", () => {
          // enable Apply button if changes were made to the drop-down menu
          // and have it call editDomain() on click
          if ($(applyBtn).prop("disabled")) {
            $(applyBtn)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", () => {
                editDomain.call(selectEl);
              });
          }
        })
        .on("hide.bs.select", function () {
          // Restore values if drop-down menu is closed without clicking the
          // Apply button (e.g. by clicking outside) and re-disable the Apply
          // button
          if (!$(applyBtn).prop("disabled")) {
            $(this).val(data.groups).selectpicker("refresh");
            $(applyBtn).removeClass("btn-success").prop("disabled", true).off("click");
          }
        })
        .selectpicker()
        .siblings(".dropdown-menu")
        .find(".bs-actionsbox")
        .prepend(
          `<button type="button" id=btn_apply_${dataId} class="btn btn-block btn-sm" disabled>Apply</button>`
        );

      // Highlight row (if url parameter "domainid=" is used)
      if (
        Object.hasOwn(queryParams, "domainid") &&
        data.id === Number.parseInt(queryParams.domainid, 10)
      ) {
        $(row).find("td").addClass("highlight");
      }

      // Add delete domain button
      const button =
        `<button type="button" class="btn btn-danger btn-xs" id="deleteDomain_${dataId}" data-id="${dataId}">` +
        '<span class="far fa-trash-alt"></span></button>';
      $("td:eq(6)", row).html(button);
    },
    select: {
      style: "multi",
      selector: "td:first-child",
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
          // Create an array of objects for each ".selected" row's data-id
          const ids = [...document.querySelectorAll("tr.selected")].map(row => row.dataset.id);

          // Delete all selected rows at once
          deleteDomains(ids);
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
    stateSave: true,
    stateDuration: 0,
    stateSaveCallback(settings, data) {
      utils.stateSaveCallback("groups-domains-table", data);
    },
    stateLoadCallback() {
      const data = utils.stateLoadCallback("groups-domains-table");

      // Return null if not available
      if (data === null) return null;

      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    },
    initComplete() {
      if (!Object.hasOwn(queryParams, "domainid")) return;

      const pos = table
        .column(0, { order: "current" })
        .data()
        .indexOf(Number.parseInt(queryParams.domainid, 10));
      if (pos !== -1) {
        const page = Math.floor(pos / table.page.info().length);
        table.page(page).draw(false);
      }
    },
  });

  // Disable autocorrect in the search box
  utils.disableAutocorrect();

  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });

  handleTableOrderChange(table);
};

// Enable "filter by type" functionality, using checkboxes
$.fn.dataTable.ext.search.push((settings, searchData, index, rowData) => {
  const types = $(".filter_types input:checkbox:checked")
    .map(function () {
      return this.value;
    })
    .get();

  return types.includes(`${rowData.type}/${rowData.kind}`);
});

$(".filter_types input:checkbox").on("change", () => {
  table.draw();
});

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteDomain() {
  // Passes the button data-id attribute as ID
  deleteDomains([$(this).attr("data-id")]);
}

function deleteDomains(encodedIds) {
  const decodedIds = encodedIds.map(encodedId => {
    const [item, type, kind] = encodedId.split("_");
    return { item, type, kind };
  });

  delGroupItems("domain", decodedIds, table);
}

function addDomain() {
  const action = this.id;
  const tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
  const wildcardEl = $("#wildcard_checkbox");
  const wildcardChecked = wildcardEl.prop("checked");

  // current tab's inputs
  let kind;
  let domainEl;
  let commentEl;
  let groupEl;
  if (tabHref === "#tab_domain") {
    kind = "exact";
    domainEl = $("#new_domain");
    commentEl = $("#new_domain_comment");
    groupEl = $("#new_domain_group");
  } else if (tabHref === "#tab_regex") {
    kind = "regex";
    domainEl = $("#new_regex");
    commentEl = $("#new_regex_comment");
    groupEl = $("#new_regex_group");
  }

  const comment = commentEl.val();
  // Convert all group IDs to integers
  const group = groupEl.val().map(Number);

  // Check if the user wants to add multiple domains (space or newline separated)
  // If so, split the input and store it in an array
  const domains = domainEl
    .val()
    .split(/\s+/)
    // Remove empty elements
    .filter(el => el !== "");
  const domainStr = JSON.stringify(domains);

  utils.disableAll();
  utils.showAlert({ type: "info", title: "Adding domain(s)...", message: domainStr });

  if (domains.length === 0) {
    utils.enableAll();
    utils.showAlert({
      type: "warning",
      title: "Warning",
      message: "Please specify at least one domain",
    });
    return;
  }

  // Check if the wildcard checkbox was marked and transform the domains into regex
  if (kind === "exact" && wildcardChecked) {
    for (const [index, domain] of domains.entries()) {
      // Strip leading "*." if specified by user in wildcard mode
      if (domain.startsWith("*.")) domains[index] = domain.substr(2);

      // Transform domain into a wildcard regex
      domains[index] = `(\\.|^)${domains[index].replaceAll(".", "\\.")}$`;
    }

    kind = "regex";
  }

  // determine list type
  const type = action === "add_deny" ? "deny" : "allow";

  $.ajax({
    url: `${document.body.dataset.apiurl}/domains/${type}/${kind}`,
    method: "post",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      domain: domains,
      comment,
      type,
      kind,
      groups: group,
    }),
    success(data) {
      utils.enableAll();
      utils.listsAlert("domain", domains, data);
      $("#new_domain").val("");
      $("#new_domain_comment").val("");
      $("#new_regex").val("");
      $("#new_regex_comment").val("");
      table.ajax.reload(null, false);
      table.rows().deselect();

      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error(data, exception) {
      utils.apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: "Error while adding new domain",
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editDomain() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const domain = tr.attr("data-id");
  const newTypestr = tr.find(`#type_${domain}`).val();
  const oldTypeStr = tr.find(`#old_type_${domain}`).val();
  const enabled = tr.find(`#enabled_${domain}`).is(":checked");
  const comment = tr.find(`#comment_${domain}`).val();
  // Convert list of string integers to list of integers using map
  const groups = tr.find(`#multiselect_${domain}`).val().map(Number);

  const [oldType, oldKind] = oldTypeStr.split("/");

  let done = "edited";
  let notDone = "editing";
  switch (elem) {
    case `enabled_${domain}`:
      if (!enabled) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case `name_${domain}`:
      done = "edited name of";
      notDone = "editing name of";
      break;
    case `comment_${domain}`:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case `type_${domain}`:
      done = "edited type of";
      notDone = "editing type of";
      break;
    case `multiselect_${domain}`:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert(`bad element (${elem}) or invalid data-id!`);
      return;
  }

  utils.disableAll();
  const domainDecoded = utils.hexDecode(domain.split("_")[0]);
  utils.showAlert({ type: "info", title: "Editing domain...", message: domainDecoded });
  const url = `${document.body.dataset.apiurl}/domains/${newTypestr}/${encodeURIComponent(domainDecoded)}`;
  $.ajax({
    url,
    method: "put",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({
      groups,
      comment,
      enabled,
      type: oldType,
      kind: oldKind,
    }),
    success(data) {
      utils.enableAll();
      processGroupResult(data, "domain", done, notDone);
      table.ajax.reload(null, false);
    },
    error(data, exception) {
      utils.apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: `Error while ${notDone} domain ${domainDecoded}`,
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
