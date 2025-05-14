/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, utils:false, initTable:false, updateFtlInfo:false */

"use strict";

let groups = [];

function populateGroupSelect(selectEl) {
  // No select element found, return early
  if (selectEl.length === 0) return;

  // Add all known groups
  for (const group of groups) {
    const dataSub = group.enabled ? "" : 'data-subtext="(disabled)"';

    selectEl.append($(`<option ${dataSub}/>`).val(group.id).text(group.name));
  }

  // Initialize selectpicker
  selectEl.val([0]);

  // Refresh selectpicker
  selectEl.selectpicker("refresh");
}

globalThis.getGroups = function () {
  utils.fetchFactory(`${document.body.dataset.apiurl}/groups`).then(data => {
    groups = data.groups;

    // Get all all <select> elements with the class "selectpicker"
    const groupSelector = $(".selectpicker");
    // Populate the groupSelector with the groups
    for (const element of groupSelector) {
      populateGroupSelect($(element));
    }

    // Actually load table contents
    initTable();
  });
};

globalThis.processGroupResult = function (data, type, done, notDone) {
  // Loop over data.processed.success and show toasts
  for (const item of data.processed.success) {
    utils.showAlert({
      type: "success",
      icon: "fas fa-pencil-alt",
      title: `Successfully ${done} ${type}`,
      message: item,
    });
  }

  // Loop over errors and display them
  for (const error of data.processed.errors) {
    console.log(error); // eslint-disable-line no-console
    utils.showAlert({
      type: "error",
      title: `Error while ${notDone} ${type} ${error.item}`,
      message: error.error,
    });
  }
};

globalThis.delGroupItems = function (type, ids, table, listType = undefined) {
  // Check input validity
  if (!Array.isArray(ids)) return;

  const url = `${document.body.dataset.apiurl}/${type}s:batchDelete`;

  // Decode all items and create a comma-separated string
  const idString = ids
    .map(id => {
      id.item = utils.hexDecode(id.item);
      return id.item;
    })
    .join(", ");

  // Append "s" to type if more than one item is deleted
  type = utils.pluralize(ids.length, type);

  // Prepend listType to type if it is not undefined
  if (listType !== undefined) {
    type = `${listType} ${type}`;
  }

  utils.disableAll();
  utils.showAlert({
    type: "info",
    title: `Deleting ${ids.length} ${type}...`,
    message: idString,
  });

  $.ajax({
    url,
    data: JSON.stringify(ids),
    contentType: "application/json",
    method: "POST",
  })
    .done(() => {
      utils.enableAll();
      utils.showAlert({
        type: "success",
        icon: "far fa-trash-alt",
        title: `Successfully deleted ${type}`,
        message: idString,
      });
      table.ajax.reload(null, false);

      // Clear selection after deletion
      table.rows().deselect();
      utils.changeTableButtonStates(table);

      // Update number of <type> items in the sidebar
      updateFtlInfo();
    })
    .fail((data, exception) => {
      apiFailure(data);
      utils.enableAll();
      utils.showAlert({
        type: "error",
        title: `Error while deleting ${type}`,
        message: data.responseText,
      });
      console.log(exception); // eslint-disable-line no-console
    });
};

globalThis.handleTableOrderChange = table => {
  const resetButton = document.getElementById("resetButton");

  table.on("order.dt", () => {
    const order = table.order();
    if (order[0][0] !== 0 || order[0][1] !== "asc") {
      resetButton.classList.remove("d-none");
    } else {
      resetButton.classList.add("d-none");
    }
  });

  resetButton.addEventListener("click", event => {
    table.order([[0, "asc"]]).draw();
    event.currentTarget.classList.add("d-none");
  });
};
