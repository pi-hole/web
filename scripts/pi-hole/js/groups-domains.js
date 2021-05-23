/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, group_utils: false */

var table;
var GETDict = {};

$(function () {
  // We use the GETDict for possible domain highlighting
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

  // sync input fields
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    var tabHref = $(this).attr("href");
    var val;
    if (tabHref === "#tab_domain") {
      val = $("#new_regex_comment").val();
      $("#new_domain_comment").val(val);
      val = $("#new_regex").val();
      $("#new_domain").val(val);
      $("#displayType1").text("domain");
      $("#displayType2").text("domain");
    } else if (tabHref === "#tab_regex") {
      val = $("#new_domain_comment").val();
      $("#new_regex_comment").val(val);
      val = $("#new_domain").val();
      $("#new_regex").val(val);
      $("#wildcard_checkbox").prop("checked", false);
      $("#displayType1").text("regex");
      $("#displayType2").text("regex");
    }
  });

  $("#add2deny, #add2allow").on("click", addDomain);

  utils.setBsSelectDefaults();
  group_utils.getGroups(initTable);
});

function initTable(groups) {
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "/api/domains",
      dataSrc: "domains"
    },

    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      {
        data: "domain", title: "Domain/Regex",
        render: function (data, type, row) {
          var tooltip =
            "Added: " +
            utils.datetime(data.date_added, false) +
            "\nLast modified: " +
            utils.datetime(data.date_modified, false) +
            "\nDatabase ID: " +
            data.id;

          return '<code id="domain_' + row.id + '" title="' + tooltip + '" class="breakall">' + data + "</code>"
        }
      },
      {
        data: "type", title: "Type", searchable: false,
        render: function (data, type, row) {
          var allowlistOptions =
            '<option value="allow/exact"' +
            (data.type === "allow" && data.kind === "exact" ? " selected" : "") +
            ">Allow (exact)</option>" +
            '<option value="allow/regex"' +
            (data.type === "allow" && data.kind === "regex" ? " selected" : "") +
            ">Allow (regex)</option>";

          var denylistOptions =
            '<option value="deny/exact"' +
            (data.type === "deny" && data.kind === "exact" ? " selected " : "") +
            ">Deny (exact)</option>" +
            '<option value="deny/regex"' +
            (data.type === "deny" && data.kind === "regex" ? " selected" : "") +
            ">Deny (regex)</option>";

          return '<select id="type_' + row.id + '" class="form-control">' + allowlistOptions + denylistOptions + "</select>"
        }
      },
      {
        data: "enabled", title: "Status", searchable: false,
        render: function (data, type, row) {
          return '<input type="checkbox" id="status_' + row.id + '"' + (data ? " checked" : "") + '>'
        }
      },
      {
        data: "comment", title: "Comment",
        render: function (data, type, row) {
          return '<input id="comment_' + row.id + '" class="form-control" value="' + data + '">'
        }
      },
      {
        data: "groups[, ]", title: "Group Assignment", searchable: false,
      },
      {
        data: null, title: "Action", width: "80px", orderable: false,
        render: function (data, type, row) {
          return '<button type="button" class="btn btn-danger btn-xs" id="deleteDomain_' + row.id + '">' +
            '<span class="far fa-trash-alt"></span>' +
            "</button>";
        },
      }
    ],
    drawCallback: function () {
      $('button[id^="deleteDomain_"]').on("click", deleteDomain);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();

      $('[id^="comment_"]').on("change", editDomain);
      $('[id^="status_"]').on("change", editDomain);
      $('[id^="type_"]').on("change", editDomain);
      $('[id^="status_"]').bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      $(row).attr("data-type", data.type);
      $(row).attr("data-kind", data.kind);

      $("td:eq(4)", row).empty();
      $("td:eq(4)", row).append(
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
    },
    dom:
      "<'row'<'col-sm-4'l><'col-sm-8'f>>" +
      "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
      "<'row'<'col-sm-5'i><'col-sm-7'p>>",
    lengthMenu: [
      [10, 25, 50, 100, -1],
      [10, 25, 50, 100, "All"]
    ],
    stateSave: true,
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
      // Show group assignment column
      data.columns[5].visible = true;
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
    }
  });
  // Disable autocorrect in the search box
  var input = document.querySelector("input[type=search]");
  if (input !== null) {
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", false);
  }

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

function addDomain() {
  var action = this.id;
  var tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
  var wildcardEl = $("#wildcard_checkbox");
  var wildcardChecked = wildcardEl.prop("checked");
  var type;

  // current tab's inputs
  var displayType, domainEl, commentEl;
  if (tabHref === "#tab_domain") {
    displayType = "domain";
    domainEl = $("#new_domain");
    commentEl = $("#new_domain_comment");
  } else if (tabHref === "#tab_regex") {
    displayType = "regex";
    domainEl = $("#new_regex");
    commentEl = $("#new_regex_comment");
  }

  var domain = utils.escapeHtml(domainEl.val().trim());
  var comment = utils.escapeHtml(commentEl.val().trim());

  if (domain.length === 0) {
    utils.showAlert("warning", "", "Warning", "Please specify a " + displayType);
    return;
  }

  if (wildcardChecked) {
    // strip "*." if specified by user in wildcard mode
    if (domain.startsWith("*.")) {
      domain = domain.substr(2);
    }

    // Convert domain regex when wildcard domain is requested
    domain = "(\\.|^)" + domain.replace(".", "\\.") + "$";
    displayType = "regex";
  }

  // Reject pseudo-wildcards still containing * somewhere
  // (see AdminLTE#1727)
  if (displayType === "domain" && domain.search("\\*") !== -1) {
    utils.showAlert(
      "warning",
      "",
      "Warning",
      "Specified domain is invalid, consider using a RegEx instead."
    );
    return;
  }

  // determine list type
  type = action === "add2allow" ? "allow" : "deny";
  type += displayType === "domain" ? "/exact" : "/regex";

  var data = JSON.stringify({
    domain: domain,
    comment: comment,
    enabled: true
  });

  var url = "/api/domains/" + type;
  group_utils.addEntry(url, domain, displayType, data, function () {
    domainEl.val("");
    commentEl.val("");
    wildcardEl.prop("checked", false);
    group_utils.reload(table);
  });
}

function editDomain() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var type = tr.attr("data-type");
  var kind = tr.attr("data-kind");
  var domain = utils.escapeHtml(tr.find("#domain_" + id).text());
  var newtype = tr.find("#type_" + id).val();
  var enabled = tr.find("#status_" + id).is(":checked");
  var comment = utils.escapeHtml(tr.find("#comment_" + id).val());
  var groups = tr
    .find("#multiselect_" + id)
    .val()
    .map(function (val) {
      return parseInt(val, 10);
    });

  var displayType = kind === "exact" ? " domain" : " regex";

  var done = "edited";
  var notDone = "editing";
  switch (elem) {
    case "status_" + id:
      if (!enabled) {
        done = "disabled";
        notDone = "disabling";
      } else {
        done = "enabled";
        notDone = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of" + displayType;
      notDone = "editing name of" + displayType;
      break;
    case "comment_" + id:
      done = "edited comment of" + displayType;
      notDone = "editing comment of" + displayType;
      break;
    case "type_" + id:
      done = "edited type";
      notDone = "editing type";
      break;
    case "multiselect_" + id:
      done = "edited groups of" + displayType;
      notDone = "editing groups of" + displayType;
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  var data = JSON.stringify({
    type: type,
    kind: kind,
    comment: comment,
    enabled: enabled,
    groups: groups
  });

  var url = "/api/domains/" + newtype + "/" + encodeURIComponent(domain);
  group_utils.editEntry(url, domain, displayType, data, done, notDone, function () {
    group_utils.reload(table);
  });
}

function deleteDomain() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var domain = utils.escapeHtml(tr.find("#domain_" + id).text());
  var type = tr.find("#type_" + id).val();

  var displayType = type.search("/exact$") !== -1 ? " domain" : " regex";
  var url = "/api/domains/" + type + "/" + encodeURIComponent(domain);
  group_utils.delEntry(url, domain, displayType, function () {
    group_utils.reload(table);
  });
}
