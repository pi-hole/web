/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var groups = [];
var GETDict = {};
var showtype = "all";

function getGroups() {
  $.get(
    "/api/group",
    function (data) {
      groups = data.groups;
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

  if ("type" in GETDict && (GETDict.type === "allow" || GETDict.type === "deny")) {
    showtype = GETDict.type;
  }

  // sync input fields
  $('a[data-toggle="tab"]').on("shown.bs.tab", function () {
    var tabHref = $(this).attr("href");
    var val;
    if (tabHref === "#tab_domain") {
      val = $("#new_regex_comment").val();
      $("#new_domain_comment").val(val);
      val = $("#new_regex").val();
      $("#new_domain").val(val);
    } else if (tabHref === "#tab_regex") {
      val = $("#new_domain_comment").val();
      $("#new_regex_comment").val(val);
      val = $("#new_domain").val();
      $("#new_regex").val(val);
      $("#wildcard_checkbox").prop("checked", false);
    }
  });

  $("#add2deny, #add2allow").on("click", addDomain);

  utils.setBsSelectDefaults();
  getGroups();
});

function initTable() {
  var url;
  if(showtype === "all")
    url = "/api/list";
    else if(showtype === "allow")
      url = "/api/list/allow";
    else if(showtype === "deny")
      url = "/api/list/deny";
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "/api/list",
      dataSrc: "domains"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "domain" },
      { data: "type", searchable: false },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "group_ids[, ]", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function () {
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
      $("td:eq(0)", row).html(
        '<code id="domain_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          data.domain +
          "</code>"
      );

      var allowlistOptions = "";
      if (showtype === "all" || showtype === "allow") {
        allowlistOptions =
          '<option value="allow/exact"' +
          (data.type === "allow/exact" ? " selected" : "") +
          ">Exact allowlist</option>" +
          '<option value="allow/regex"' +
          (data.type === "allow/regex" ? " selected" : "") +
          ">Regex allowlist</option>";
      }

      var denylistOptions = "";
      if (showtype === "all" || showtype === "deny") {
        denylistOptions =
          '<option value="deny/exact"' +
          (data.type === "deny/exact" ? " selected " : " ") +
          ">Exact denylist</option>" +
          '<option value="deny/regex"' +
          (data.type === "deny/regex" ? " selected" : "") +
          ">Regex denylist</option>";
      }

      $("td:eq(1)", row).html(
        '<select id="type_' +
          data.id +
          '" class="form-control">' +
          allowlistOptions +
          denylistOptions +
          "</select>"
      );
      var typeEl = $("#type_" + data.id, row);
      typeEl.on("change", editDomain);

      $("td:eq(2)", row).html(
        '<input type="checkbox" id="status_' + data.id + '"' + (data.enabled ? " checked" : "") + ">"
      );
      var statusEl = $("#status_" + data.id, row);
      statusEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      statusEl.on("change", editDomain);

      $("td:eq(3)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(data.comment);
      commentEl.on("change", editDomain);

      // Show group assignment field only if in full domain management mode
      if (table.column(5).visible()) {
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
        selectEl.val(data.group_ids);
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
      }

      var applyBtn = "#btn_apply_" + data.id;

      // Highlight row (if url parameter "domainid=" is used)
      if ("domainid" in GETDict && data.id === parseInt(GETDict.domainid, 10)) {
        $(row).find("td").addClass("highlight");
      }

      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteDomain_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      if (table.column(5).visible()) {
        $("td:eq(5)", row).html(button);
      } else {
        $("td:eq(4)", row).html(button);
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
      // Show group assignment column only on full page
      data.columns[5].visible = showtype === "all";
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
    if (action === "add2deny") {
      type = "deny";
    } else if (action === "add2allow") {
      type = "allow";
    }
    if (domainRegex === "domain") {
      type += "/exact";
    } else if (action === "add2allow") {
      type = "/regex";
    }
  } else {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a " + domainRegex);
    return;
  }

  $.ajax({
    url: "/api/list/" + type,
    method: "post",
    dataType: "json",
    data: {
      "domain": domain,
      "comment": comment
    },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert("success", "fas fa-plus", "Success!", response.message);
        domainEl.val("");
        commentEl.val("");
        wildcardEl.prop("checked", false);
        table.ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while adding new " + domainRegex, response.message);
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new " + domainRegex, jqXHR.responseText);
      console.log(exception); // eslint-disable-line no-console
    }
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

  // Show group assignment field only if in full domain management mode
  // if not included, just use the row data.
  var rowData = table.row(tr).data();
  var groups = table.column(5).visible() ? tr.find("#multiselect_" + id).val() : rowData.groups;

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
      token: token
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
    }
  });
}

function deleteDomain() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var domain = utils.escapeHtml(tr.find("#domain_" + id).text());
  var type = tr.find("#type_" + id).val();

  var domainRegex;
  if (type === "0" || type === "1") {
    domainRegex = "domain";
  } else if (type === "2" || type === "3") {
    domainRegex = "regex";
  }

  utils.disableAll();
  utils.showAlert("info", "", "Deleting " + domainRegex + "...", domain);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_domain", id: id, token: token },
    success: function (response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "far fa-trash-alt",
          "Successfully deleted " + domainRegex,
          domain
        );
        table.row(tr).remove().draw(false).ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting " + domainRegex + " with ID " + id,
          response.message
        );
      }
    },
    error: function (jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting " + domainRegex + " with ID " + id,
        jqXHR.responseText
      );
      console.log(exception); // eslint-disable-line no-console
    }
  });
}
