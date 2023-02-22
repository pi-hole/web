/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

var exact = "";
var showAll = "";

function eventsource() {
  var ta = $("#output");
  // process with the current visible domain input field
  var domain = $("input[id^='domain']:visible").val().trim().toLowerCase();
  var unlimited = $("#show-all").is(":checked");

  if (domain.length === 0) {
    return;
  }

  if (unlimited === true) {
    showAll = "&showall";
  }

  var queryURL = "scripts/pi-hole/php/queryads.php?domain=" + domain + exact + showAll;

  // IE does not support EventSource - load whole content at once
  if (typeof EventSource !== "function") {
    $.ajax({
      method: "GET",
      url: queryURL + "&IE",
      async: false,
    }).done(function (data) {
      ta.show();
      ta.empty();
      ta.append(data);
    });
    return;
  }

  var source = new EventSource(queryURL);

  // Reset and show field
  ta.empty();
  ta.show();

  source.addEventListener(
    "message",
    function (e) {
      ta.append(e.data);
    },
    false
  );

  // Will be called when script has finished
  source.addEventListener(
    "error",
    function () {
      source.close();
    },
    false
  );

  // Reset option variables
  exact = "";
  showAll = "";
}

// Handle enter key
$("#domain").on("keypress", function (e) {
  if (e.which === 13) {
    // Enter was pressed, and the input has focus
    exact = "";
    eventsource();
  }
});

// Handle search buttons
$("button[id^='btnSearch']").on("click", function () {
  exact = "";

  if (this.id.match("^btnSearchExact")) {
    exact = "&exact";
  }

  eventsource();
});
