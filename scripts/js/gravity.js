/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

"use strict";

function eventsource() {
  const alInfo = $("#alInfo");
  const alSuccess = $("#alSuccess");
  const ta = $("#output");

  ta.html("");
  ta.show();
  alInfo.show();
  alSuccess.hide();

  fetch(document.body.dataset.apiurl + "/action/gravity", {
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
              const string = new TextDecoder().decode(value);
              parseLines(ta, string);

              if (string.includes("Done.")) {
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

$("#gravityBtn").on("click", () => {
  $("#gravityBtn").prop("disabled", true);
  eventsource();
});

// Handle hiding of alerts
$(() => {
  $("[data-hide]").on("click", function () {
    $(this)
      .closest("." + $(this).attr("data-hide"))
      .hide();
  });
});

function parseLines(ta, str) {
  // str can contain multiple lines.
  // We want to split the text before an "OVER" escape sequence to allow overwriting previous line when needed

  // Splitting the text on "\r"
  const lines = str.split(/(?=\r)/g);

  for (let line of lines) {
    if (line[0] === "\r") {
      // This line starts with the "OVER" sequence. Replace them with "\n" before print
      line = line.replaceAll("\r[K", "\n").replaceAll("\r", "\n");

      // Last line from the textarea will be overwritten, so we remove it
      ta.html(ta.html().substring(0, ta.html().lastIndexOf("\n")));
    }

    // Track the number of opening spans
    let spanCount = 0;

    // Mapping of ANSI escape codes to their corresponding CSS class names.
    const ansiMappings = {
      "\u001B[1m": "text-bold", //COL_BOLD
      "\u001B[90m": "log-gray", //COL_GRAY
      "\u001B[91m": "log-red", //COL_RED
      "\u001B[32m": "log-green", //COL_GREEN
      "\u001B[33m": "log-yellow", //COL_YELLOW
      "\u001B[94m": "log-blue", //COL_BLUE
      "\u001B[95m": "log-purple", //COL_PURPLE
      "\u001B[96m": "log-cyan", //COL_CYAN
    };

    // Create a regex that matches all ANSI codes (including reset)
    /* eslint-disable-next-line no-control-regex */
    const ansiRegex = /(\u001B\[(?:1|90|91|32|33|94|95|96|0)m)/g;

    // Process the line sequentially, replacing ANSI codes with their corresponding HTML spans
    // we use a counter to keep track of how many spans are open and close the correct number of spans when we encounter a reset code
    /* eslint-disable-next-line unicorn/prefer-string-replace-all */
    line = line.replace(ansiRegex, match => {
      if (match === "\u001B[0m") {
        // Reset/close all open spans
        const closingTags = "</span>".repeat(spanCount);
        spanCount = 0;
        return closingTags;
      }

      if (ansiMappings[match]) {
        // Opening span
        spanCount++;
        return `<span class="${ansiMappings[match]}">`;
      }

      return match; // Return unchanged if not recognized
    });

    // Append the new text to the end of the output
    ta.append(line);
  }
}
