/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

var exact = "";

function quietfilter(ta, data) {
  var lines = data.split("\n");
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf("results") !== -1 && lines[i].indexOf("0 results") === -1) {
      var shortstring = lines[i].replace("::: /etc/pihole/", "");
      // Remove "(x results)"
      shortstring = shortstring.replace(/\(.*/, "");
      ta.append(shortstring + "\n");
    }
  }
}

function eventsource() {
  var ta = $("#output");
  // process with the current visible domain input field
  var domain = $("input[id^='domain']:visible").val().trim();
  var q = $("#quiet");

  if (domain.length === 0) {
    return;
  }

  var quiet = false;
  if (q.val() === "yes") {
    quiet = true;
    exact = "exact";
  }

  // IE does not support EventSource - load whole content at once
  if (typeof EventSource !== "function") {
    $.ajax({
      method: "GET",
      url: "scripts/pi-hole/php/queryads.php?domain=" + domain.toLowerCase() + "&" + exact + "&IE",
      async: false,
    }).done(function (data) {
      ta.show();
      ta.empty();
      if (!quiet) {
        ta.append(data);
      } else {
        quietfilter(ta, data);
      }
    });
    return;
  }

  var source = new EventSource(
    "scripts/pi-hole/php/queryads.php?domain=" + domain.toLowerCase() + "&" + exact
  );

  // Reset and show field
  ta.empty();
  ta.show();

  source.addEventListener(
    "message",
    function (e) {
      if (!quiet) {
        ta.append(e.data);
      } else {
        quietfilter(ta, e.data);
      }
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

  // Reset exact variable
  exact = "";
}

// Handle enter key
$("#domain").keypress(function (e) {
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
    exact = "exact";
  }

  eventsource();
});
