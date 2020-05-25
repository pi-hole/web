/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2020 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

function testCookies() {
  if (navigator.cookieEnabled) {
    return true;
  }

  // set and read cookie
  document.cookie = "cookietest=1";
  var ret = document.cookie.indexOf("cookietest=") !== -1;

  // delete cookie
  document.cookie = "cookietest=1; expires=Thu, 01-Jan-1970 00:00:01 GMT";

  return ret;
}

// Handle Strg + Enter button on Login page
$(document).keypress(function (e) {
  if ((e.keyCode === 10 || e.keyCode === 13) && e.ctrlKey && $("#loginpw").is(":focus")) {
    e.preventDefault();
    var form = $("#loginform");
    form.attr("action", "settings.php");
    form.submit();
  }
});

$(function () {
  if (!testCookies() && $("#cookieInfo").length > 0) {
    $("#cookieInfo").show();
  }
});
