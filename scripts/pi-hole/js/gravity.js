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

  // https://caniuse.com/fetch - everything except IE
  // This is fine, as we dropped support for IE a while ago
  if (typeof fetch !== "function") {
    ta.show();
    ta.html("Updating lists of ad-serving domains is not supported with this browser!");
    return;
  }

  ta.html("");
  ta.show();
  alInfo.show();
  alSuccess.hide();

  // eslint-disable-next-line compat/compat
  fetch("/api/action/gravity", {
    method: "POST",
    headers: { "X-CSRF-TOKEN": $('meta[name="csrf-token"]').attr("content") },
  })
    // Retrieve its body as ReadableStream
    .then(response => {
      const reader = response.body.getReader();
      return new ReadableStream({
        start(controller) {
          return pump();
          function pump() {
            return reader.read().then(({ done, value }) => {
              // When no more data needs to be consumed, close the stream
              if (done) {
                controller.close();
                alInfo.hide();
                $("#gravityBtn").prop("disabled", false);
                return;
              }

              // Enqueue the next data chunk into our target stream
              controller.enqueue(value);
              var string = new TextDecoder().decode(value);

              // If a Carriage Return is found ...
              if (string.indexOf("\r") === -1) {
                ta.append(string);
              } else {
                // ... remove the last line from the output ...
                ta.text(ta.text().substring(0, ta.text().lastIndexOf("\n")) + "\n");
                // ... and append the new text to the end of the output,
                // without ${OVER} ("CR + ESC[K") or Carriage Return.
                ta.append(string.replaceAll("\r[K", "").replaceAll("\r", ""));
              }

              if (string.indexOf("Pi-hole blocking is") !== -1) {
                alSuccess.show();
              }

              return pump();
            });
          }
        },
      });
    })
    .catch(error => console.error(error)); // eslint-disable-line no-console
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
  // gravity.lp?go
  var searchString = window.location.search.substring(1);
  if (searchString.indexOf("go") !== -1) {
    $("#gravityBtn").prop("disabled", true);
    eventsource();
  }
});
