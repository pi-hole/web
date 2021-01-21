/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2021 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global sha256:false */

function getParams() {
  var GETDict = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });
  return GETDict;
}

function computeResponse(password, challenge) {
  // Compute password hash twice to mitigate rainbow
  // table vulnerability
  return sha256(challenge + ":" + sha256(sha256(password)));
}

function redirect() {
  // Login succeeded or not needed (empty password)
  // Default: Send back to index.php (dashboard)
  var target = "index.php";

  // If specified: Send to requested page
  var GETDict = getParams();
  if ("target" in GETDict) {
    target = GETDict.target;
  }

  // Redirect to target
  window.location.replace(target);
}

function doLogin(response) {
  $.ajax({
    url: "/api/auth",
    method: "POST",
    data: { response: response }
  })
    .done(function () {
      redirect();
    })
    .fail(function (data) {
      if (data.status === 401) {
        // Login failed
        $("#pw-field").addClass("has-error");
        $("#error-label").show();
      }
    });
}

$("#loginform").submit(function (e) {
  // Cancel the native submit event (prevent the form from being
  // submitted) because we want to do a two-step challenge-response login
  e.preventDefault();

  // Get challenge
  $.ajax({
    url: "/api/auth",
    method: "GET"
  }).done(function (data) {
    if ("challenge" in data) {
      var response = computeResponse($("#loginpw").val(), data.challenge);
      doLogin(response);
    } else if (data.session.valid === true)
      // Password may have been remove meanwhile
      redirect();
  });
});

$(function () {
  // Check if we need to login at all
  $.ajax({
    url: "/api/auth"
  }).done(function (data) {
    if (data.session.valid === true) redirect();
  });
});
