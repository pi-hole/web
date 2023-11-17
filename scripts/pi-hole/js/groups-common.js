/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, utils:false, initTable:false */

// eslint-disable-next-line no-unused-vars
var groups = [];

// eslint-disable-next-line no-unused-vars
function getGroups() {
  $.ajax({
    url: "/api/groups",
    type: "GET",
    dataType: "json",
    success: function (data) {
      groups = data.groups;
      // Actually load table contents
      initTable();
    },
    error: function (data) {
      apiFailure(data);
    },
  });
}

// eslint-disable-next-line no-unused-vars
function processGroupResult(data, type, done, notDone) {
  // Loop over data.processed.success and show toasts
  data.processed.success.forEach(function (item) {
    utils.showAlert("success", "fas fa-pencil-alt", `Successfully ${done} ${type}`, item);
  });
  // Loop over errors and display them
  data.processed.errors.forEach(function (error) {
    console.log(error); // eslint-disable-line no-console
    utils.showAlert(
      "error",
      "",
      `Error while ${notDone} ${type} ${utils.escapeHtml(error.item)}`,
      error.error
    );
  });
}
