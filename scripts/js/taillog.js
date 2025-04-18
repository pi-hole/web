/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment: false, utils: false, REFRESH_INTERVAL: false */

"use strict";

let nextID = 0;
let lastPID = -1;

// Maximum number of lines to display
const maxlines = 5000;

// Fade in new lines
const fadeIn = true;

// Mark new lines with a red line above them
const markUpdates = true;

// Format a line of the dnsmasq log
function formatDnsmasq(line) {
  // Remove dnsmasq + PID
  let txt = line.replaceAll(/ dnsmasq\[\d*]/g, "");

  if (line.includes("denied") || line.includes("gravity blocked")) {
    // Red bold text for blocked domains
    txt = `<strong class="log-red">${txt}</strong>`;
  } else if (line.includes("query[A") || line.includes("query[DHCP")) {
    // Bold text for initial query lines
    txt = `<strong>${txt}</strong>`;
  } else {
    // Grey text for all other lines
    txt = `<span class="text-muted">${txt}</span>`;
  }

  return txt;
}

function formatFTL(line, priority) {
  // Colorize priority
  let priorityClass = "";
  switch (priority) {
    case "INFO": {
      priorityClass = "text-success";
      break;
    }

    case "WARNING": {
      priorityClass = "text-warning";
      break;
    }

    case "ERR":
    case "ERROR":
    case "EMERG":
    case "ALERT":
    case "CRIT": {
      priorityClass = "text-danger";
      break;
    }

    default:
      priorityClass = priority.startsWith("DEBUG") ? "text-info" : "text-muted";
  }

  // Return formatted line
  return `<span class="${priorityClass}">${utils.escapeHtml(priority)}</span> ${line}`;
}

let gAutoScrolling;

// Function that asks the API for new data
function getData() {
  // Only update when the feed icon has the fa-play class
  const feedIcon = document.getElementById("feed-icon");
  if (!feedIcon.classList.contains("fa-play")) {
    utils.setTimer(getData, REFRESH_INTERVAL.logs);
    return;
  }

  const queryParams = utils.parseQueryString();
  const outputElement = document.getElementById("output");
  const allowedFileParams = ["dnsmasq", "ftl", "webserver"];

  // Check if file parameter exists
  if (!Object.hasOwn(queryParams, "file")) {
    // Add default file parameter and redirect
    const url = new URL(globalThis.location.href);
    url.searchParams.set("file", "dnsmasq");
    globalThis.location.href = url.toString();
    return;
  }

  // Validate that file parameter is one of the allowed values
  if (!allowedFileParams.includes(queryParams.file)) {
    const errorMessage = `Invalid file parameter: ${queryParams.file}. Allowed values are: ${allowedFileParams.join(", ")}`;
    outputElement.innerHTML = `<div><em class="text-danger">*** Error: ${errorMessage} ***</em></div>`;
    return;
  }

  const url = `${document.body.dataset.apiurl}/logs/${queryParams.file}?nextID=${nextID}`;

  utils
    .fetchFactory(url)
    .then(data => {
      // Set filename
      document.getElementById("filename").textContent = data.file;

      // Check if we have a new PID -> FTL was restarted
      if (lastPID !== data.pid) {
        if (lastPID !== -1) {
          outputElement.innerHTML +=
            '<div><em class="text-danger">*** FTL restarted ***</em></div>';
        }

        // Remember PID
        lastPID = data.pid;
        // Reset nextID
        nextID = 0;

        getData();
        return;
      }

      // Set placeholder text if log file is empty and we have no new lines
      if (data.log.length === 0) {
        if (nextID === 0) {
          outputElement.innerHTML = "<div><em>*** Log file is empty ***</em></div>";
        }

        utils.setTimer(getData, REFRESH_INTERVAL.logs);
        return;
      }

      // Create a document fragment to batch the DOM updates
      const fragment = document.createDocumentFragment();

      // We have new lines
      if (markUpdates && nextID > 0) {
        // Add red fading out background to new lines
        const hr = document.createElement("hr");
        hr.className = "hr-small fade-2s";
        fragment.append(hr);
      }

      // Limit output to <maxlines> lines
      // Check if adding these new lines would exceed maxlines
      const totalAfterAdding =
        outputElement.children.length + data.log.length + (markUpdates && nextID > 0 ? 1 : 0);

      // If we'll exceed maxlines, remove old elements first
      if (totalAfterAdding > maxlines) {
        const elementsToRemove = totalAfterAdding - maxlines;
        const elements = [...outputElement.children];
        const elementsToKeep = elements.slice(elementsToRemove);
        outputElement.replaceChildren(...elementsToKeep);
      }

      for (const line of data.log) {
        // Escape HTML
        line.message = utils.escapeHtml(line.message);

        // Format line if applicable
        if (queryParams.file === "dnsmasq") {
          line.message = formatDnsmasq(line.message);
        } else if (queryParams.file === "ftl") {
          line.message = formatFTL(line.message, line.prio);
        }

        // Create and add new log entry to fragment
        const logEntry = document.createElement("div");
        const logEntryDate = moment(1000 * line.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS");
        logEntry.className = `log-entry${fadeIn ? " hidden-entry" : ""}`;
        logEntry.innerHTML = `<span class="text-muted">${logEntryDate}</span> ${line.message}`;

        fragment.append(logEntry);
      }

      // Append all new elements at once
      outputElement.append(fragment);

      if (fadeIn) {
        // Fade in the new log entries
        const newEntries = outputElement.querySelectorAll(".hidden-entry");

        for (const entry of newEntries) {
          entry.classList.add("fade-in-transition");
        }

        // Force a reflow once before changing opacity
        void outputElement.offsetWidth; // eslint-disable-line no-void

        requestAnimationFrame(() => {
          for (const entry of newEntries) {
            entry.classList.remove("hidden-entry");
            entry.style.opacity = 1;
          }
        });

        // Clean up after animation completes
        setTimeout(() => {
          for (const entry of newEntries) {
            entry.classList.remove("fade-in-transition");
          }
        }, 200);
      }

      // Scroll to bottom of output if we are already at the bottom
      if (gAutoScrolling) {
        // Auto-scrolling is enabled
        requestAnimationFrame(() => {
          outputElement.scrollTop = outputElement.scrollHeight;
        });
      }

      // Update nextID
      nextID = data.nextID;

      utils.setTimer(getData, REFRESH_INTERVAL.logs);
    })
    .catch(() => {
      utils.setTimer(getData, 5 * REFRESH_INTERVAL.logs);
    });
}

gAutoScrolling = true;
document.getElementById("output").addEventListener(
  "scroll",
  event => {
    const output = event.currentTarget;

    // Check if we are at the bottom of the output
    //
    // - output.scrollHeight: This gets the entire height of the content
    //   of the "output" element, including the part that is not visible due to
    //   scrolling.
    // - output.clientHeight: This gets the inner height of the "output"
    //   element, which is the visible part of the content.
    // - output.scrollTop: This gets the number of pixels that the content
    //   of the "output" element is scrolled vertically from the top.
    //
    // By subtracting the inner height and the scroll top from the scroll height,
    // you get the distance from the bottom of the scrollable area.

    const { scrollHeight, clientHeight, scrollTop } = output;
    // Add a tolerance of four line heights
    const tolerance = 4 * Number.parseFloat(getComputedStyle(output).lineHeight);

    // Determine if the output is scrolled to the bottom within the tolerance
    const isAtBottom = scrollHeight - clientHeight - scrollTop <= tolerance;
    gAutoScrolling = isAtBottom;

    const autoScrollingElement = document.getElementById("autoscrolling");
    if (isAtBottom) {
      autoScrollingElement.classList.add("fa-check");
      autoScrollingElement.classList.remove("fa-xmark");
    } else {
      autoScrollingElement.classList.add("fa-xmark");
      autoScrollingElement.classList.remove("fa-check");
    }
  },
  { passive: true }
);

document.addEventListener("DOMContentLoaded", () => {
  getData();

  const liveFeed = document.getElementById("live-feed");
  const feedIcon = document.getElementById("feed-icon");
  const title = document.getElementById("title");

  // Clicking on the element with ID "live-feed" will toggle the play/pause state
  liveFeed.addEventListener("click", event => {
    // Determine current state based on whether feedIcon has the "fa-play" class
    const isPlaying = feedIcon.classList.contains("fa-play");

    if (isPlaying) {
      feedIcon.classList.add("fa-pause");
      feedIcon.classList.remove("fa-fade", "fa-play");
      event.currentTarget.classList.add("btn-danger");
      event.currentTarget.classList.remove("btn-success");
      title.textContent = "Paused";
    } else {
      feedIcon.classList.add("fa-play", "fa-fade");
      event.currentTarget.classList.add("btn-success");
      event.currentTarget.classList.remove("btn-danger");
      title.textContent = "Live";
    }
  });
});
