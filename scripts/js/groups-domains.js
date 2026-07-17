/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false, getGroups:false, updateFtlInfo:false, apiFailure:false, processGroupResult:false, delGroupItems:false */
/* exported initTable */

"use strict";

let table;
let GETDict = {};

$(() => {
  GETDict = utils.parseQueryString();

  // Tabs: Domain/Regex handling
  // sync description fields, reset inactive inputs on tab change
  $('a[data-bs-toggle="tab"]').on("shown.bs.tab", function () {
    const tabHref = $(this).attr("href");
    let value;
    if (tabHref === "#tab_domain") {
      value = $("#new_regex_comment").val();
      $("#new_domain_comment").val(value);
      $("#new_regex").val("");
    } else if (tabHref === "#tab_regex") {
      value = $("#new_domain_comment").val();
      $("#new_regex_comment").val(value);
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

  getGroups();
});

// Show a list of suggested domains based on the user's input
function showSuggestDomains(value) {
  const newDomainElement = $("#new_domain");
  const suggestDomainElement = $("#suggest_domains");

  function createButton(hostname) {
    // Purposefully omit 'btn' class to save space on padding
    return $('<button type="button" class="btn-link btn-block text-right">')
      .append($("<em>").text(hostname))
      .on("click", () => {
        hideSuggestDomains();
        newDomainElement.val(hostname);
      });
  }

  try {
    const parts = new URL(value).hostname.split(".");
    const suggestTable = $("<table>");

    for (let index = 0; index < parts.length - 1; ++index) {
      const hostname = parts.slice(index).join(".");

      suggestTable.append(
        $("<tr>")
          .append(
            $('<td class="text-nowrap text-right">').text(index === 0 ? "Did you mean" : "or")
          )
          .append($("<td>").append(createButton(hostname)))
      );
    }

    suggestDomainElement.slideUp("fast", () => {
      suggestDomainElement.html(suggestTable);
      suggestDomainElement.slideDown("fast");
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

function initTable() {
  table = $("#domainsTable").DataTable({
    processing: true,
    ajax: {
      url: document.body.dataset.apiurl + "/domains",
      dataSrc: "domains",
      type: "GET",
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: null, visible: true, orderable: false, width: "2rem" },
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
          return data.kind + "_" + data.type;
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
    },
    rowCallback(row, data) {
      const dataId = utils.hexEncode(data.domain) + "_" + data.type + "_" + data.kind;
      $(row).attr("data-id", dataId);
      // Tooltip for domain
      const tooltip =
        "Added: " +
        utils.datetime(data.date_added, false) +
        "\nLast modified: " +
        utils.datetime(data.date_modified, false) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(1)", row).html(
        '<code id="domain_' +
          dataId +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          utils.escapeHtml(data.unicode) +
          (data.domain !== data.unicode ? " (" + utils.escapeHtml(data.domain) + ")" : "") +
          "</code>"
      );

      // Drop-down type selector
      $("td:eq(2)", row).html(
        '<select id="type_' +
          dataId +
          '" class="form-control">' +
          '<option value="allow/exact"' +
          (data.type === "allow" && data.kind === "exact" ? " selected" : "") +
          ">Exact allow</option>" +
          '<option value="allow/regex"' +
          (data.type === "allow" && data.kind === "regex" ? " selected" : "") +
          ">Regex allow</option>" +
          '<option value="deny/exact"' +
          (data.type === "deny" && data.kind === "exact" ? " selected " : "") +
          ">Exact deny</option>" +
          '<option value="deny/regex"' +
          (data.type === "deny" && data.kind === "regex" ? " selected" : "") +
          ">Regex deny</option>" +
          "</select>" +
          "<input type='hidden' id='old_type_" +
          dataId +
          "' value='" +
          data.type +
          "/" +
          data.kind +
          "'>"
      );
      const typeElement = $("#type_" + dataId, row);
      typeElement.on("change", editDomain);

      // Initialize bootstrap-toggle for status field (enabled/disabled)
      $("td:eq(3)", row).html(
        '<input type="checkbox" id="enabled_' +
          dataId +
          '"' +
          (data.enabled ? " checked" : "") +
          ">"
      );
      const statusElement = $("#enabled_" + dataId, row);
      statusElement.bootstrapToggle({
        onlabel: "Enabled",
        offlabel: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px",
      });
      statusElement.on("change", editDomain);

      // Comment field
      $("td:eq(4)", row).html('<input id="comment_' + dataId + '" class="form-control">');
      const commentElement = $("#comment_" + dataId, row);
      commentElement.val(data.comment);
      commentElement.on("change", editDomain);

      // Group assignment field (multi-select)
      $("td:eq(5)", row).empty();
      $("td:eq(5)", row).append(
        '<select class="group-select" id="multiselect_' + dataId + '" multiple></select>'
      );
      const selectElement = $("#multiselect_" + dataId, row);
      // Add all known groups
      for (const group of groups) {
        const label = group.enabled ? group.name : group.name + " (disabled)";

        selectElement.append($("<option/>").val(group.id).text(label));
      }

      // Select assigned groups
      selectEl.val(data.groups);
      // Initialize Tom Select
      const applyButton = "#btn_apply_" + dataId;
      const ts = utils.createGroupSelect(selectElement, {
        onChange() {
          // enable Apply button if changes were made to the drop-down menu
          // and have it call editDomain() on click
          if ($(applyButton).prop("disabled")) {
            $(applyButton)
              .addClass("btn-success")
              .prop("disabled", false)
              .on("click", () => {
                editDomain.call(selectElement);
              });
          }
        },
        onDropdownClose() {
          // Restore values if the dropdown is closed without clicking the
          // Apply button (e.g. by clicking outside) and re-disable the Apply
          // button
          if ($(applyButton).prop("disabled")) {
            return;
          }

          ts.setValue(data.groups);
          $(applyButton).removeClass("btn-success").prop("disabled", true).off("click");
        },
      });
      $(ts.dropdown)
        .find(".ts-actions-box")
        .append(
          '<button type="button" id=btn_apply_' +
            dataId +
            ' class="btn btn-sm" disabled>Apply</button>'
        );

      // Highlight row (if url parameter "domainid=" is used)
      if ("domainid" in GETDict && data.id === Math.trunc(GETDict.domainid)) {
        $(row).find("td").addClass("highlight");
      }

      // Add delete domain button
      const button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteDomain_' +
        dataId +
        '" data-id="' +
        dataId +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
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
          // For each ".selected" row ...
          const ids = [];
          $("tr.selected").each(function () {
            // ... add the row identified by "data-id".
            ids.push($(this).attr("data-id"));
          });
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

      // Return if not available
      if (data === null) {
        return null;
      }

      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
    },
    initComplete() {
      if (!("domainid" in GETDict)) {
        return;
      }

      const pos = table
        .column(0, { order: "current" })
        .data()
        .indexOf(Math.trunc(GETDict.domainid));
      if (pos !== -1) {
        const page = Math.floor(pos / table.page.info().length);
        table.page(page).draw(false);
      }
    },
  });
  // Disable autocorrect in the search box
  const input = document.querySelector("input[type=search]");
  if (input !== null) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", false);
  }

  table.on("init select deselect", () => {
    utils.changeTableButtonStates(table);
  });

  table.on("order.dt", () => {
    const order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").removeClass("hidden");
    } else {
      $("#resetButton").addClass("hidden");
    }
  });

  $("#resetButton").on("click", () => {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").addClass("hidden");
  });
}

// Enable "filter by type" functionality, using checkboxes
$.fn.dataTable.ext.search.push((settings, searchData, index, rowData) => {
  const types = $(".filter_types input:checkbox:checked")
    .map(function () {
      return this.value;
    })
    .get();

  const typeString = rowData.type + "/" + rowData.kind;
  return Boolean(types.includes(typeString));
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
  const decodedIds = [];
  for (const [index, encodedId] of encodedIds.entries()) {
    // Decode domain, type, and kind and add to array
    const parts = encodedId.split("_");
    decodedIds[index] = {
      item: parts[0],
      type: parts[1],
      kind: parts[2],
    };
  }

  delGroupItems("domain", decodedIds, table);
}

function addDomain() {
  const action = this.id;
  const tabHref = $('a[data-bs-toggle="tab"].active').attr("href");
  const wildcardElement = $("#wildcard_checkbox");
  const wildcardChecked = wildcardElement.prop("checked");

  // current tab's inputs
  let kind;
  let domainElement;
  let commentElement;
  let groupElement;
  if (tabHref === "#tab_domain") {
    kind = "exact";
    domainElement = $("#new_domain");
    commentElement = $("#new_domain_comment");
    groupElement = $("#new_domain_group");
  } else if (tabHref === "#tab_regex") {
    kind = "regex";
    domainElement = $("#new_regex");
    commentElement = $("#new_regex_comment");
    groupElement = $("#new_regex_group");
  }

  const comment = commentElement.val();
  // Convert all group IDs to integers
  const group = groupElement.val().map(Number);

  // Check if the user wants to add multiple domains (space or newline separated)
  // If so, split the input and store it in an array
  let domains = domainElement.val().split(/\s+/u);
  // Remove empty elements
  domains = domains.filter(element => element !== "");
  const domainString = JSON.stringify(domains);

  utils.disableAll();
  utils.showAlert("info", "", "Adding domain(s)...", domainString);

  if (domains.length === 0) {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify at least one domain");
    return;
  }

  // Check if the wildcard checkbox was marked and transform the domains into regex
  if (kind === "exact" && wildcardChecked) {
    for (const [index, domain] of domains.entries()) {
      // Strip leading "*." if specified by user in wildcard mode
      if (domain.startsWith("*.")) {
        domains[index] = domain.substr(2);
      }

      // Transform domain into a wildcard regex
      domains[index] = "(\\.|^)" + domains[index].replaceAll(".", "\\.") + "$";
    }

    kind = "regex";
  }

  // determine list type
  const type = action === "add_deny" ? "deny" : "allow";

  $.ajax({
    url: document.body.dataset.apiurl + "/domains/" + type + "/" + kind,
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
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new domain", data.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editDomain() {
  const element = $(this).attr("id");
  const tr = $(this).closest("tr");
  const domain = tr.attr("data-id");
  const newTypestr = tr.find("#type_" + domain).val();
  const oldTypeString = tr.find("#old_type_" + domain).val();
  const enabled = tr.find("#enabled_" + domain).is(":checked");
  const comment = tr.find("#comment_" + domain).val();
  // Convert list of string integers to list of integers using map
  const groups = tr
    .find("#multiselect_" + domain)
    .val()
    .map(Number);

  const oldType = oldTypeString.split("/", 1)[0];
  const oldKind = oldTypeString.split("/", 2)[1];

  let done = "edited";
  let notDone = "editing";
  switch (element) {
    case "enabled_" + domain:
      if (!enabled) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "name_" + domain:
      done = "edited name of";
      notDone = "editing name of";
      break;
    case "comment_" + domain:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "type_" + domain:
      done = "edited type of";
      notDone = "editing type of";
      break;
    case "multiselect_" + domain:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element (" + element + ") or invalid data-id!");
      return;
  }

  utils.disableAll();
  const domainDecoded = utils.hexDecode(domain.split("_", 1)[0]);
  utils.showAlert("info", "", "Editing domain...", domainDecoded);
  $.ajax({
    url:
      document.body.dataset.apiurl +
      "/domains/" +
      newTypestr +
      "/" +
      encodeURIComponent(domainDecoded),
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
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + " domain " + domainDecoded,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
