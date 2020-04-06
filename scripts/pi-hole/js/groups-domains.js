/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

var table;
var groups = [];
var token = $("#token").html();
var GETDict = {};
var showtype = "all";

function get_groups() {
  $.post(
    "scripts/pi-hole/php/groups.php",
    { action: "get_groups", token: token },
    function(data) {
      groups = data.data;
      initTable();
    },
    "json"
  );
}

$(document).ready(function() {
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function(item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });

  if ("type" in GETDict && (GETDict.type === "white" || GETDict.type === "black")) {
    showtype = GETDict.type;
  }

  // sync description fields, reset inactive inputs on tab change
  $('a[data-toggle="tab"]').on("shown.bs.tab", function() {
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
  });

  $("#add2black, #add2white").on("click", addDomain);

  utils.bsSelect_defaults();
  get_groups();
});

function initTable() {
  table = $("#domainsTable").DataTable({
    ajax: {
      url: "scripts/pi-hole/php/groups.php",
      data: { action: "get_domains", showtype: showtype, token: token },
      type: "POST"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "domain" },
      { data: "type", searchable: false },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function() {
      $('button[id^="deleteDomain_"]').on("click", deleteDomain);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function(row, data) {
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added) +
        "\nLast modified: " +
        utils.datetime(data.date_modified) +
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

      var whitelist_options = "";
      if (showtype === "all" || showtype === "white") {
        whitelist_options =
          '<option value="0"' +
          (data.type === 0 ? " selected" : "") +
          ">Exact whitelist</option>" +
          '<option value="2"' +
          (data.type === 2 ? " selected" : "") +
          ">Regex whitelist</option>";
      }

      var blacklist_options = "";
      if (showtype === "all" || showtype === "black") {
        blacklist_options =
          '<option value="1"' +
          (data.type === 1 ? " selected " : " ") +
          ">Exact blacklist</option>" +
          '<option value="3"' +
          (data.type === 3 ? " selected" : "") +
          ">Regex blacklist</option>";
      }

      $("td:eq(1)", row).html(
        '<select id="type_' +
          data.id +
          '" class="form-control">' +
          whitelist_options +
          blacklist_options +
          "</select>"
      );
      var typeEl = $("#type_" + data.id, row);
      typeEl.on("change", editDomain);

      var disabled = data.enabled === 0;
      $("td:eq(2)", row).html(
        '<input type="checkbox" id="status_' + data.id + '"' + (disabled ? "" : " checked") + ">"
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
          var data_sub = "";
          if (!groups[i].enabled) {
            data_sub = 'data-subtext="(disabled)"';
          }

          selectEl.append(
            $("<option " + data_sub + "/>")
              .val(groups[i].id)
              .text(groups[i].name)
          );
        }

        // Select assigned groups
        selectEl.val(data.groups);
        // Initialize bootstrap-select
        selectEl
          // fix dropdown if it would stick out right of the viewport
          .on("show.bs.select", function() {
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
          .on("changed.bs.select", function() {
            // enable Apply button
            if ($(ApplyBtn).prop("disabled")) {
              $(ApplyBtn)
                .addClass("btn-success")
                .prop("disabled", false)
                .on("click", function() {
                  editDomain.call(selectEl);
                });
            }
          })
          .on("hide.bs.select", function() {
            // Restore values if drop-down menu is closed without clicking the Apply button
            if (!$(ApplyBtn).prop("disabled")) {
              $(this)
                .val(data.groups)
                .selectpicker("refresh");
              $(ApplyBtn)
                .removeClass("btn-success")
                .prop("disabled", true)
                .off("click");
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

      var ApplyBtn = "#btn_apply_" + data.id;

      // Highlight row (if url parameter "domainid=" is used)
      if ("domainid" in GETDict && data.id === parseInt(GETDict.domainid)) {
        $(row)
          .find("td")
          .addClass("highlight");
      }

      var button =
        '<button class="btn btn-danger btn-xs" type="button" id="deleteDomain_' +
        data.id +
        '">' +
        '<span class="glyphicon glyphicon-trash"></span>' +
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
    stateSaveCallback: function(settings, data) {
      // Store current state in client's local storage area
      localStorage.setItem("groups-domains-table", JSON.stringify(data));
    },
    stateLoadCallback: function() {
      // Receive previous state from client's local storage area
      var data = localStorage.getItem("groups-domains-table");
      // Return if not available
      if (data === null) {
        return null;
      }

      data = JSON.parse(data);
      // Always start on the first page to show most recent queries
      data.start = 0;
      // Always start with empty search field
      data.search.search = "";
      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Show group assignment column only on full page
      data.columns[5].visible = showtype === "all";
      // Apply loaded state to table
      return data;
    },
    initComplete: function() {
      if ("domainid" in GETDict) {
        var pos = table
          .column(0, { order: "current" })
          .data()
          .indexOf(parseInt(GETDict.domainid));
        if (pos >= 0) {
          var page = Math.floor(pos / table.page.info().length);
          table.page(page).draw(false);
        }
      }
    }
  });

  table.on("order.dt", function() {
    var order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      $("#resetButton").show();
    } else {
      $("#resetButton").hide();
    }
  });
  $("#resetButton").on("click", function() {
    table.order([[0, "asc"]]).draw();
    $("#resetButton").hide();
  });
}

function addDomain() {
  var action = this.id;
  var tabHref = $('a[data-toggle="tab"][aria-expanded="true"]').attr("href");
  var wildcardEl = $("#wildcard_checkbox");
  var wildcard_checked = wildcardEl.prop("checked");
  var type;

  // current tab's inputs
  var domain_regex, domainEl, commentEl;
  if (tabHref === "#tab_domain") {
    domain_regex = "domain";
    domainEl = $("#new_domain");
    commentEl = $("#new_domain_comment");
  } else if (tabHref === "#tab_regex") {
    domain_regex = "regex";
    domainEl = $("#new_regex");
    commentEl = $("#new_regex_comment");
  }

  var domain = domainEl.val();
  var comment = commentEl.val();

  utils.disableAll();
  utils.showAlert("info", "", "Adding " + domain_regex + "...", domain);

  if (domain.length > 0) {
    // strip "*." if specified by user in wildcard mode
    if (domain_regex === "domain" && wildcard_checked && domain.startsWith("*.")) {
      domain = domain.substr(2);
    }

    // determine list type
    if (domain_regex === "domain" && action === "add2black" && wildcard_checked) {
      type = "3W";
    } else if (domain_regex === "domain" && action === "add2black" && !wildcard_checked) {
      type = "1";
    } else if (domain_regex === "domain" && action === "add2white" && wildcard_checked) {
      type = "2W";
    } else if (domain_regex === "domain" && action === "add2white" && !wildcard_checked) {
      type = "0";
    } else if (domain_regex === "regex" && action === "add2black") {
      type = "3";
    } else if (domain_regex === "regex" && action === "add2white") {
      type = "2";
    }
  } else {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a " + domain_regex);
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
      token: token
    },
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-plus",
          "Successfully added " + domain_regex,
          domain
        );
        domainEl.val("");
        commentEl.val("");
        wildcardEl.prop("checked", false);
        table.ajax.reload(null, false);
      } else {
        utils.showAlert("error", "", "Error while adding new " + domain_regex, response.message);
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new " + domain_regex, jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editDomain() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var domain = tr.find("#domain_" + id).text();
  var type = tr.find("#type_" + id).val();
  var status = tr.find("#status_" + id).is(":checked") ? 1 : 0;
  var comment = tr.find("#comment_" + id).val();

  // Show group assignment field only if in full domain management mode
  // if not included, just use the row data.
  var rowData = table.row(tr).data();
  var groups = table.column(5).visible() ? tr.find("#multiselect_" + id).val() : rowData.groups;

  var domain_regex;
  if (type === "0" || type === "1") {
    domain_regex = "domain";
  } else if (type === "2" || type === "3") {
    domain_regex = "regex";
  }

  var done = "edited";
  var not_done = "editing";
  switch (elem) {
    case "status_" + id:
      if (status === 0) {
        done = "disabled";
        not_done = "disabling";
      } else if (status === 1) {
        done = "enabled";
        not_done = "enabling";
      }

      break;
    case "name_" + id:
      done = "edited name of";
      not_done = "editing name of";
      break;
    case "comment_" + id:
      done = "edited comment of";
      not_done = "editing comment of";
      break;
    case "type_" + id:
      done = "edited type of";
      not_done = "editing type of";
      break;
    case "multiselect_" + id:
      done = "edited groups of";
      not_done = "editing groups of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing " + domain_regex + "...", name);
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
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-pencil",
          "Successfully " + done + " " + domain_regex,
          domain
        );
        table.ajax.reload(null, false);
      } else
        utils.showAlert(
          "error",
          "",
          "Error while " + not_done + " " + domain_regex + " with ID " + id,
          response.message
        );
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + not_done + " " + domain_regex + " with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteDomain() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var domain = tr.find("#domain_" + id).text();
  var type = tr.find("#type_" + id).val();

  var domain_regex;
  if (type === "0" || type === "1") {
    domain_regex = "domain";
  } else if (type === "2" || type === "3") {
    domain_regex = "regex";
  }

  utils.disableAll();
  utils.showAlert("info", "", "Deleting " + domain_regex + "...", domain);
  $.ajax({
    url: "scripts/pi-hole/php/groups.php",
    method: "post",
    dataType: "json",
    data: { action: "delete_domain", id: id, token: token },
    success: function(response) {
      utils.enableAll();
      if (response.success) {
        utils.showAlert(
          "success",
          "glyphicon glyphicon-trash",
          "Successfully deleted " + domain_regex,
          domain
        );
        table
          .row(tr)
          .remove()
          .draw(false)
          .ajax.reload(null, false);
      } else {
        utils.showAlert(
          "error",
          "",
          "Error while deleting " + domain_regex + " with ID " + id,
          response.message
        );
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while deleting " + domain_regex + " with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}
