/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

function getParams() {
  var GETDict = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = decodeURIComponent(item.split("=")[1]);
    });
  return GETDict;
}

function redirect() {
  // Login succeeded or not needed (empty password)
  // Default: Send back to dashboard
  var target = ".";

  // If DNS failure: send to Pi-hole diagnosis messages page
  if ($("#dns-failure-label").is(":visible")) {
    target = "messages.lp";
  } else {
    // If specified: Send to requested page
    var GETDict = getParams();
    if ("target" in GETDict) {
      // URL-decode target
      target = GETDict.target;
    }
  }

  // Redirect to target
  window.location.replace(target);
}

function wrongPassword(isError = false, isSuccess = false) {
  if (isError) {
    $("#pw-field").addClass("has-error");
    $("#error-label").show();
    $("#forgot-pw-box").removeClass("box-info").removeClass("collapsed-box").addClass("box-danger");
    $("#forgot-pw-box .box-body").show();
    $("#forgot-pw-toggle-icon").removeClass("fa-plus").addClass("fa-minus");
  } else if (isSuccess) {
    $("#pw-field").addClass("has-success");
  } else {
    $("#pw-field").removeClass("has-error");
    $("#error-label").hide();
    $("#forgot-pw-box").addClass("box-info").addClass("collapsed-box").removeClass("box-danger");
    $("#forgot-pw-box .box-body").hide();
    $("#forgot-pw-toggle-icon").removeClass("fa-minus").addClass("fa-plus");
  }
}

function doLogin(password) {
  wrongPassword(false, false);
  $.ajax({
    url: "/api/auth",
    method: "POST",
    data: JSON.stringify({ password: password, totp: parseInt($("#totp").val(), 10) }),
  })
    .done(function () {
      wrongPassword(false, true);
      redirect();
    })
    .fail(function (data) {
      if (data.status === 401) {
        // Login failed, show error message
        wrongPassword(true, false);
      }
    });
}

$("#loginform").submit(function (e) {
  // Cancel the native submit event (prevent the form from being
  // submitted) because we want to do a two-step challenge-response login
  e.preventDefault();

  // Check if cookie checkbox is enabled
  /*  if (!$("#logincookie").is(":checked")) {
    alert("Please consent to using a login cookie to be able to log in. It is necessary to keep you logged in between page reloads. You can end the session by clicking on the logout button in the top right menu at any time.");
    return;
  }*/

  doLogin($("#loginpw").val());
});

// Trigger keyup event when pasting into the TOTP code input field
$("#totp").on("paste", function (e) {
  $(e.target).keyup();
});

$("#totp").on("keyup", function () {
  var code = $(this).val();
  if (code.length === 6) {
    $("#loginform").submit();
  }
});

function showDNSfailure() {
  $("#dns-failure-label").show();
  $("#login-box").addClass("error-box");
}

$(function () {
  // Check if we need to login at all
  $.ajax({
    url: "/api/auth",
  }).done(function (data) {
    if (data.session.valid === true) redirect();
    if (data.session.totp === true) $("#totp_input").removeClass("hidden");
    if (data.dns === false) showDNSfailure();
  });

  // Clear TOTP field
  $("#totp").val("");

  // Generate HTTPS redirection link (only used if not already HTTPS)
  if (location.protocol !== "https:") {
    const url = "https:" + location.href.substring(location.protocol.length);
    $("#https-link").attr("href", url);
  }
});
