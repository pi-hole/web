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
              parseLines(ta, string);

              if (string.indexOf("Done.") !== -1) {
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
  var searchString = globalThis.location.search.substring(1);
  if (searchString.indexOf("go") !== -1) {
    $("#gravityBtn").prop("disabled", true);
    eventsource();
  }
});

function parseLines(ta, str) {
  // str can contain multiple lines.
  // We want to split the text before an "OVER" escape sequence to allow overwriting previous line when needed

  // Splitting the text on "\r"
  var lines = str.split(/(?=\r)/g);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].search(/\[[\d;]+m/) !== -1) {
      // This line contains a color escape sequence - replace
      lines[i] = lines[i]
        .replaceAll(/\[(\d;)?[39]0m/g, "<span class=\"log-gray\">")
        .replaceAll(/\[(\d;)?[39]1m/g, "<span class=\"log-red\">")
        .replaceAll(/\[(\d;)?[39]2m/g, "<span class=\"log-green\">")
        .replaceAll(/\[(\d;)?[39]3m/g, "<span class=\"log-yellow\">")
        .replaceAll(/\[(\d;)?[39]4m/g, "<span class=\"log-blue\">")
        .replaceAll(/\[(\d;)?[39]5m/g, "<span class=\"log-purple\">")
        .replaceAll(/\[(\d;)?[39]6m/g, "<span class=\"log-cyan\">")
        .replaceAll("[0m", "</span>")
        .replaceAll("[1m", "<span class=\"text-bold\">")
        .replaceAll("[4m", "<span class=\"text-underline\">");
    }
    if (lines[i][0] === "\r") {
      // This line starts with the "OVER" sequence. Replace them with "\n" before print
      lines[i] = lines[i].replaceAll("\r[K", "\n").replaceAll("\r", "\n");

      // Last line from the textarea will be overwritten, so we remove it
      ta.html(ta.html().substring(0, ta.html().lastIndexOf("\n")));
    }

    // Append the new text to the end of the output
    ta.append(lines[i]);
  }
}
