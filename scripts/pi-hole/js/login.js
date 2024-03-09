/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, NProgress:false */

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

function wrongPassword(isError = false, isSuccess = false, data = null) {
  if (isError) {
    let isErrorResponse = false,
      isInvalidTOTP = false;

    // Reset hint and error message
    $("#error-message").text("");
    $("#error-hint").hide();
    $("#error-hint").text("");
    if (data !== null && "error" in data.responseJSON && "message" in data.responseJSON.error) {
      // This is an error, highlight both the password and the TOTP field
      isErrorResponse = true;
      // Check if the error is caused by an invalid TOTP token
      isInvalidTOTP = data.responseJSON.error.message === "Invalid 2FA token";
      $("#error-message").text(data.responseJSON.error.message);
      if ("hint" in data.responseJSON.error && data.responseJSON.error.hint !== null) {
        $("#error-hint").text(data.responseJSON.error.hint);
        $("#error-hint").show();
      }
    } else {
      $("#error-message").text("Wrong password!");
    }

    $("#error-label").show();

    // Always highlight the TOTP field on error
    if (isErrorResponse) $("#totp_input").addClass("has-error");

    // Only show the invalid 2FA box if the error is caused by an invalid TOTP
    // token
    if (isInvalidTOTP) $("#invalid2fa-box").removeClass("hidden");

    // Only highlight the password field if the error is NOT caused by an
    // invalid TOTP token
    if (!isInvalidTOTP) $("#pw-field").addClass("has-error");

    // Only show the forgot password box if the error is NOT caused by an
    // invalid TOTP token and this is no error response (= password is wrong)
    if (!isErrorResponse && !isInvalidTOTP) {
      $("#forgot-pw-box")
        .removeClass("box-info")
        .removeClass("collapsed-box")
        .addClass("box-danger");
      $("#forgot-pw-box .box-body").show();
      $("#forgot-pw-toggle-icon").removeClass("fa-plus").addClass("fa-minus");
    }

    return;
  } else if (isSuccess) {
    $("#pw-field").addClass("has-success");
    $("#totp_input").addClass("has-success");
  } else {
    $("#pw-field").removeClass("has-error");
    $("#totp_input").removeClass("has-error");
    $("#error-label").hide();
  }

  $("#invalid2fa-box").addClass("hidden");
  $("#forgot-pw-box").addClass("box-info").addClass("collapsed-box").removeClass("box-danger");
  $("#forgot-pw-box .box-body").hide();
  $("#forgot-pw-toggle-icon").removeClass("fa-minus").addClass("fa-plus");
}

function doLogin(password) {
  wrongPassword(false, false, null);
  NProgress.start();
  utils.disableAll();
  $.ajax({
    url: "/api/auth",
    method: "POST",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ password: password, totp: parseInt($("#totp").val(), 10) }),
  })
    .done(function (data) {
      wrongPassword(false, true, data);
      NProgress.done();
      redirect();
    })
    .fail(function (data) {
      wrongPassword(true, false, data);
      NProgress.done();
      utils.enableAll();
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

  doLogin($("#current-password").val());
});

// Submit form when TOTP code is entered and password is already filled
$("#totp").on("input", function () {
  const code = $(this).val();
  const password = $("#current-password").val();
  if (code.length === 6 && password.length > 0) {
    $("#loginform").submit();
  }
});

// Toggle password visibility button
$("#toggle-password").on("click", function () {
  // Toggle font-awesome classes to change the svg icon on the button
  $("svg", this).toggleClass("fa-eye fa-eye-slash");

  // Password field
  var $pwd = $("#current-password");
  if ($pwd.attr("type") === "password") {
    $pwd.attr("type", "text");
    $pwd.attr("title", "Hide password");
  } else {
    $pwd.attr("type", "password");
    $pwd.attr(
      "title",
      "Show password as plain text. Warning: this will display your password on the screen"
    );
  }

  // move the focus to password field after the click
  $pwd.trigger("focus");
});

function showDNSfailure() {
  $("#dns-failure-label").show();
  $("#login-box").addClass("error-box");
}

$(function () {
  // Check if we need to login at all
  $.ajax({
    url: "/api/auth",
  })
    .done(function (data) {
      // If we are already logged in, redirect to dashboard
      if (data.session.valid === true) redirect();
    })
    .fail(function (xhr) {
      const session = xhr.responseJSON.session;
      // If TOPT is enabled, show the input field and add the required attribute
      if (session.totp === true) {
        $("#totp_input").removeClass("hidden");
        $("#totp").attr("required", "required");
        $("#totp-forgotten-title").removeClass("hidden");
        $("#totp-forgotten-body").removeClass("hidden");
      }
    });

  // Get information about HTTPS port and DNS status
  $.ajax({
    url: "/api/info/login",
  }).done(function (data) {
    if (data.dns === false) showDNSfailure();

    // Generate HTTPS redirection link (only used if not already HTTPS)
    if (location.protocol !== "https:" && data.https_port !== 0) {
      let url = "https://" + location.hostname;
      if (data.https_port !== 443) url += ":" + data.https_port;
      url += location.pathname + location.search + location.hash;

      $("#https-link").attr("href", url);
      $("#insecure-box").show();
    }
  });

  // Clear TOTP field
  $("#totp").val("");
});
