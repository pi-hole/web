/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2021 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global sha256:false */

$("#loginform").submit(function (e) {
  // Cancel the native submit event (prevent the form from being
  // submitted) because we want to do a two-step challenge-response login
  e.preventDefault();
  $.ajax({
    url: "/api/auth/challenge"
  }).done(function (data) {
    // Compute password hash twice to mitigate rainbow
    // table vulnerability
    var password = $("#loginpw").val();
    var pwhash = sha256(sha256(password));
    var challenge = data.challenge;
    var response = challenge + pwhash;
    response = sha256(response);
    $.ajax({
      url: "/api/auth/login",
      data: { response: response }
    })
      .done(function () {
        // Login succeeded
        var GETDict = {};
        window.location.search
          .substr(1)
          .split("&")
          .forEach(function (item) {
            GETDict[item.split("=")[0]] = item.split("=")[1];
          });

        // Default: Send back to index.php (dashboard)
        var target = "index.php";

        // If specified: Send to requested page
        if ("target" in GETDict) {
          target = GETDict.target;
        }

        window.location.replace(target);
      })
      .fail(function (data) {
        if (data.status === 401) {
          // Login failed
          $("#pw-field").addClass("has-error");
          $("#error-label").show();
        }
      });
  });
});
