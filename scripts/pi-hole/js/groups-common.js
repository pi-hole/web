/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2021 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, fetchInfo: false */

function addEntry(url, argument, displayType, data, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", "Adding " + displayType + "...", argument);
  $.ajax({
    url: url,
    method: "post",
    dataType: "json",
    data: data
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Success!", "");
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = response.error;
      error =
        utils.exists(error.data) && error.data !== null && utils.exists(error.data.sql_msg)
          ? error.message + "<br><strong>" + error.data.sql_msg + "</strong>"
          : error.message;
      utils.showAlert("error", "", "Error while adding new " + displayType, error);
      utils.enableAll();
      console.log([textStatus, jqXHR]); // eslint-disable-line no-console
    });
}

function editEntry(url, argument, displayType, data, done, notDone, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", utils.upper(notDone) + " " + displayType + "...", argument);
  $.ajax({
    url: url,
    method: "put",
    dataType: "json",
    data: data
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully " + done, argument);
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = response.error;
      error =
        utils.exists(error.data) && error.data !== null && utils.exists(error.data.sql_msg)
          ? error.message + "<br><strong>" + error.data.sql_msg + "</strong>"
          : error.message;
      utils.showAlert("error", "", "Error while " + notDone, error);
      utils.enableAll();
      console.log([textStatus, jqXHR]); // eslint-disable-line no-console
    });
}

function delEntry(url, argument, displayType, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting " + displayType + "...", argument);
  $.ajax({
    url: url,
    method: "delete"
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully deleted " + displayType, argument);
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = response.error;
      error =
        utils.exists(error.data) && error.data !== null && utils.exists(error.data.sql_msg)
          ? error.message + "<br><strong>" + error.data.sql_msg + "</strong>"
          : error.message;
      utils.showAlert("error", "", "Error while deleting" + displayType, error);
      utils.enableAll();
      console.log([textStatus, jqXHR]); // eslint-disable-line no-console
    });
}

function reload(table) {
  table.ajax.reload(null, false);
  // Give FTL two seconds for reloading
  setTimeout(fetchInfo, 2000);
}

function getGroups(callback) {
  $.get(
    "/api/groups",
    function (data) {
      callback(data.groups);
    },
    "json"
  );
}

window.group_utils = (function () {
  return {
    addEntry: addEntry,
    editEntry: editEntry,
    delEntry: delEntry,
    reload: reload,
    getGroups: getGroups
  };
})();
