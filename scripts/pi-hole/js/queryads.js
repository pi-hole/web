/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global ActiveXObject: false */

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

// Credit: http://stackoverflow.com/a/10642418/2087442
function httpGet(ta, quiet, theUrl) {
  var xmlhttp;
  if (window.XMLHttpRequest) {
    // code for IE7+
    xmlhttp = new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      ta.show();
      ta.empty();
      if (!quiet) {
        ta.append(xmlhttp.responseText);
      } else {
        quietfilter(ta, xmlhttp.responseText);
      }
    }
  };

  xmlhttp.open("GET", theUrl, false);
  xmlhttp.send();
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
    httpGet(
      ta,
      quiet,
      "scripts/pi-hole/php/queryads.php?domain=" + domain.toLowerCase() + "&" + exact + "&IE"
    );
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
$("#domain_1, #domain_2").keypress(function (e) {
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
