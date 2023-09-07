/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, groups:false,, getGroups:false, updateFtlInfo:false, apiFailure:false */

var table;
var GETDict = {};

$(function () {
  GETDict = utils.parseQueryString();

  // sync description fields, reset inactive inputs on tab change
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    var tabHref = $(this).attr("href");
    var val;
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

  var suggestTimeout;
  $("#new_domain").on("input", function (e) {
    hideSuggestDomains();
    clearTimeout(suggestTimeout);
    suggestTimeout = setTimeout(showSuggestDomains, 1000, e.target.value);
  });

  utils.setBsSelectDefaults();
  initTable();
});

function showSuggestDomains(value) {
  function createButton(hostname) {
    // Purposefully omit 'btn' class to save space on padding
    return $('<button type="button" class="btn-link btn-block text-right">')
      .append($("<i>").text(hostname))
      .on("click", function () {
        hideSuggestDomains();
        newDomainEl.val(hostname);
      });
  }

  var newDomainEl = $("#new_domain");
  var suggestDomainEl = $("#suggest_domains");

  try {
    // URL is not supported in all browsers, but we are in a try-block so we can ignore it
    // eslint-disable-next-line compat/compat
    var parts = new URL(value).hostname.split(".");
    var table = $("<table>");

    for (var i = 0; i < parts.length - 1; ++i) {
      var hostname = parts.slice(i).join(".");

      table.append(
        $("<tr>")
          .append($('<td class="text-nowrap text-right">').text(i === 0 ? "Did you mean" : "or"))
          .append($("<td>").append(createButton(hostname)))
      );
    }

    suggestDomainEl.slideUp("fast", function () {
      suggestDomainEl.html(table);
      suggestDomainEl.slideDown("fast");
    });
  } catch {
    hideSuggestDomains();
  }
}

function hideSuggestDomains() {
  $("#suggest_domains").slideUp("fast");
}

function initTable() {
  table = $("#domainsTable")
    .on("preXhr.dt", function () {
      getGroups();
    })
    .DataTable({
      processing: true,
      ajax: {
        url: "/api/domains",
        dataSrc: "domains",
        type: "GET",
      },
      order: [[0, "asc"]],
      columns: [
        { data: "id", visible: false },
        { data: null, visible: true, orderable: false, width: "15px" },
        { data: "domain" },
        { data: "type", searchable: false },
        { data: "enabled", searchable: false },
        { data: "comment" },
        { data: "groups", searchable: false },
        { data: null, width: "22px", orderable: false },
      ],
      columnDefs: [
        {
          targets: 1,
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
        // Hide buttons if all domains were deleted
        var hasRows = this.api().rows({ filter: "applied" }).data().length > 0;
        $(".datatable-bt").css("visibility", hasRows ? "visible" : "hidden");

        $('button[id^="deleteDomain_"]').on("click", deleteDomain);
        // Remove visible dropdown to prevent orphaning
        $("body > .bootstrap-select.dropdown").remove();
      },
      rowCallback: function (row, data) {
        var dataId = utils.hexEncode(data.domain);
        $(row).attr("data-id", dataId);
        var tooltip =
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
            data.domain +
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
        var typeEl = $("#type_" + dataId, row);
        typeEl.on("change", editDomain);

        $("td:eq(3)", row).html(
          '<input type="checkbox" id="enabled_' +
            dataId +
            '"' +
            (data.enabled ? " checked" : "") +
            ">"
        );
        var statusEl = $("#enabled_" + dataId, row);
        statusEl.bootstrapToggle({
          on: "Enabled",
          off: "Disabled",
          size: "small",
          onstyle: "success",
          width: "80px",
        });
        statusEl.on("change", editDomain);

        $("td:eq(4)", row).html('<input id="comment_' + dataId + '" class="form-control">');
        var commentEl = $("#comment_" + dataId, row);
        commentEl.val(utils.unescapeHtml(data.comment));
        commentEl.on("change", editDomain);

        // Group assignment field
        $("td:eq(5)", row).empty();
        $("td:eq(5)", row).append(
          '<select class="selectpicker" id="multiselect_' + dataId + '" multiple></select>'
        );
        var selectEl = $("#multiselect_" + dataId, row);
        // Add all known groups
        for (var i = 0; i < groups.length; i++) {
          var dataSub = "";
          if (!groups[i].enabled) {
            dataSub = 'data-subtext="(disabled)"';
          }

          selectEl.append(
            $("<option " + dataSub + "/>")
              .val(groups[i].id)
              .text(groups[i].name)
          );
        }

        // Select assigned groups
        selectEl.val(data.groups);
        // Initialize bootstrap-select
        selectEl
          // fix dropdown if it would stick out right of the viewport
          .on("show.bs.select", function () {
            var winWidth = $(window).width();
            var dropdownEl = $("body > .bootstrap-select.dropdown");
            if (dropdownEl.length > 0) {
              dropdownEl.removeClass("align-right");
              var width = dropdownEl.width();
              var left = dropdownEl.offset().left;
              if (left + width > winWidth) {
                dropdownEl.addClass("align-right");
              }
            }
          })
          .on("changed.bs.select", function () {
            // enable Apply button
            if ($(applyBtn).prop("disabled")) {
              $(applyBtn)
                .addClass("btn-success")
                .prop("disabled", false)
                .on("click", function () {
                  editDomain.call(selectEl);
                });
            }
          })
          .on("hide.bs.select", function () {
            // Restore values if drop-down menu is closed without clicking the Apply button
            if (!$(applyBtn).prop("disabled")) {
              $(this).val(data.groups).selectpicker("refresh");
              $(applyBtn).removeClass("btn-success").prop("disabled", true).off("click");
            }
          })
          .selectpicker()
          .siblings(".dropdown-menu")
          .find(".bs-actionsbox")
          .prepend(
            '<button type="button" id=btn_apply_' +
              dataId +
              ' class="btn btn-block btn-sm" disabled>Apply</button>'
          );

        var applyBtn = "#btn_apply_" + dataId;

        // Highlight row (if url parameter "domainid=" is used)
        if ("domainid" in GETDict && data.id === parseInt(GETDict.domainid, 10)) {
          $(row).find("td").addClass("highlight");
        }

        // Add delete domain button
        var button =
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
        selector: "td:not(:last-child)",
        info: false,
      },
      buttons: [
        {
          text: '<span class="far fa-square"></span>',
          titleAttr: "Select All",
          className: "btn-sm datatable-bt selectAll",
          action: function () {
            table.rows({ page: "current" }).select();
          },
        },
        {
          text: '<span class="far fa-plus-square"></span>',
          titleAttr: "Select All",
          className: "btn-sm datatable-bt selectMore",
          action: function () {
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
          action: function () {
            // For each ".selected" row ...
            var ids = [];
            $("tr.selected").each(function () {
              // ... add the row identified by "data-id".
              ids.push($(this).attr("data-id"));
            });
            // Delete all selected rows at once
            delItems(ids);
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
      stateSaveCallback: function (settings, data) {
        utils.stateSaveCallback("groups-domains-table", data);
      },
      stateLoadCallback: function () {
        var data = utils.stateLoadCallback("groups-domains-table");

        // Return if not available
        if (data === null) {
          return null;
        }

        // Reset visibility of ID column
        data.columns[0].visible = false;
        // Apply loaded state to table
        return data;
      },
      initComplete: function () {
        if ("domainid" in GETDict) {
          var pos = table
            .column(0, { order: "current" })
            .data()
            .indexOf(parseInt(GETDict.domainid, 10));
          if (pos >= 0) {
            var page = Math.floor(pos / table.page.info().length);
            table.page(page).draw(false);
          }
        }
      },
    });
  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  if (input !== null) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", false);
  }

  table.on("init select deselect", function () {
    utils.changeBulkDeleteStates(table);
  });

  table.on("order.dt", function () {
    var order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").removeClass("hidden");
    } else {
      $("#resetButton").addClass("hidden");
    }
  });

  $("#resetButton").on("click", function () {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").addClass("hidden");
  });
}

// Enable "filter by type" functionality, using checkboxes
$.fn.dataTable.ext.search.push(function (settings, searchData, index, rowData) {
  var types = $(".filter_types input:checkbox:checked")
    .map(function () {
      return this.value;
    })
    .get();

  const typeStr = rowData.type + "/" + rowData.kind;
  if (types.indexOf(typeStr) !== -1) {
    return true;
  }

  return false;
});
$(".filter_types input:checkbox").on("change", function () {
  table.draw();
});

// Remove 'bnt-group' class from container, to avoid grouping
$.fn.dataTable.Buttons.defaults.dom.container.className = "dt-buttons";

function deleteDomain() {
  // Passes the button data-id attribute as ID
  const ids = [$(this).attr("data-id")];
  delItems(ids);
}

function delItems(ids) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  // Get first element from array
  const domainRaw = ids[0];
  const domain = utils.hexDecode(domainRaw);
  const typestr = $("#old_type_" + domainRaw).val();

  // Remove first element from array
  ids.shift();

  utils.disableAll();
  const idstring = ids.join(", ");
  utils.showAlert("info", "", "Deleting domain...", "<ul>" + domain + "</ul>");

  $.ajax({
    url: "/api/domains/" + typestr + "/" + encodeURIComponent(domain),
    method: "delete",
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "far fa-trash-alt", "Successfully deleted list: ", domain);
      table.row(domainRaw).remove().draw(false);
      if (ids.length > 0) {
        // Recursively delete all remaining items
        delItems(ids);
        return;
      }

      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeBulkDeleteStates(table);

      // Update number of lists in the sidebar
      updateFtlInfo();
    })
    .fail(function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting domain(s): " + idstring,
        data.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function addDomain() {
  const action = this.id;
  const tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
  const wildcardEl = $("#wildcard_checkbox");
  const wildcardChecked = wildcardEl.prop("checked");

  // current tab's inputs
  var kind, domainEl, commentEl;
  if (tabHref === "#tab_domain") {
    kind = "exact";
    domainEl = $("#new_domain");
    commentEl = $("#new_domain_comment");
  } else if (tabHref === "#tab_regex") {
    kind = "regex";
    domainEl = $("#new_regex");
    commentEl = $("#new_regex_comment");
  }

  const comment = utils.escapeHtml(commentEl.val());

  // Check if the user wants to add multiple domains (space or newline separated)
  // If so, split the input and store it in an array
  var domains = utils.escapeHtml(domainEl.val()).split(/[\s,]+/);
  // Remove empty elements
  domains = domains.filter(function (el) {
    return el !== "";
  });
  const domainStr = JSON.stringify(domains);

  utils.disableAll();
  utils.showAlert("info", "", "Adding domain(s)...", domainStr);

  if (domains.length === 0) {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify at least one domain");
    return;
  }

  for (var i = 0; i < domains.length; i++) {
    if (kind === "exact" && wildcardChecked) {
      // Transform domain to wildcard if specified by user
      domains[i] = "(\\.|^)" + domains[i].replaceAll(".", "\\.") + "$";
      kind = "regex";

      // strip leading "*." if specified by user in wildcard mode
      if (domains[i].startsWith("*.")) domains[i] = domains[i].substr(2);
    }
  }

  // determine list type
  const type = action === "add_deny" ? "deny" : "allow";

  $.ajax({
    url: "/api/domains/" + type + "/" + kind,
    method: "post",
    dataType: "json",
    data: JSON.stringify({
      domain: domains,
      comment: comment,
      type: type,
      kind: kind,
    }),
    success: function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully added domain(s)", domainStr);
      table.ajax.reload(null, false);
      table.rows().deselect();

      // Update number of groups in the sidebar
      updateFtlInfo();
    },
    error: function (data, exception) {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new domain", data.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editDomain() {
  const elem = $(this).attr("id");
  const tr = $(this).closest("tr");
  const domain = tr.attr("data-id");
  const newTypestr = tr.find("#type_" + domain).val();
  const oldTypeStr = tr.find("#old_type_" + domain).val();
  const enabled = tr.find("#enabled_" + domain).is(":checked");
  const comment = utils.escapeHtml(tr.find("#comment_" + domain).val());
  // Convert list of string integers to list of integers using map
  const groups = tr
    .find("#multiselect_" + domain)
    .val()
    .map(Number);

  const oldType = oldTypeStr.split("/")[0];
  const oldKind = oldTypeStr.split("/")[1];

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "enabled_" + domain:
      if (enabled) {
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
      alert("bad element (" + elem + ") or invalid data-id!");
      return;
  }

  utils.disableAll();
  const domainDecoded = utils.hexDecode(domain);
  utils.showAlert("info", "", "Editing domain...", domain);
  $.ajax({
    url: "/api/domains/" + newTypestr + "/" + encodeURIComponent(domainDecoded),
    method: "put",
    dataType: "json",
    data: JSON.stringify({
      groups: groups,
      comment: comment,
      enabled: enabled,
      type: oldType,
      kind: oldKind,
    }),
    success: function () {
      utils.enableAll();
      utils.showAlert(
        "success",
        "fas fa-pencil-alt",
        "Successfully " + done + " domain",
        domainDecoded
      );
      table.ajax.reload(null, false);
    },
    error: function (data, exception) {
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
