/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, group_utils: false */

var table;

$(function () {
  $("#btnAdd").on("click", addList);

  utils.setBsSelectDefaults();
  group_utils.getGroups(initTable);
});

function initTable(groups) {
  table = $("#listsTable").DataTable({
    ajax: {
      url: "/api/lists",
      dataSrc: "lists"
    },
    order: [[0, "asc"]],
    columns: [
      { data: "id", visible: false },
      { data: "address" },
      { data: "enabled", searchable: false },
      { data: "comment" },
      { data: "groups[, ]", searchable: false },
      { data: null, width: "80px", orderable: false }
    ],
    drawCallback: function () {
      $('button[id^="deleteList_"]').on("click", deleteList);
      // Remove visible dropdown to prevent orphaning
      $("body > .bootstrap-select.dropdown").remove();
    },
    rowCallback: function (row, data) {
      $(row).attr("data-id", data.id);
      var tooltip =
        "Added: " +
        utils.datetime(data.date_added, false) +
        "\nLast modified (database entry): " +
        utils.datetime(data.date_modified, false) +
        "\nLast updated (list content): " +
        (data.date_updated !== null ? utils.datetime(data.date_updated, false) : "N/A") +
        "\nDatabase ID: " +
        data.id;
      $("td:eq(0)", row).html(
        '<code id="address_' +
          data.id +
          '" title="' +
          tooltip +
          '" class="breakall">' +
          data.address +
          "</code>"
      );

      $("td:eq(1)", row).html(
        '<input type="checkbox" id="status_' +
          data.id +
          '"' +
          (data.enabled ? " checked" : "") +
          ">"
      );
      var statusEl = $("#status_" + data.id, row);
      statusEl.bootstrapToggle({
        on: "Enabled",
        off: "Disabled",
        size: "small",
        onstyle: "success",
        width: "80px"
      });
      statusEl.on("change", editList);

      $("td:eq(2)", row).html('<input id="comment_' + data.id + '" class="form-control">');
      var commentEl = $("#comment_" + data.id, row);
      commentEl.val(utils.unescapeHtml(data.comment));
      commentEl.on("change", editList);

      $("td:eq(3)", row).empty();
      $("td:eq(3)", row).append(
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
                editList.call(selectEl);
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

      var button =
        '<button type="button" class="btn btn-danger btn-xs" id="deleteList_' +
        data.id +
        '">' +
        '<span class="far fa-trash-alt"></span>' +
        "</button>";
      $("td:eq(4)", row).html(button);
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
      utils.stateSaveCallback("groups-lists-table", data);
    },
    stateLoadCallback: function () {
      var data = utils.stateLoadCallback("groups-lists-table");

      // Return if not available
      if (data === null) {
        return null;
      }

      // Reset visibility of ID column
      data.columns[0].visible = false;
      // Apply loaded state to table
      return data;
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

function addList() {
  var addressEl = $("#new_address");
  var address = utils.escapeHtml(addressEl.val());
  var commentEl = $("#new_comment");
  var comment = utils.escapeHtml(commentEl.val());

  if (address.length === 0) {
    utils.showAlert("warning", "", "Warning", "Please specify an address");
    return;
  }

  var data = JSON.stringify({
    item: address,
    comment: comment,
    enabled: true
  });

  var url = "/api/lists/";
  group_utils.addEntry(url, address, "list", data, function () {
    addressEl.val("");
    commentEl.val("");
    group_utils.reload(table);
  });
}

function editList() {
  var elem = $(this).attr("id");
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var enabled = tr.find("#status_" + id).is(":checked");
  var comment = utils.unescapeHtml(tr.find("#comment_" + id).val());
  var address = utils.unescapeHtml(tr.find("#address_" + id).text());
  var groups = tr
    .find("#multiselect_" + id)
    .val()
    .map(function (val) {
      return parseInt(val, 10);
    });

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
    case "comment_" + id:
      done = "edited comment of";
      notDone = "editing comment of";
      break;
    case "multiselect_" + id:
      done = "edited groups of";
      notDone = "editing groups of";
      break;
    default:
      alert("bad element or invalid data-id!");
      return;
  }

  var data = JSON.stringify({
    comment: comment,
    enabled: enabled,
    groups: groups
  });

  var url = "/api/lists/" + encodeURIComponent(address);
  group_utils.editEntry(url, address, "list", data, done, notDone, function () {
    group_utils.reload(table);
  });
}

function deleteList() {
  var tr = $(this).closest("tr");
  var id = tr.attr("data-id");
  var address = utils.unescapeHtml(tr.find("#address_" + id).text());

  var url = "/api/lists/" + encodeURIComponent(address);
  group_utils.delEntry(url, address, "list", function () {
    group_utils.reload(table);
  });
}
