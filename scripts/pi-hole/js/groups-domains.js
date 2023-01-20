/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var groups = [];
var token = $("#token").text();
var GETDict = {};

function getGroups() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_groups", token: token },
    function (data) {
      groups = data.data;
      initTable();
    },
    "json"
  );
}

$(function () {
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

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

  $("#add2black, #add2white").on("click", addDomain);

  var suggestTimeout;
  $("#new_domain").on("input", function (e) {
    hideSuggestDomains();
    clearTimeout(suggestTimeout);
    suggestTimeout = setTimeout(showSuggestDomains, 1000, e.target.value);
  });

  utils.setBsSelectDefaults();
  getGroups();
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
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_domains", token: token },
      type: "POST",
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
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added, false) +
        "\nLast modified: " +
        utils.datetime(data.date_modified, false) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(1)", row).html(
        '<code id="domain_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          data.domain +
          "</code>"
      );

      // Drop-down type selector
      $("td:eq(2)", row).html(
        '<select id="type_' +
          data.id +
          '" class="form-control">' +
          '<option value="0"' +
          (data.type === 0 ? " selected" : "") +
          ">Exact whitelist</option>" +
          '<option value="2"' +
          (data.type === 2 ? " selected" : "") +
          ">Regex whitelist</option>" +
          '<option value="1"' +
          (data.type === 1 ? " selected " : " ") +
          ">Exact blacklist</option>" +
          '<option value="3"' +
          (data.type === 3 ? " selected" : "") +
          ">Regex blacklist</option>" +
          "</select>"
      );
      var typeEl = $("#type_" + data.id, row);
      typeEl.on("change", editDomain);

      var disabled = data.enabled === 0;
      $("td:eq(3)", row).html(
        '<input type="checkbox" id="status_' + data.id + '"' + (disabled ? "" : " checked") + ">"
      );
      var statusEl = $("#status_" + data.id, row);
      statusEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px",
      });
      statusEl.on("change", editDomain);

      $("td:eq(4)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(utils.unescapeHtml(data.comment));
      commentEl.on("change", editDomain);

      // Group assignment field
      $("td:eq(5)", row).empty();
      $("td:eq(5)", row).append(
        '<select class="selectpicker" id="multiselect_' + data.id + '" multiple></select>'
      );
      var selectEl = $("#multiselect_" + data.id, row);
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
            data.id +
            ' class="btn btn-block btn-sm" disabled>Apply</button>'
        );

      var applyBtn = "#btn_apply_" + data.id;

      // Highlight row (if url parameter "domainid=" is used)
      if ("domainid" in GETDict && data.id === parseInt(GETDict.domainid, 10)) {
        $(row).find("td").addClass("highlight");
      }

      // Add delete domain button
      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteDomain_' +
        data.id +
        '" data-del-id="' +
        data.id +
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
            ids.push(parseInt($(this).attr("data-id"), 10));
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

  if (types.indexOf(rowData.type.toString()) !== -1) {
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
  // Passes the button data-del-id attribute as ID
  var ids = [parseInt($(this).attr("data-del-id"), 10)];
  delItems(ids);
}

function delItems(ids) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  var items = "";
  var type = "";
  var typeID = "";

  for (var id of ids) {
    // Exploit prevention: Return early for non-numeric IDs
    if (typeof id !== "number") return;

    // Retrieve domain type
    typeID = $("#type_" + id).val();
    if (typeID === "0" || typeID === "1") {
      type = " (<i>domain</i>)";
    } else if (typeID === "2" || typeID === "3") {
      type = " (<i>regex</i>)";
    }

    // Add item
    items += "<li>" + utils.escapeHtml($("#domain_" + id).text()) + type + "</li>";
  }

  utils.disableAll();
  var idstring = ids.join(", ");
  utils.showAlert("info", "", "Deleting domain(s)...", "<ul>" + items + "</ul>");

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_domain", id: JSON.stringify(ids), token: token },
  })
    .done(function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted domain(s): ",
          "<ul>" + items + "</ul>"
        );
        for (var id in ids) {
          if (Object.hasOwnProperty.call(ids, id)) {
            table.row(id).remove().draw(false).ajax.reload(null, false);
          }
        }
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting domain(s): " + idstring,
          response.message
        );
      }

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeBulkDeleteStates(table);
    })
    .fail(function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting domain(s): " + idstring,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    });
}

function addDomain() {
  var action = this.id;
  var tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
  var wildcardEl = $("#wildcard_checkbox");
  var wildcardChecked = wildcardEl.prop("checked");
  var type;

  // current tab's inputs
  var domainRegex, domainEl, commentEl;
  if (tabHref === "#tab_domain") {
    domainRegex = "domain";
    domainEl = $("#new_domain");
    commentEl = $("#new_domain_comment");
  } else if (tabHref === "#tab_regex") {
    domainRegex = "regex";
    domainEl = $("#new_regex");
    commentEl = $("#new_regex_comment");
  }

  var domain = utils.escapeHtml(domainEl.val());
  var comment = utils.escapeHtml(commentEl.val());

  utils.disableAll();
  utils.showAlert("info", "", "Adding " + domainRegex + "...", domain);

  if (domain.length > 0) {
    // strip "*." if specified by user in wildcard mode
    if (domainRegex === "domain" && wildcardChecked && domain.startsWith("*.")) {
      domain = domain.substr(2);
    }

    // determine list type
    if (domainRegex === "domain" && action === "add2black" && wildcardChecked) {
      type = "3W";
    } else if (domainRegex === "domain" && action === "add2black" && !wildcardChecked) {
      type = "1";
    } else if (domainRegex === "domain" && action === "add2white" && wildcardChecked) {
      type = "2W";
    } else if (domainRegex === "domain" && action === "add2white" && !wildcardChecked) {
      type = "0";
    } else if (domainRegex === "regex" && action === "add2black") {
      type = "3";
    } else if (domainRegex === "regex" && action === "add2white") {
      type = "2";
    }
  } else {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a " + domainRegex);
    return;
  }

  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "add_domain",
      domain: domain,
      type: type,
      comment: comment,
      token: token,
    },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "fas fa-plus", "Success!", response.message);
        domainEl.val("");
        commentEl.val("");
        wildcardEl.prop("checked", false);
        table.ajax.reload(null, false);
        table.rows().deselect();
        domainEl.focus();
      } else {
        utils.showAlert("error", "", "Error while adding new " + domainRegex, response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new " + domainRegex, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    },
  });
}

function editDomain() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var domain = utils.escapeHtml(tr.find("#domain_" + id).text());
  var type = tr.find("#type_" + id).val();
  var status = tr.find("#status_" + id).is(":checked") ? 1 : 0;
  var comment = utils.escapeHtml(tr.find("#comment_" + id).val());
  var groups = tr.find("#multiselect_" + id).val();

  var domainRegex;
  if (type === "0" || type === "1") {
    domainRegex = "domain";
  } else if (type === "2" || type === "3") {
    domainRegex = "regex";
  }

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "status_" + id:
      if (status === 0) {
        done = "disabled";
        notDone = "disabling";
      } else if (status === 1) {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of";
      notDone = "editing name of";
      break;
    case "comment_" + id:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "type_" + id:
      done = "edited type of";
      notDone = "editing type of";
      break;
    case "multiselect_" + id:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing " + domainRegex + "...", name);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: {
      action: "edit_domain",
      id: id,
      type: type,
      comment: comment,
      status: status,
      groups: groups,
      token: token,
    },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "fas fa-pencil-alt",
          "Successfully " + done + " " + domainRegex,
          domain
        );
        table.ajax.reload(null, false);
      } else
        utils.showAlert(
          "error",
          "",
          "Error while " + notDone + " " + domainRegex + " with ID " + id,
          response.message
        );
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + notDone + " " + domainRegex + " with ID " + id,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    },
  });
}
