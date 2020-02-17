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

  $("#btnAdd").on("click", addDomain);

  get_groups();

  $("#select").on("change", function() {
    $("#ip-custom").val("");
    $("#ip-custom").prop("disabled", $("#select option:selected").val() !== "custom");
  });
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
      $(".deleteDomain").on("click", deleteDomain);
    },
    rowCallback: function(row, data) {
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added) +
        "\nLast modified: " +
        utils.datetime(data.date_modified) +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(0)", row).html(
        '<code id="domain" title="' + tooltip + '" class="breakall">' + data.domain + "</code>"
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
        '<select id="type" class="form-control">' +
          whitelist_options +
          blacklist_options +
          "</select>"
      );
      $("#type", row).on("change", editDomain);

      var disabled = data.enabled === 0;
      $("td:eq(2)", row).html(
        '<input type="checkbox" id="status"' + (disabled ? "" : " checked") + ">"
      );
      $("#status", row).bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      $("#status", row).on("change", editDomain);

      $("td:eq(3)", row).html(
        '<input id="comment" class="form-control"><input id="id" type="hidden" value="' +
          data.id +
          '">'
      );
      $("#comment", row).val(data.comment);
      $("#comment", row).on("change", editDomain);

      // Show group assignment field only if in full domain management mode
      if (table.column(5).visible()) {
        $("td:eq(4)", row).empty();
        $("td:eq(4)", row).append(
          '<div id="selectHome' +
            data.id +
            '"><select id="multiselect" multiple="multiple"></select></div>'
        );
        var sel = $("#multiselect", row);
        // Add all known groups
        for (var i = 0; i < groups.length; i++) {
          var extra = "";
          if (!groups[i].enabled) {
            extra = " (disabled)";
          }

          sel.append(
            $("<option />")
              .val(groups[i].id)
              .text(groups[i].name + extra)
          );
        }

        // Select assigned groups
        sel.val(data.groups);
        // Initialize multiselect
        sel.multiselect({
          includeSelectAllOption: true,
          buttonContainer: '<div id="container' + data.id + '" class="btn-group"/>',
          maxHeight: 200,
          onDropdownShown: function() {
            var el = $("#container" + data.id);
            var top = el[0].getBoundingClientRect().top;
            var bottom = $(window).height() - top - el.height();
            if (bottom < 200) {
              el.addClass("dropup");
            }

            if (bottom > 200) {
              el.removeClass("dropup");
            }

            var offset = el.offset();
            $("body").append(el);
            el.css("position", "absolute");
            el.css("top", offset.top + "px");
            el.css("left", offset.left + "px");
          },
          onDropdownHide: function() {
            var el = $("#container" + data.id);
            var home = $("#selectHome" + data.id);
            home.append(el);
            el.removeAttr("style");
          }
        });
        sel.on("change", editDomain);
      }

      // Highlight row
      if ("domainid" in GETDict && data.id === parseInt(GETDict.domainid)) {
        $(row)
          .find("td")
          .addClass("highlight");
      }

      var button =
        '<button class="btn btn-danger btn-xs deleteDomain" type="button" data-id="' +
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
  var domain = $("#new_domain").val();
  var type = $("#new_type").val();
  var comment = $("#new_comment").val();

  utils.disableAll();
  utils.showAlert("info", "", "Adding domain...", domain);

  if (domain.length === 0) {
    utils.enableAll();
    utils.showAlert("warning", "", "Warning", "Please specify a domain");
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
        utils.showAlert("success", "glyphicon glyphicon-plus", "Successfully added domain", domain);
        $("#new_domain").val("");
        $("#new_comment").val("");
        table.ajax.reload();
      } else utils.showAlert("error", "", "Error while adding new domain", response.message);
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while adding new domain", jqXHR.responseText);
      console.log(exception);
    }
  });
}

function editDomain() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var domain = tr.find("#domain").text();
  var id = tr.find("#id").val();
  var type = tr.find("#type").val();
  var status = tr.find("#status").is(":checked") ? 1 : 0;
  var comment = tr.find("#comment").val();
  var groups = tr.find("#multiselect").val();

  var done = "edited";
  var not_done = "editing";
  if (elem === "status" && status === 1) {
    done = "enabled";
    not_done = "enabling";
  } else if (elem === "status" && status === 0) {
    done = "disabled";
    not_done = "disabling";
  } else if (elem === "name") {
    done = "edited name of";
    not_done = "editing name of";
  } else if (elem === "comment") {
    done = "edited comment of";
    not_done = "editing comment of";
  } else if (elem === "type") {
    done = "edited type of";
    not_done = "editing type of";
  } else if (elem === "multiselect") {
    done = "edited groups of";
    not_done = "editing groups of";
  }

  utils.disableAll();
  utils.showAlert("info", "", "Editing domain...", name);
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
          "Successfully " + done + " domain",
          domain
        );
      } else
        utils.showAlert(
          "error",
          "",
          "Error while " + not_done + " domain with ID " + id,
          response.message
        );
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert(
        "error",
        "",
        "Error while " + not_done + " domain with ID " + id,
        jqXHR.responseText
      );
      console.log(exception);
    }
  });
}

function deleteDomain() {
  var id = $(this).attr("data-id");
  var tr = $(this).closest("tr");
  var domain = tr.find("#domain").text();

  utils.disableAll();
  utils.showAlert("info", "", "Deleting domain...", domain);
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
          "Successfully deleted domain",
          domain
        );
        table
          .row(tr)
          .remove()
          .draw(false);
      } else {
        utils.showAlert("error", "", "Error while deleting domain with ID " + id, response.message);
      }
    },
    error: function(jqXHR, exception) {
      utils.enableAll();
      utils.showAlert("error", "", "Error while deleting domain with ID " + id, jqXHR.responseText);
      console.log(exception);
    }
  });
}
