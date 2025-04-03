/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, NProgress:false */

"use strict";

globalThis._isLoginPage = true;

function redirect() {
  // Login succeeded or not needed (empty password)
  // Default: Send back to dashboard
  let target = ".";

  // If DNS failure: send to Pi-hole diagnosis messages page
  if ($("#dns-failure-label").is(":visible")) {
    target = "messages";
  }

  // Redirect to target
  globalThis.location.replace(target);
}

function wrongPassword(isError = false, isSuccess = false, data = null) {
  if (isError) {
    let isErrorResponse = false;
    let isInvalidTOTP = false;

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
      const forgotPwBox = document.getElementById("forgot-pw-box");
      forgotPwBox.classList.replace("box-info", "box-danger");
      utils.toggleBoxCollapse(forgotPwBox, true);
    }

    return;
  }

  if (isSuccess) {
    $("#pw-field").addClass("has-success");
    $("#totp_input").addClass("has-success");
  } else {
    $("#pw-field").removeClass("has-error");
    $("#totp_input").removeClass("has-error");
    $("#error-label").hide();
  }

  $("#invalid2fa-box").addClass("hidden");
  const forgotPwBox = document.getElementById("forgot-pw-box");
  forgotPwBox.classList.replace("box-danger", "box-info");
  utils.toggleBoxCollapse(forgotPwBox, false);
}

function doLogin(password) {
  wrongPassword(false, false, null);
  NProgress.start();
  utils.disableAll();
  $.ajax({
    url: `${document.body.dataset.apiurl}/auth`,
    method: "POST",
    dataType: "json",
    processData: false,
    contentType: "application/json; charset=utf-8",
    data: JSON.stringify({ password, totp: Number.parseInt($("#totp").val(), 10) }),
  })
    .done(data => {
      wrongPassword(false, true, data);
      NProgress.done();
      redirect();
    })
    .fail(data => {
      wrongPassword(true, false, data);
      NProgress.done();
      utils.enableAll();
    });
}

$("#loginform").on("submit", event => {
  // Cancel the native submit event (prevent the form from being
  // submitted) because we want to do a two-step challenge-response login
  event.preventDefault();

  doLogin($("#current-password").val());
});

// Submit form when TOTP code is entered and password is already filled
$("#totp").on("input", function () {
  const code = $(this).val();
  const password = $("#current-password").val();
  if (code.length === 6 && password.length > 0) {
    $("#loginform").trigger("submit");
  }
});

// Toggle password visibility button
$("#toggle-password").on("click", function () {
  // Toggle font-awesome classes to change the svg icon on the button
  $(".field-icon", this).toggleClass("fa-eye fa-eye-slash");

  // Password field
  const $pwd = $("#current-password");
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

$(() => {
  // Check if we need to login at all
  $.ajax({
    url: `${document.body.dataset.apiurl}/auth`,
  })
    .done(data => {
      // If we are already logged in, redirect to dashboard
      if (data.session.valid === true) redirect();
    })
    .fail(xhr => {
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
    url: `${document.body.dataset.apiurl}/info/login`,
  }).done(data => {
    if (data.dns === false) showDNSfailure();

    // Generate HTTPS redirection link (only used if not already HTTPS)
    if (location.protocol !== "https:" && data.https_port !== 0) {
      let url = `https://${location.hostname}`;
      if (data.https_port !== 443) url += `:${data.https_port}`;
      url += location.pathname + location.search + location.hash;

      $("#https-link").attr("href", url);
      $("#insecure-box").show();
    }
  });

  // Clear TOTP field
  $("#totp").val("");
});
