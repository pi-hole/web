/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false, apiFailure:false, THEME_COLORS:false, customTooltips:false, htmlLegendPlugin:false,doughnutTooltip:false, ChartDeferred:false, REFRESH_INTERVAL: false, updateQueryFrequency: false */

"use strict";

// Define global variables
let timeLineChart;
let clientsChart;
let queryTypePieChart;
let forwardDestinationPieChart;
let privacyLevel = 0;

// Register the ChartDeferred plugin to all charts:
Chart.register(ChartDeferred);
Chart.defaults.set("plugins.deferred", {
  yOffset: "20%",
  delay: 300,
});

// Set the privacy level
function initPrivacyLevel() {
  return $.ajax({
    url: document.body.dataset.apiurl + "/info/ftl",
  })
    .done(data => {
      privacyLevel = data.ftl.privacy_level;
    })
    .fail(data => {
      apiFailure(data);
      // Set privacy level to 0 by default if the request fails
      privacyLevel = 0;
    });
}

// Functions to update data in page

let failures = 0;
function updateQueriesOverTime() {
  const queriesOverTime = document.getElementById("queries-over-time");
  const queriesOverlay = queriesOverTime.querySelector(".overlay");

  $.getJSON(`${document.body.dataset.apiurl}/history`, data => {
    // Remove graph if there are no results (e.g. new installation or privacy mode enabled)
    if (jQuery.isEmptyObject(data.history)) {
      queriesOverTime.remove();
      return;
    }

    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets = [];

    const labels = [
      "Other DNS Queries",
      "Blocked DNS Queries",
      "Cached DNS Queries",
      "Forwarded DNS Queries",
    ];
    const cachedColor = utils.getStylePropertyFromClass("queries-cached", "background-color");
    const blockedColor = utils.getStylePropertyFromClass("queries-blocked", "background-color");
    const permittedColor = utils.getStylePropertyFromClass("queries-permitted", "background-color");
    const otherColor = utils.getStylePropertyFromClass("queries-other", "background-color");
    const colors = [otherColor, blockedColor, cachedColor, permittedColor];

    // Collect values and colors, and labels
    for (const [i, label] of labels.entries()) {
      timeLineChart.data.datasets.push({
        data: [],
        // If we ran out of colors, make a random one
        backgroundColor: colors[i],
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label,
        cubicInterpolationMode: "monotone",
      });
    }

    // Add data for each dataset that is available
    for (const item of data.history) {
      const timestamp = new Date(1000 * Number.parseInt(item.timestamp, 10));

      timeLineChart.data.labels.push(timestamp);
      const other = item.total - (item.blocked + item.cached + item.forwarded);
      timeLineChart.data.datasets[0].data.push(other);
      timeLineChart.data.datasets[1].data.push(item.blocked);
      timeLineChart.data.datasets[2].data.push(item.cached);
      timeLineChart.data.datasets[3].data.push(item.forwarded);
    }

    queriesOverlay.classList.add("d-none");
    timeLineChart.update();
  })
    .done(() => {
      failures = 0;
      utils.setTimer(updateQueriesOverTime, REFRESH_INTERVAL.history);
    })
    .fail(() => {
      failures++;
      if (failures < 5) {
        // Try again only if this has not failed more than five times in a row
        utils.setTimer(updateQueriesOverTime, 0.1 * REFRESH_INTERVAL.history);
      }
    })
    .fail(data => {
      apiFailure(data);
    });
}

function updateQueryTypesPie() {
  $.getJSON(document.body.dataset.apiurl + "/stats/query_types", data => {
    const v = [];
    const c = [];
    const k = [];
    let i = 0;
    let sum = 0;

    // Compute total number of queries
    for (const value of Object.values(data.types)) {
      sum += value;
    }

    // Fill chart with data (only include query types which appeared recently)
    for (const [item, value] of Object.entries(data.types)) {
      if (value > 0) {
        v.push((100 * value) / sum);
        c.push(THEME_COLORS[i % THEME_COLORS.length]);
        k.push(item);
      }

      i++;
    }

    // Build a single dataset with the data to be pushed
    const dd = { data: v, backgroundColor: c };
    // and push it at once
    queryTypePieChart.data.datasets[0] = dd;
    queryTypePieChart.data.labels = k;
    document.querySelector("#query-types-pie .overlay").classList.add("d-none");
    // Passing 'none' will prevent rotation animation for further updates
    //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
    queryTypePieChart.update("none");
  })
    .done(() => {
      utils.setTimer(updateQueryTypesPie, REFRESH_INTERVAL.query_types);
    })
    .fail(data => {
      apiFailure(data);
    });
}

function updateClientsOverTime() {
  $.getJSON(document.body.dataset.apiurl + "/history/clients", data => {
    const clientsElement = document.getElementById("clients");
    // Remove graph if there are no results (e.g. new installation or privacy mode enabled)
    if (jQuery.isEmptyObject(data.history)) {
      clientsElement.remove();
      return;
    }

    let numClients = 0;
    const labels = [];
    const clients = {};
    for (const [ip, clientData] of Object.entries(data.clients)) {
      clients[ip] = numClients++;
      labels.push(clientData.name !== null ? clientData.name : ip);
    }

    // Remove possibly already existing data
    clientsChart.data.labels = [];
    clientsChart.data.datasets = [];

    for (let i = 0; i < numClients; i++) {
      clientsChart.data.datasets.push({
        data: [],
        // If we ran out of colors, make a random one
        backgroundColor:
          i < THEME_COLORS.length
            ? THEME_COLORS[i]
            : "#" + (0x1_00_00_00 + Math.random() * 0xff_ff_ff).toString(16).substr(1, 6),
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label: labels[i],
        cubicInterpolationMode: "monotone",
      });
    }

    // Add data for each dataset that is available
    // We need to iterate over all time slots and fill in the data for each client
    for (const item of Object.values(data.history)) {
      for (const [client, index] of Object.entries(clients)) {
        const clientData = item.data[client];
        // If there is no data for this client in this timeslot, we push 0, otherwise the data
        clientsChart.data.datasets[index].data.push(clientData === undefined ? 0 : clientData);
      }
    }

    // Extract data timestamps
    for (const item of data.history) {
      const d = new Date(1000 * Number.parseInt(item.timestamp, 10));
      clientsChart.data.labels.push(d);
    }

    clientsElement.querySelector(".overlay").classList.add("d-none");
    clientsChart.update();
  })
    .done(() => {
      // Reload graph after 10 minutes
      failures = 0;
      utils.setTimer(updateClientsOverTime, REFRESH_INTERVAL.clients);
    })
    .fail(() => {
      failures++;
      if (failures < 5) {
        // Try again only if this has not failed more than five times in a row
        utils.setTimer(updateClientsOverTime, 0.1 * REFRESH_INTERVAL.clients);
      }
    })
    .fail(data => {
      apiFailure(data);
    });
}

const upstreams = {};
function updateForwardDestinationsPie() {
  $.getJSON(document.body.dataset.apiurl + "/stats/upstreams", data => {
    const v = [];
    const c = [];
    const k = [];
    let i = 0;
    let sum = 0;
    const values = [];

    // Compute total number of queries
    for (const item of data.upstreams) {
      sum += item.count;
    }

    // Collect values and colors
    for (const item of data.upstreams) {
      let label = item.name !== null && item.name.length > 0 ? item.name : item.ip;
      if (item.port > 0) {
        label += "#" + item.port;
      }

      // Store upstreams for generating links to the Query Log
      upstreams[label] = item.ip;
      if (item.port > 0) {
        upstreams[label] += "#" + item.port;
      }

      const percent = (100 * item.count) / sum;
      values.push([label, percent, THEME_COLORS[i++ % THEME_COLORS.length]]);
    }

    // Split data into individual arrays for the graphs
    for (const value of values) {
      k.push(value[0]);
      v.push(value[1]);
      c.push(value[2]);
    }

    // Build a single dataset with the data to be pushed
    const dd = { data: v, backgroundColor: c };
    // and push it at once
    forwardDestinationPieChart.data.labels = k;
    forwardDestinationPieChart.data.datasets[0] = dd;
    // and push it at once
    document.querySelector("#forward-destinations-pie .overlay").classList.add("d-none");

    // Passing 'none' will prevent rotation animation for further updates
    //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
    queryTypePieChart.update("none");
    forwardDestinationPieChart.update("none");
  })
    .done(() => {
      utils.setTimer(updateForwardDestinationsPie, REFRESH_INTERVAL.upstreams);
    })
    .fail(data => {
      apiFailure(data);
    });
}

function updateTopClientsTable(blocked) {
  const $clientFrequencyBlocked = $("#client-frequency-blocked");
  const $clientFrequency = $("#client-frequency");
  const $tableContent = blocked
    ? $clientFrequencyBlocked.find("td").parent()
    : $clientFrequency.find("td").parent();
  const $overlay = blocked
    ? $clientFrequencyBlocked.find(".overlay")
    : $clientFrequency.find(".overlay");
  const $clientTable = blocked
    ? $clientFrequencyBlocked.find("tbody:last")
    : $clientFrequency.find("tbody:last");

  const api = blocked
    ? `${document.body.dataset.apiurl}/stats/top_clients?blocked=true`
    : `${document.body.dataset.apiurl}/stats/top_clients`;
  const style = blocked ? "queries-blocked" : "queries-permitted";

  $.getJSON(api, data => {
    // Clear tables before filling them with data
    $tableContent.remove();
    const sum = blocked ? data.blocked_queries : data.total_queries;

    // When there is no data...
    // a) remove table if there are no results (privacy mode enabled) or
    // b) add note if there are no results (e.g. new installation)
    if (jQuery.isEmptyObject(data.clients)) {
      if (privacyLevel > 1) {
        $clientTable.remove();
      } else {
        $clientTable.append('<tr><td colspan="3" class="text-center">- No data -</td></tr>');
        $overlay.hide();
      }

      return;
    }

    // Populate table with content
    for (const client of data.clients) {
      // Sanitize client
      let clientname = client.name;
      if (clientname.length === 0) clientname = client.ip;
      const url =
        '<a href="queries?client_ip=' +
        encodeURIComponent(client.ip) +
        (blocked ? "&upstream=blocklist" : "") +
        '">' +
        utils.escapeHtml(clientname) +
        "</a>";
      const percentage = (client.count / sum) * 100;

      // Add row to table
      $clientTable.append(
        "<tr> " +
          utils.addTD(url) +
          utils.addTD(client.count) +
          utils.addTD(utils.colorBar(percentage, sum, style)) +
          "</tr> "
      );
    }

    // Hide overlay
    $overlay.hide();
  }).fail(data => {
    apiFailure(data);
  });
}

function updateTopDomainsTable(blocked) {
  const $adFrequency = $("#ad-frequency");
  const $domainFrequency = $("#domain-frequency");
  const $tableContent = blocked
    ? $adFrequency.find("td").parent()
    : $domainFrequency.find("td").parent();
  const $overlay = blocked ? $adFrequency.find(".overlay") : $domainFrequency.find(".overlay");
  const $domainTable = blocked
    ? $adFrequency.find("tbody:last")
    : $domainFrequency.find("tbody:last");

  const api = blocked
    ? `${document.body.dataset.apiurl}/stats/top_domains?blocked=true`
    : `${document.body.dataset.apiurl}/stats/top_domains`;
  const style = blocked ? "queries-blocked" : "queries-permitted";

  $.getJSON(api, data => {
    // Clear tables before filling them with data
    $tableContent.remove();
    const sum = blocked ? data.blocked_queries : data.total_queries;

    // When there is no data...
    // a) remove table if there are no results (privacy mode enabled) or
    // b) add note if there are no results (e.g. new installation)
    if (jQuery.isEmptyObject(data.domains)) {
      if (privacyLevel > 0) {
        $domainTable.remove();
      } else {
        $domainTable.append('<tr><td colspan="3" class="text-center">- No data -</td></tr>');
        $overlay.hide();
      }

      return;
    }

    // Populate table with content
    for (const item of data.domains) {
      // Sanitize domain
      const domain = encodeURIComponent(item.domain);
      // Substitute "." for empty domain lookups
      const urlText = domain === "" ? "." : domain;
      const url =
        '<a href="queries?domain=' +
        domain +
        (blocked ? "&upstream=blocklist" : "&upstream=permitted") +
        '">' +
        urlText +
        "</a>";
      const percentage = (item.count / sum) * 100;

      $domainTable.append(
        "<tr> " +
          utils.addTD(url) +
          utils.addTD(item.count) +
          utils.addTD(utils.colorBar(percentage, sum, style)) +
          "</tr> "
      );
    }

    $overlay.hide();
  }).fail(data => {
    apiFailure(data);
  });
}

function updateTopLists() {
  // Update blocked domains
  updateTopDomainsTable(true);

  // Update permitted domains
  updateTopDomainsTable(false);

  // Update blocked clients
  updateTopClientsTable(true);

  // Update permitted clients
  updateTopClientsTable(false);

  // Update top lists data every 10 seconds
  utils.setTimer(updateTopLists, REFRESH_INTERVAL.top_lists);
}

let previousCount = 0;
let firstSummaryUpdate = true;
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");

function updateSummaryData(runOnce = false) {
  fetch(`${document.body.dataset.apiurl}/stats/summary`, {
    headers: { "X-CSRF-TOKEN": csrfToken },
  })
    .then(response => response.json())
    .then(data => {
      const intl = new Intl.NumberFormat();
      const newCount = Number.parseInt(data.queries.total, 10);
      const dnsQueriesElement = document.getElementById("dns_queries");
      const activeClientsElement = document.getElementById("active_clients");

      dnsQueriesElement.textContent = intl.format(newCount);
      activeClientsElement.textContent = intl.format(Number.parseInt(data.clients.active, 10));

      const totalClientsElement = document.getElementById("total_clients");
      totalClientsElement.title = `${intl.format(Number.parseInt(data.clients.total, 10))} total clients`;

      const blockedQueriesElement = document.getElementById("blocked_queries");
      blockedQueriesElement.textContent = intl.format(Number.parseFloat(data.queries.blocked));
      const percentBlockedElement = document.getElementById("percent_blocked");
      percentBlockedElement.textContent = utils.toPercent(data.queries.percent_blocked, 1);

      updateQueryFrequency(intl, data.queries.frequency);

      const lastupdate = Number.parseInt(data.gravity.last_update, 10);
      let updatetxt = "Lists were never updated";
      if (lastupdate > 0) {
        const relativeTime = utils.datetimeRelative(lastupdate);
        const absoluteTime = utils.datetime(lastupdate, false, false);
        updatetxt = `Lists updated ${relativeTime}\n(${absoluteTime})`;
      }

      const gravitySizeElement = document.getElementById("gravity_size");
      const gravityCount = Number.parseInt(data.gravity.domains_being_blocked, 10);
      if (gravityCount < 0) {
        // Error. Change the title text and show the error code in parentheses
        updatetxt = "Error! Update gravity to reset this value.";
        gravitySizeElement.textContent = `Error (${gravityCount})`;
      } else {
        gravitySizeElement.textContent = intl.format(gravityCount);
      }

      const gravitySizeContainer = gravitySizeElement.closest(".small-box");
      if (gravitySizeContainer) {
        gravitySizeContainer.title = updatetxt;
      }

      if (2 * previousCount < newCount && newCount > 100 && !firstSummaryUpdate) {
        // Update the charts if the number of queries has increased significantly
        // Do not run this on the first update as reloading the same data after
        // creating the charts happens asynchronously and can cause a race condition
        updateQueriesOverTime();
        updateClientsOverTime();
        updateQueryTypesPie();
        updateForwardDestinationsPie();
        updateTopLists();
      }

      previousCount = newCount;
      firstSummaryUpdate = false;

      if (!runOnce) utils.setTimer(updateSummaryData, REFRESH_INTERVAL.summary);
    })
    .catch(error => {
      utils.setTimer(updateSummaryData, 3 * REFRESH_INTERVAL.summary);
      apiFailure(error);
    });
}

function labelWithPercentage(tooltipLabel, skipZero = false) {
  // Sum all queries for the current time by iterating over all keys in the
  // current dataset
  let sum = 0;
  for (const value of Object.values(tooltipLabel.parsed._stacks.y)) {
    if (value === undefined) continue;
    const num = Number.parseInt(value, 10);
    if (num) sum += num;
  }

  const data = Number.parseInt(tooltipLabel.parsed._stacks.y[tooltipLabel.datasetIndex], 10);
  const percentage = sum > 0 ? (100 * data) / sum : 0;

  if (skipZero && data === 0) return undefined;
  return (
    tooltipLabel.dataset.label +
    ": " +
    tooltipLabel.parsed.y +
    " (" +
    utils.toPercent(percentage, 1) +
    ")"
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // Pull in data via AJAX
  updateSummaryData();

  // On click of the "Reset zoom" buttons, the closest chart to the button is reset
  $(".zoom-reset").on("click", function () {
    if ($(this).data("sel") === "reset-clients") clientsChart.resetZoom();
    else timeLineChart.resetZoom();

    // Show the closest info icon to the current chart
    $(this).parent().find(".zoom-info").show();
    // Hide the reset zoom button
    $(this).hide();
  });

  const zoomPlugin = {
    /* Allow zooming only on the y axis */
    zoom: {
      wheel: {
        enabled: true,
        modifierKey: "ctrl" /* Modifier key required for zooming via mouse wheel */,
      },
      pinch: {
        enabled: true,
      },
      mode: "y",
      onZoom({ chart, trigger }) {
        if (trigger === "api") {
          // Ignore onZoom triggered by the chart.zoomScale api call below
          return;
        }

        // The first time the chart is zoomed, save the maximum initial scale bound
        chart.absMax ||= chart.getInitialScaleBounds().y.max;
        // Calculate the maximum value to be shown for the current zoom level
        const zoomMax = chart.absMax / chart.getZoomLevel();
        // Update the y axis scale
        chart.zoomScale("y", { min: 0, max: zoomMax }, "default");
        // Update the y axis ticks and round values to natural numbers
        chart.options.scales.y.ticks.callback = function (value) {
          return value.toFixed(0);
        };

        // Update the top right info icon and reset zoom button depending on the
        // current zoom level
        if (chart.getZoomLevel() === 1) {
          // Show the closest info icon to the current chart
          $(chart.canvas).parent().parent().parent().find(".zoom-info").show();
          // Hide the reset zoom button
          $(chart.canvas).parent().parent().parent().find(".zoom-reset").hide();
        } else {
          // Hide the closest info icon to the current chart
          $(chart.canvas).parent().parent().parent().find(".zoom-info").hide();
          // Show the reset zoom button
          $(chart.canvas).parent().parent().parent().find(".zoom-reset").show();
        }
      },
    },
    /* Allow panning only on the y axis */
    pan: {
      enabled: true,
      mode: "y",
    },
    limits: {
      y: {
        /* Users are not allowed to zoom out further than the initial range */
        min: "original",
        max: "original",
        /* Users are not allowed to zoom in further than a range of 10 queries */
        minRange: 10,
      },
    },
  };

  const gridColor = utils.getStylePropertyFromClass("graphs-grid", "background-color");
  const ticksColor = utils.getStylePropertyFromClass("graphs-ticks", "color");

  const queryOverTimeChartEl = document.getElementById("queryOverTimeChart");

  timeLineChart = new Chart(queryOverTimeChartEl.getContext("2d"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [{ data: [], parsing: false }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "nearest",
        axis: "x",
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          enabled: true,
          intersect: false,
          yAlign: "bottom",
          itemSort(a, b) {
            return b.datasetIndex - a.datasetIndex;
          },
          callbacks: {
            title(tooltipTitle) {
              const label = tooltipTitle[0].label;
              const time = label.match(/(\d?\d):?(\d?\d?)/);
              const h = Number.parseInt(time[1], 10);
              const m = Number.parseInt(time[2], 10) || 0;
              const from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
              const to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
              return "Queries from " + from + " to " + to;
            },
            label(tooltipLabel) {
              return labelWithPercentage(tooltipLabel);
            },
          },
        },
        zoom: zoomPlugin,
      },
      scales: {
        x: {
          type: "time",
          stacked: true,
          offset: false,
          time: {
            unit: "hour",
            displayFormats: {
              hour: "HH:mm",
            },
            tooltipFormat: "HH:mm",
          },
          grid: {
            color: gridColor,
            offset: false,
          },
          ticks: {
            color: ticksColor,
          },
          border: {
            display: false,
          },
        },
        y: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: ticksColor,
            precision: 0,
          },
          grid: {
            color: gridColor,
          },
          border: {
            display: false,
          },
          min: 0,
        },
      },
      elements: {
        line: {
          borderWidth: 0,
          spanGaps: false,
          fill: true,
        },
        point: {
          radius: 0,
          hoverRadius: 5,
          hitRadius: 5,
        },
      },
    },
  });

  // Pull in data via AJAX
  updateQueriesOverTime();

  // Create / load "Top Clients over Time" only if authorized
  const clientsChartEl = document.getElementById("clientsChart");
  if (clientsChartEl) {
    clientsChart = new Chart(clientsChartEl.getContext("2d"), {
      type: "bar",
      data: {
        labels: [],
        datasets: [{ data: [], parsing: false }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "nearest",
          axis: "x",
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            // Disable the on-canvas tooltip
            enabled: false,
            intersect: false,
            external: customTooltips,
            yAlign: "top",
            itemSort(a, b) {
              return b.raw - a.raw;
            },
            callbacks: {
              title(tooltipTitle) {
                const label = tooltipTitle[0].label;
                const time = label.match(/(\d?\d):?(\d?\d?)/);
                const h = Number.parseInt(time[1], 10);
                const m = Number.parseInt(time[2], 10) || 0;
                const from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
                const to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
                return "Client activity from " + from + " to " + to;
              },
              label(tooltipLabel) {
                return labelWithPercentage(tooltipLabel, true);
              },
            },
          },
          zoom: zoomPlugin,
        },
        scales: {
          x: {
            type: "time",
            stacked: true,
            offset: false,
            time: {
              unit: "hour",
              displayFormats: {
                hour: "HH:mm",
              },
              tooltipFormat: "HH:mm",
            },
            grid: {
              color: gridColor,
              offset: false,
            },
            border: {
              display: false,
            },
            ticks: {
              color: ticksColor,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: ticksColor,
              precision: 0,
            },
            stacked: true,
            grid: {
              color: gridColor,
            },
            border: {
              display: false,
            },
            min: 0,
          },
        },
        elements: {
          line: {
            borderWidth: 0,
            spanGaps: false,
            fill: true,
            point: {
              radius: 0,
              hoverRadius: 5,
              hitRadius: 5,
            },
          },
        },
        hover: {
          animationDuration: 0,
        },
      },
    });

    // Pull in data via AJAX
    updateClientsOverTime();
  }

  // Initialize privacy level before loading any data that depends on it
  initPrivacyLevel().then(() => {
    // After privacy level is initialized, load the top lists
    updateTopLists();
  });

  // Add chart click handler function
  function addChartClickHandler(chartElement, chartInstance) {
    chartElement.addEventListener("click", event => {
      const activePoints = chartInstance.getElementsAtEventForMode(
        event,
        "nearest",
        { intersect: true },
        false
      );

      if (activePoints.length === 0) return false;

      // Get the internal index
      const clickedElementindex = activePoints[0].index;
      // Get specific label by index
      const label = chartInstance.data.labels[clickedElementindex];

      // Get value by index
      const from = label / 1000 - 300;
      const until = label / 1000 + 300;
      globalThis.location.href = `queries?from=${from}&until=${until}`;

      return false;
    });
  }

  queryOverTimeChartEl.addEventListener("click", event => {
    const activePoints = timeLineChart.getElementsAtEventForMode(
      event,
      "nearest",
      { intersect: true },
      false
    );

    if (activePoints.length === 0) return false;

    // Get the internal index
    const clickedElementindex = activePoints[0].index;
    // Get specific label by index
    const label = timeLineChart.data.labels[clickedElementindex];

    // Get value by index
    const from = label / 1000 - 300;
    const until = label / 1000 + 300;
    globalThis.location.href = `queries?from=${from}&until=${until}`;

    return false;
  });

  // Add click handler to queryOverTimeChart
  addChartClickHandler(queryOverTimeChartEl, timeLineChart);

  // Add click handler to clientsChart if it exists
  if (clientsChartEl) {
    addChartClickHandler(clientsChartEl, clientsChart);
  }

  const boxEl = document.querySelector(".box");
  const queryTypePieChartEl = document.getElementById("queryTypePieChart");

  if (queryTypePieChartEl) {
    queryTypePieChart = new Chart(queryTypePieChartEl.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{ data: [], parsing: false }],
      },
      plugins: [htmlLegendPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          arc: {
            borderColor: getComputedStyle(boxEl).backgroundColor,
          },
        },
        plugins: {
          htmlLegend: {
            containerID: "query-types-legend",
          },
          legend: {
            display: false,
          },
          tooltip: {
            // Disable the on-canvas tooltip
            enabled: false,
            external: customTooltips,
            callbacks: {
              title() {
                return "Query type";
              },
              label: doughnutTooltip,
            },
          },
        },
        animation: {
          duration: 750,
        },
      },
    });

    // Pull in data via AJAX
    updateQueryTypesPie();
  }

  const forwardDestinationPieChartEl = document.getElementById("forwardDestinationPieChart");
  if (forwardDestinationPieChartEl) {
    forwardDestinationPieChart = new Chart(forwardDestinationPieChartEl.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{ data: [], parsing: false }],
      },
      plugins: [htmlLegendPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        elements: {
          arc: {
            borderColor: getComputedStyle(boxEl).backgroundColor,
          },
        },
        plugins: {
          htmlLegend: {
            containerID: "forward-destinations-legend",
          },
          legend: {
            display: false,
          },
          tooltip: {
            // Disable the on-canvas tooltip
            enabled: false,
            external: customTooltips,
            callbacks: {
              title() {
                return "Upstream server";
              },
              label: doughnutTooltip,
            },
          },
        },
        animation: {
          duration: 750,
        },
      },
    });

    // Pull in data via AJAX
    updateForwardDestinationsPie();
  }
});

// Destroy all chartjs tooltips on window resize
window.addEventListener("resize", () => {
  const chartJsTooltips = document.querySelectorAll(".chartjs-tooltip");
  for (const chartJsTooltip of chartJsTooltips) {
    chartJsTooltip.remove();
  }
});

// Tooltips
document.addEventListener("DOMContentLoaded", () => {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});
