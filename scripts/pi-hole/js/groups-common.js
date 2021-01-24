/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2021 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, fetchInfo: false */

function getError(response) {
  var error = response.message;
  if (utils.exists(response.data) && response.data !== null) {
    if (utils.exists(response.data.sql_msg))
      error += "<br><strong>" + response.data.sql_msg + "</strong>";
    if (utils.exists(response.data.regex_msg))
      error += "<br><strong>" + response.data.regex_msg + "</strong>";
  }

  return error;
}

function addEntry(url, item, displayType, data, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", "Adding " + displayType + "...", item);
  $.ajax({
    url: url,
    method: "post",
    dataType: "json",
    data: data
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully added new " + displayType, item);
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = getError(response.error);
      utils.showAlert("error", "", "Error while adding new " + displayType, error);
      utils.enableAll();
      console.log([textStatus, jqXHR]); // eslint-disable-line no-console
    });
}

function editEntry(url, item, displayType, data, done, notDone, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", utils.upper(notDone) + " " + displayType + "...", item);
  $.ajax({
    url: url,
    method: "put",
    dataType: "json",
    data: data
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully " + done, item);
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = getError(response.error);
      utils.showAlert("error", "", "Error while " + notDone, error);
      utils.enableAll();
      console.log([textStatus, jqXHR]); // eslint-disable-line no-console
    });
}

function delEntry(url, item, displayType, onSuccess) {
  utils.disableAll();
  utils.showAlert("info", "", "Deleting " + displayType + "...", item);
  $.ajax({
    url: url,
    method: "delete"
  })
    .done(function () {
      utils.enableAll();
      utils.showAlert("success", "fas fa-plus", "Successfully deleted " + displayType, item);
      typeof onSuccess === "function" && onSuccess();
    })
    .fail(function (jqXHR, textStatus) {
      var response = jqXHR.responseJSON;
      var error = getError(response.error);
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
