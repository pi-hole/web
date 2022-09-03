/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

function eventsource() {
  var ta = $("#output");
  var upload = $("#upload");
  var dbcheck = $("#dbcheck");
  var checked = "";
  var token = encodeURIComponent($("#token").text());

  if (upload.prop("checked")) {
    // add upload option
    checked += "&upload";
  }

  if (dbcheck.prop("checked")) {
    // add db integrity check option
    checked += "&dbcheck";
  }

  // IE does not support EventSource - load whole content at once
  if (typeof EventSource !== "function") {
    $.ajax({
      method: "GET",
      url: "scripts/pi-hole/php/debug.php?IE&token=" + token + checked,
      async: false,
    }).done(function (data) {
      ta.show();
      ta.empty();
      ta.append(data);
    });
    return;
  }

  var source = new EventSource("scripts/pi-hole/php/debug.php?&token=" + token + checked);

  // Reset and show field
  ta.empty();
  ta.show();

  source.addEventListener(
    "message",
    function (e) {
      ta.append(e.data);
      // scroll to the bottom of #output (most recent data)
      var taBottom = ta.offset().top + ta.outerHeight(true);
      $("html, body").scrollTop(taBottom - $(window).height());
    },
    false
  );

  // Will be called when script has finished
  source.addEventListener(
    "error",
    function () {
      source.close();
      $("#output").removeClass("loading");
    },
    false
  );
}

$("#debugBtn").on("click", function () {
  $("#debugBtn").prop("disabled", true);
  $("#upload").prop("disabled", true);
  $("#dbcheck").prop("disabled", true);
  $("#output").addClass("loading");
  eventsource();
});
