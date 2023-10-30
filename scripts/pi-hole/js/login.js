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
    dataType: "json",
    processData: false,
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

  doLogin($("#current-password").val());
});

// Trigger keyup event when pasting into the TOTP code input field
$("#totp").on("paste", function (e) {
  $(e.target).keyup();
});

// Submit form when TOTP code is entered and password is already filled
$("#totp").on("keyup", function () {
  const code = $(this).val();
  const password = $("#current-password").val();
  if (code.length === 6 && password.length > 0) {
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

const passwordInput = document.getElementById("current-password");
const togglePasswordButton = document.getElementById("toggle-password");
togglePasswordButton.addEventListener("click", togglePassword);
function togglePassword() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePasswordButton.textContent = "Hide password";
    togglePasswordButton.setAttribute("title", "Hide password");
  } else {
    passwordInput.type = "password";
    togglePasswordButton.textContent = "Show password";
    togglePasswordButton.setAttribute(
      "title",
      "Show password as plain text. Warning: this will display your password on the screen"
    );
  }
}
