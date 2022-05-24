/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

function eventsource() {
  var alInfo = $("#alInfo");
  var alSuccess = $("#alSuccess");
  var ta = $("#output");

  // IE does not support EventSource - exit early
  if (typeof EventSource !== "function") {
    ta.show();
    ta.html("Updating lists of ad-serving domains is not supported with this browser!");
    return;
  }

  var source = new EventSource("scripts/pi-hole/php/gravity.sh.php");

  ta.html("");
  ta.show();
  alInfo.show();
  alSuccess.hide();

  source.addEventListener(
    "message",
    function (e) {
      if (e.data.indexOf("Pi-hole blocking is") !== -1) {
        alSuccess.show();
      }

      // Detect ${OVER}
      var newString = "<------";

      if (e.data.indexOf(newString) !== -1) {
        ta.text(ta.text().substring(0, ta.text().lastIndexOf("\n")) + "\n");
        ta.append(e.data.replace(newString, ""));
      } else {
        ta.append(e.data);
      }
    },
    false
  );

  // Will be called when script has finished
  source.addEventListener(
    "error",
    function () {
      alInfo.delay(1000).fadeOut(2000, function () {
        alInfo.hide();
      });
      source.close();
      $("#gravityBtn").prop("disabled", false);
    },
    false
  );
}

$("#gravityBtn").on("click", function () {
  $("#gravityBtn").prop("disabled", true);
  eventsource();
});

// Handle hiding of alerts
$(function () {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });

  // Do we want to start updating immediately?
  // gravity.php?go
  var searchString = window.location.search.substring(1);
  if (searchString.indexOf("go") !== -1) {
    $("#gravityBtn").prop("disabled", true);
    eventsource();
  }
});
