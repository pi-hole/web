/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global apiFailure:false, utils:false */

"use strict";

function eventsource() {
  const $alertInfo = $("#alertInfo");
  const $alertSuccess = $("#alertSuccess");
  const outputElement = document.getElementById("output");
  const gravityBtn = document.getElementById("gravityBtn");
  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
  const url = `${document.body.dataset.apiurl}/action/gravity?color=true`;

  if (outputElement.innerHTML.length > 0) {
    outputElement.innerHTML = "";
  }

  if (!outputElement.classList.contains("d-none")) {
    outputElement.classList.add("d-none");
  }

  $alertSuccess.hide();
  $alertInfo.show();

  fetch(url, {
    method: "POST",
    headers: { "X-CSRF-TOKEN": csrfToken },
  })
    .then(response => (response.ok ? response : apiFailure(response)))
    // Retrieve the response as ReadableStream
    .then(response => {
      return handleResponseStream({
        response,
        outputElement,
        alertInfo: $alertInfo,
        gravityBtn,
        alertSuccess: $alertSuccess,
      });
    })
    .catch(error => console.error(error)); // eslint-disable-line no-console
}

function handleResponseStream({ response, outputElement, alertInfo, gravityBtn, alertSuccess }) {
  outputElement.classList.remove("d-none");

  const reader = response.body.getReader();

  function pump(controller) {
    return reader.read().then(({ done, value }) => {
      // When no more data needs to be consumed, close the stream
      if (done) {
        controller.close();
        alertInfo.hide();
        gravityBtn.removeAttribute("disabled");
        return;
      }

      // Enqueue the next data chunk into our target stream
      controller.enqueue(value);
      const text = new TextDecoder().decode(value);
      parseLines(outputElement, text);

      if (text.includes("Done.")) {
        alertSuccess.show();
      }

      return pump(controller);
    });
  }

  return new ReadableStream({
    start(controller) {
      return pump(controller);
    },
  });
}

function parseLines(outputElement, text) {
  // text can contain multiple lines.
  // We want to split the text before an "OVER" escape sequence to allow overwriting previous line when needed

  // Splitting the text on "\r"
  const lines = text.split(/(?=\r)/g);

  for (let line of lines) {
    // Escape HTML to prevent XSS attacks (both in adlist URL and non-domain entries)
    line = utils.escapeHtml(line);
    if (line[0] === "\r") {
      // This line starts with the "OVER" sequence. Replace them with "\n" before print
      line = line.replaceAll("\r\u001B[K", "\n").replaceAll("\r", "\n");

      // Last line from the textarea will be overwritten, so we remove it
      const lastLineIndex = outputElement.innerHTML.lastIndexOf("\n");
      outputElement.innerHTML = outputElement.innerHTML.substring(0, lastLineIndex);
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
    outputElement.innerHTML += line;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const gravityBtn = document.getElementById("gravityBtn");

  gravityBtn.addEventListener("click", () => {
    gravityBtn.disabled = true;
    eventsource();
  });

  // Handle hiding of alerts
  const dataHideElements = document.querySelectorAll("[data-hide]");
  for (const element of dataHideElements) {
    element.addEventListener("click", () => {
      const hideClass = element.dataset.hide;
      const closestElement = element.closest(`.${hideClass}`);
      if (closestElement) $(closestElement).hide();
    });
  }
});
