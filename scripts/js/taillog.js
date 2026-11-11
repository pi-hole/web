/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment: false, apiFailure: false, utils: false, REFRESH_INTERVAL: false */

"use strict";

let nextID = 0;
let lastPID = -1;
let exportAbortController = null;

// Maximum number of lines to display
const maxlines = 5000;

// Fade in new lines
const fadeIn = true;

// Mark new lines with a red line above them
const markUpdates = true;

// Format a line of the dnsmasq log
function formatDnsmasq(line) {
  // Remove dnsmasq + PID
  let txt = line.replaceAll(/ dnsmasq\[\d*\]/gu, "");

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

function escapeCSV(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (text.includes(",") || text.includes('"') || text.includes("\n") || text.includes("\r")) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function getExportColumns() {
  const columns = {
    timestamp: {
      header: "timestamp",
      value: query => moment.unix(query.time).format("YYYY-MM-DD HH:mm:ss.SSS"),
    },
    domain: {
      header: "domain",
      value: query => query.domain,
    },
    type: {
      header: "type",
      value: query => query.type,
    },
    status: {
      header: "status",
      value: query => query.status,
    },
    client_ip: {
      header: "client_ip",
      value: query => query.client?.ip,
    },
    client_name: {
      header: "client_name",
      value: query => query.client?.name,
    },
    reply: {
      header: "reply",
      value: query => query.reply?.type,
    },
    reply_time: {
      header: "reply_time",
      value: query => query.reply?.time,
    },
    dnssec: {
      header: "dnssec",
      value: query => query.dnssec,
    },
    upstream: {
      header: "upstream",
      value: query => query.upstream,
    },
  };

  const selectedColumns = [];

  for (const checkbox of document.querySelectorAll(".export-column:checked")) {
    if (Object.hasOwn(columns, checkbox.value)) {
      selectedColumns.push(columns[checkbox.value]);
    }
  }

  return selectedColumns;
}

function removeDuplicateQueries(queries) {
  const latestQueries = new Map();

  for (const query of queries) {
    const key = `${query.domain}\u{0}${query.type}`;
    const current = latestQueries.get(key);

    if (!current || query.time > current.time) {
      latestQueries.set(key, query);
    }
  }

  return latestQueries
    .values()
    .toArray()
    .toSorted((a, b) => b.time - a.time);
}

function showExportError(message) {
  const errorElement = document.getElementById("export-error");

  errorElement.textContent = message;
  errorElement.classList.remove("d-none");
}

function clearExportError() {
  const errorElement = document.getElementById("export-error");

  errorElement.textContent = "";
  errorElement.classList.add("d-none");
}

function formatDateTimeLocal(date) {
  return moment(date).format("YYYY-MM-DDTHH:mm");
}

function setDefaultExportDateRange() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  document.getElementById("export-from").value = formatDateTimeLocal(oneDayAgo);
  document.getElementById("export-until").value = formatDateTimeLocal(now);
}

function initializeDateTimePicker(event) {
  const input = event.currentTarget;

  input.dataset.previousValue = input.value;
  input.dataset.hourChanged = "false";
  input.dataset.minuteChanged = "false";
}

function closeDateTimePicker(event) {
  const input = event.currentTarget;

  if (!input.value) {
    input.dataset.previousValue = "";
    return;
  }

  const previousValue = input.dataset.previousValue || input.value;
  const currentValue = input.value;

  const previousDate = previousValue.split("T", 1)[0];
  const currentDate = currentValue.split("T", 1)[0];

  if (previousDate !== currentDate) {
    input.dataset.previousValue = currentValue;

    requestAnimationFrame(() => {
      input.blur();
    });

    return;
  }

  const previousTime = previousValue.split("T", 2)[1] || "";
  const currentTime = currentValue.split("T", 2)[1] || "";

  const previousHour = previousTime.split(":", 1)[0];
  const currentHour = currentTime.split(":", 1)[0];

  const previousMinute = previousTime.split(":", 2)[1];
  const currentMinute = currentTime.split(":", 2)[1];

  if (previousHour !== currentHour) {
    input.dataset.hourChanged = "true";
  }

  if (previousMinute !== currentMinute) {
    input.dataset.minuteChanged = "true";
  }

  input.dataset.previousValue = currentValue;

  if (input.dataset.hourChanged === "true" && input.dataset.minuteChanged === "true") {
    requestAnimationFrame(() => {
      input.blur();
    });
  }
}

function showExportModal() {
  const modalElement = document.getElementById("export-queries-modal");

  if (globalThis.bootstrap?.Modal) {
    const modal = globalThis.bootstrap.Modal.getOrCreateInstance(modalElement);

    modal.show();
    return;
  }

  if (jQuery && typeof jQuery.fn.modal === "function") {
    jQuery(modalElement).modal("show");
    return;
  }

  modalElement.style.display = "block";
  modalElement.classList.add("show");
  modalElement.removeAttribute("aria-hidden");
  modalElement.setAttribute("aria-modal", "true");
  modalElement.setAttribute("role", "dialog");

  document.body.classList.add("modal-open");

  let backdrop = document.getElementById("export-queries-modal-backdrop");

  if (!backdrop) {
    backdrop = document.createElement("div");

    backdrop.id = "export-queries-modal-backdrop";
    backdrop.className = "modal-backdrop fade show";

    backdrop.addEventListener("click", hideExportModal);

    document.body.append(backdrop);
  }
}

function hideExportModal() {
  // Abort any export currently in flight so closing the modal
  // (Cancel, the X button, or clicking outside) actually stops it
  if (exportAbortController) {
    exportAbortController.abort();
    exportAbortController = null;
  }

  const modalElement = document.getElementById("export-queries-modal");

  if (globalThis.bootstrap?.Modal) {
    const modal = globalThis.bootstrap.Modal.getInstance(modalElement);

    if (modal) {
      modal.hide();
      return;
    }
  }

  if (jQuery && typeof jQuery.fn.modal === "function") {
    jQuery(modalElement).modal("hide");
    return;
  }

  modalElement.style.display = "none";
  modalElement.classList.remove("show");
  modalElement.setAttribute("aria-hidden", "true");
  modalElement.removeAttribute("aria-modal");
  modalElement.removeAttribute("role");

  document.body.classList.remove("modal-open");

  document.getElementById("export-queries-modal-backdrop")?.remove();
}

async function exportQueries() {
  const exportButton = document.getElementById("export-confirm");
  const removeDuplicates = document.getElementById("export-remove-duplicates").checked;

  const selectedColumns = getExportColumns();

  clearExportError();

  if (selectedColumns.length === 0) {
    showExportError("Select at least one column to export.");
    return;
  }

  const fromValue = document.getElementById("export-from").value;
  const untilValue = document.getElementById("export-until").value;

  if (!fromValue || !untilValue) {
    showExportError("Select both From and Until dates.");
    return;
  }

  const from = Math.floor(new Date(fromValue).getTime() / 1000);
  const until = Math.floor(new Date(untilValue).getTime() / 1000);

  if (!Number.isFinite(from) || !Number.isFinite(until)) {
    showExportError("Invalid date range.");
    return;
  }

  if (from > until) {
    showExportError("From must be earlier than Until.");
    return;
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

  const pageLength = 1000;
  const queries = [];

  let cursor = null;
  let recordsFiltered = null;

  exportAbortController = new AbortController();
  const { signal } = exportAbortController;

  exportButton.disabled = true;
  exportButton.textContent = "Exporting...";

  try {
    while (true) {
      const url = new URL(`${document.body.dataset.apiurl}/queries`, location.origin);

      url.searchParams.set("from", from);
      url.searchParams.set("until", until);
      url.searchParams.set("length", pageLength);
      url.searchParams.set("disk", "true");

      if (cursor !== null) {
        url.searchParams.set("cursor", cursor);
      }

      // eslint-disable-next-line no-await-in-loop -- each page depends on the previous cursor
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-CSRF-TOKEN": csrfToken,
        },
        signal,
      });

      if (!response.ok) {
        // eslint-disable-next-line no-await-in-loop -- reporting failure before stopping
        await apiFailure(response);
        return;
      }

      // eslint-disable-next-line no-await-in-loop -- each page depends on the previous cursor
      const data = await response.json();
      const pageQueries = data.queries || [];

      if (recordsFiltered === null) {
        recordsFiltered = data.recordsFiltered;
      }

      queries.push(...pageQueries);

      exportButton.textContent =
        recordsFiltered === null
          ? `Exporting... ${queries.length}`
          : `Exporting... ${queries.length}/${recordsFiltered}`;

      if (pageQueries.length === 0) {
        break;
      }

      if (Number.isFinite(recordsFiltered) && queries.length >= recordsFiltered) {
        break;
      }

      if (pageQueries.length < pageLength) {
        break;
      }

      const lastQuery = pageQueries.at(-1);

      if (!lastQuery || !Number.isSafeInteger(lastQuery.id)) {
        throw new Error("Invalid query ID returned by the API.");
      }

      const nextCursor = lastQuery.id - 1;

      if (nextCursor < 0) {
        break;
      }

      if (cursor !== null && nextCursor >= cursor) {
        throw new Error("Query pagination did not advance.");
      }

      cursor = nextCursor;
    }

    let exportQueriesData = queries;

    if (removeDuplicates) {
      exportQueriesData = removeDuplicateQueries(exportQueriesData);
    }

    const headers = selectedColumns.map(column => column.header);

    const rows = exportQueriesData.map(query => selectedColumns.map(column => column.value(query)));

    const csv = [
      headers.map(value => escapeCSV(value)).join(","),
      ...rows.map(row => row.map(value => escapeCSV(value)).join(",")),
    ].join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const downloadURL = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadURL;
    link.download = "pihole-query-log.csv";

    document.body.append(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadURL);

    hideExportModal();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      // Export was cancelled by the user, nothing to report
      return;
    }

    // eslint-disable-next-line no-console -- surface unexpected export failures for debugging
    console.error(error);
    showExportError(error instanceof Error ? error.message : "Failed to export queries.");
  } finally {
    exportAbortController = null;
    exportButton.disabled = false;
    exportButton.textContent = "Export";
  }
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

  // Check if file parameter exists
  if (!queryParams.file) {
    // Add default file parameter and redirect
    const url = new URL(location.href);

    url.searchParams.set("file", "dnsmasq");

    location.assign(url.href);
    return;
  }

  const outputElement = document.getElementById("output");
  const allowedFileParams = ["dnsmasq", "ftl", "webserver"];

  // Validate that file parameter is one of the allowed values
  if (!allowedFileParams.includes(queryParams.file)) {
    const errorMessage =
      `Invalid file parameter: ${queryParams.file}. ` +
      `Allowed values are: ${allowedFileParams.join(", ")}`;

    outputElement.innerHTML = `<div><em class="text-danger">*** Error: ${utils.escapeHtml(
      errorMessage
    )} ***</em></div>`;

    return;
  }

  const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

  const url = `${document.body.dataset.apiurl}/logs/${queryParams.file}?nextID=${nextID}`;

  fetch(url, {
    method: "GET",
    headers: {
      "X-CSRF-TOKEN": csrfToken,
    },
  })
    .then(response => (response.ok ? response.json() : apiFailure(response)))
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
    .catch(error => {
      apiFailure(error);
      utils.setTimer(getData, 5 * REFRESH_INTERVAL.logs);
    });
}

gAutoScrolling = true;

document.getElementById("output").addEventListener(
  // eslint-disable-next-line unicorn/prefer-observer-apis
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
    // eslint-disable-next-line unicorn/prefer-number-coercion
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

$(() => {
  getData();

  const liveFeed = document.getElementById("live-feed");
  const feedIcon = document.getElementById("feed-icon");
  const title = document.getElementById("title");

  const exportQueriesButton = document.getElementById("export-queries");

  const exportConfirm = document.getElementById("export-confirm");

  const exportModalClose = document.getElementById("export-modal-close");

  const exportModalCancel = document.getElementById("export-modal-cancel");

  const exportFrom = document.getElementById("export-from");

  const exportUntil = document.getElementById("export-until");

  const queryParams = utils.parseQueryString();

  if (queryParams.file === "dnsmasq") {
    exportQueriesButton.classList.remove("d-none");

    exportQueriesButton.addEventListener("click", () => {
      setDefaultExportDateRange();
      clearExportError();
      showExportModal();
    });
  }

  exportModalClose.addEventListener("click", hideExportModal);

  exportModalCancel.addEventListener("click", hideExportModal);

  exportConfirm.addEventListener("click", exportQueries);

  exportFrom.addEventListener("focus", initializeDateTimePicker);

  exportUntil.addEventListener("focus", initializeDateTimePicker);

  exportFrom.addEventListener("input", closeDateTimePicker);

  exportUntil.addEventListener("input", closeDateTimePicker);

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
