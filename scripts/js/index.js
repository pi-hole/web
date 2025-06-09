/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/*
  global utils:false, Chart:false, customTooltips:false,
  ChartDeferred:false, updateQueryFrequency:false
*/

"use strict";

// Define global variables
let privacyLevel = 0;
let failures = 0;
globalThis.upstreams = {};

// Register the ChartDeferred plugin to all charts:
Chart.register(ChartDeferred);
Chart.defaults.set("plugins.deferred", {
  yOffset: "20%",
  delay: 300,
});

// Set the privacy level
function initPrivacyLevel() {
  return utils
    .fetchFactory(`${document.body.dataset.apiurl}/info/ftl`)
    .then(data => {
      privacyLevel = data.ftl.privacy_level;
      return data;
    })
    .catch(() => {
      // Set privacy level to 0 by default if the request fails
      privacyLevel = 0;
    });
}

// Define a reusable function for updating charts
function updateChartData(config) {
  const {
    chart,
    apiEndpoint,
    processor,
    container,
    refreshInterval,
    errorCallback = () => {},
  } = config;

  utils
    .fetchFactory(`${document.body.dataset.apiurl}${apiEndpoint}`)
    .then(data => {
      // Remove graph if there are no results (e.g. new installation or privacy mode enabled)
      if (
        utils.isEmptyObject(
          data.history || data.types || data.upstreams || data.domains || data.clients
        )
      ) {
        const box = document.querySelector(container).closest(".box[id]");
        if (box) box.remove();
        return;
      }

      processor(chart, data);
      document.querySelector(`${container} .overlay`).classList.add("d-none");
      // Passing 'none' will prevent rotation animation for further updates
      // https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
      chart.update(
        chart.config.type === "pie" || chart.config.type === "doughnut" ? "none" : undefined
      );

      failures = 0;
      utils.setTimer(() => updateChartData(config), refreshInterval);
    })
    .catch(error => {
      failures++;
      if (failures < 5) {
        // Try again only if this has not failed more than five times in a row
        utils.setTimer(() => updateChartData(config), 0.1 * refreshInterval);
      }

      errorCallback(error);
    });
}

// Define data processors
const processors = {
  queriesOverTime(chart, data) {
    const labels = [];
    const otherQueries = [];
    const blockedQueries = [];
    const cachedQueries = [];
    const forwardedQueries = [];

    for (const { timestamp, total, blocked, cached, forwarded } of data.history) {
      labels.push(new Date(1000 * Number.parseInt(timestamp, 10)));
      otherQueries.push(total - (blocked + cached + forwarded));
      blockedQueries.push(blocked);
      cachedQueries.push(cached);
      forwardedQueries.push(forwarded);
    }

    // Common properties for all datasets
    const commonProps = {
      pointRadius: 0,
      pointHitRadius: 5,
      pointHoverRadius: 5,
      cubicInterpolationMode: "monotone",
    };

    const datasets = [
      {
        ...commonProps,
        data: otherQueries,
        backgroundColor: utils.getStylePropertyFromClass("queries-other", "background-color"),
        label: "Other DNS Queries",
      },
      {
        ...commonProps,
        data: blockedQueries,
        backgroundColor: utils.getStylePropertyFromClass("queries-blocked", "background-color"),
        label: "Blocked DNS Queries",
      },
      {
        ...commonProps,
        data: cachedQueries,
        backgroundColor: utils.getStylePropertyFromClass("queries-cached", "background-color"),
        label: "Cached DNS Queries",
      },
      {
        ...commonProps,
        data: forwardedQueries,
        backgroundColor: utils.getStylePropertyFromClass("queries-permitted", "background-color"),
        label: "Forwarded DNS Queries",
      },
    ];

    // Add data for each dataset that is available
    chart.data = { labels, datasets };
  },

  clientsOverTime(chart, data) {
    const clients = {};
    const clientLabels = Object.entries(data.clients).map(([ip, client], index) => {
      clients[ip] = index;
      return client.name || ip;
    });

    const datasets = clientLabels.map((label, i) => {
      // If we ran out of colors, make a random one
      const randomHexColor = `#${(0x1_00_00_00 + Math.random() * 0xff_ff_ff).toString(16).substr(1, 6)}`;
      const backgroundColor =
        i < utils.THEME_COLORS.length ? utils.THEME_COLORS[i] : randomHexColor;

      return {
        data: [],
        backgroundColor,
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label,
        cubicInterpolationMode: "monotone",
      };
    });

    const labels = [];

    // Add data for each dataset that is available
    for (const item of data.history) {
      labels.push(new Date(1000 * Number.parseInt(item.timestamp, 10)));

      // Add data for each client
      for (const [client, index] of Object.entries(clients)) {
        // If there is no data for this client in this timeslot, we push 0, otherwise the data
        datasets[index].data.push(item.data[client] ?? 0);
      }
    }

    // Add data for each dataset
    chart.data = { labels, datasets };
  },

  queryTypes(chart, data) {
    const values = [];
    const colors = [];
    const labels = [];

    // Compute total number of queries
    const sum = Object.values(data.types).reduce((total, value) => total + value, 0);

    // Fill chart with data (only include query types which appeared recently)
    for (const [i, [item, value]] of Object.entries(data.types).entries()) {
      if (value > 0) {
        values.push((100 * value) / sum);
        colors.push(utils.THEME_COLORS[i % utils.THEME_COLORS.length]);
        labels.push(item);
      }
    }

    // Build a single dataset with the data
    chart.data = {
      datasets: [
        {
          data: values,
          backgroundColor: colors,
        },
      ],
      labels,
    };
  },

  forwardDestinations(chart, data) {
    const values = [];
    const colors = [];
    const labels = [];

    // Clear the upstreams object
    for (const key of Object.keys(globalThis.upstreams)) {
      delete globalThis.upstreams[key];
    }

    // Compute total number of queries
    const sum = data.upstreams.reduce((total, item) => total + item.count, 0);

    // Collect values and colors
    for (const [i, item] of data.upstreams.entries()) {
      const portSuffix = item.port > 0 ? `#${item.port}` : "";
      const label = (item.name || item.ip) + portSuffix;

      // Store upstreams for generating links to the Query Log in charts.js
      globalThis.upstreams[label] = item.ip + portSuffix;

      values.push((100 * item.count) / sum);
      colors.push(utils.THEME_COLORS[i % utils.THEME_COLORS.length]);
      labels.push(label);
    }

    // Build a single dataset with the data
    chart.data = {
      datasets: [
        {
          data: values,
          backgroundColor: colors,
        },
      ],
      labels,
    };
  },
};

function updateQueriesOverTime() {
  const chart = Chart.getChart("queryOverTimeChart");
  if (!chart) return;

  updateChartData({
    chart,
    apiEndpoint: "/history",
    processor: processors.queriesOverTime,
    container: "#queries-over-time",
    refreshInterval: utils.REFRESH_INTERVAL.history,
  });
}

function updateClientsOverTime() {
  const chart = Chart.getChart("clientsChart");
  if (!chart) return;

  updateChartData({
    chart,
    apiEndpoint: "/history/clients",
    processor: processors.clientsOverTime,
    container: "#clients",
    refreshInterval: utils.REFRESH_INTERVAL.clients,
  });
}

function updateQueryTypesPie() {
  const chart = Chart.getChart("queryTypePieChart");
  if (!chart) return;

  updateChartData({
    chart,
    apiEndpoint: "/stats/query_types",
    processor: processors.queryTypes,
    container: "#query-types-pie",
    refreshInterval: utils.REFRESH_INTERVAL.query_types,
  });
}

function updateForwardDestinationsPie() {
  const chart = Chart.getChart("forwardDestinationPieChart");
  if (!chart) return;

  updateChartData({
    chart,
    apiEndpoint: "/stats/upstreams",
    processor: processors.forwardDestinations,
    container: "#forward-destinations-pie",
    refreshInterval: utils.REFRESH_INTERVAL.upstreams,
  });
}

function updateTopDomainsTable(blocked) {
  updateTopTable({
    blocked,
    type: "domains",
    tableElement: blocked ? "#ad-frequency" : "#domain-frequency",
    apiPath: "/stats/top_domains",
  });
}

function updateTopClientsTable(blocked) {
  updateTopTable({
    blocked,
    type: "clients",
    tableElement: blocked ? "#client-frequency-blocked" : "#client-frequency",
    apiPath: "/stats/top_clients",
  });
}

// Generic function to update top tables (domains and clients)
function updateTopTable(config) {
  const {
    blocked,
    type, // "domains" or "clients"
    tableElement,
    apiPath,
  } = config;

  const table = document.querySelector(tableElement);
  if (!table) return;

  utils
    .fetchFactory(`${document.body.dataset.apiurl}${apiPath}${blocked ? "?blocked=true" : ""}`)
    .then(data => {
      // Destroy any previously shown tooltips
      $(`${tableElement} [data-toggle="tooltip"]`).tooltip("destroy");

      const tbody = table.querySelector("tbody");
      const overlay = table.querySelector(".overlay");

      // When there is no data...
      // a) remove table if there are no results (privacy mode enabled) or
      // b) add note if there are no results (e.g. new installation)
      if (utils.isEmptyObject(data[type])) {
        if (privacyLevel > 0) {
          table.remove();
        } else {
          const row = document.createElement("tr");
          row.innerHTML = '<td colspan="3" class="text-center">- No data -</td>';
          tbody.replaceChildren(row);
          overlay.classList.add("d-none");
        }

        return;
      }

      // Populate table with content
      const fragment = document.createDocumentFragment();
      const sum = blocked ? data.blocked_queries : data.total_queries;
      const style = blocked ? "queries-blocked" : "queries-permitted";

      for (const item of data[type]) {
        let url;
        let itemName;

        if (type === "domains") {
          // Encode domain
          const domain = encodeURIComponent(item.domain);
          // Substitute "." for empty domain lookups
          itemName = domain === "" ? "." : domain;
          url = `queries?domain=${domain}${blocked ? "&upstream=blocklist" : "&upstream=permitted"}`;
        } else {
          // Encode ip
          const ip = encodeURIComponent(item.ip);
          itemName = item.name || item.ip;
          url = `queries?client_ip=${ip}${blocked ? "&upstream=blocklist" : ""}`;
        }

        const count = utils.formatNumber(item.count);
        const percentage = ((item.count / sum) * 100).toFixed(7);
        const urlHtml = `<a href="${url}">${utils.escapeHtml(itemName)}</a>`;

        // Create row element
        const row = document.createElement("tr");
        row.innerHTML = `<td>${urlHtml}</td><td>${count}</td><td>${utils.colorBar(percentage, sum, style)}</td>`;
        fragment.append(row);
      }

      // Add rows to table replacing old ones in one step
      tbody.replaceChildren(fragment);

      // Initialize Bootstrap tooltips for the newly added colorbar elements
      $(`${tableElement} [data-toggle="tooltip"]`).tooltip({ container: "body" });

      // Hide overlay
      overlay.classList.add("d-none");
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
  utils.setTimer(updateTopLists, utils.REFRESH_INTERVAL.top_lists);
}

let previousCount = 0;
let firstSummaryUpdate = true;

function updateSummaryData(runOnce = false) {
  utils
    .fetchFactory(`${document.body.dataset.apiurl}/stats/summary`)
    .then(data => {
      const newCount = Number.parseInt(data.queries.total, 10);
      const dnsQueriesElement = document.getElementById("dns_queries");
      const activeClientsElement = document.getElementById("active_clients");

      dnsQueriesElement.textContent = utils.formatNumber(newCount);
      activeClientsElement.textContent = utils.formatNumber(
        Number.parseInt(data.clients.active, 10)
      );

      const totalClientsElement = document.getElementById("total_clients");
      totalClientsElement.title = `${utils.formatNumber(Number.parseInt(data.clients.total, 10))} total clients`;

      const blockedQueriesElement = document.getElementById("blocked_queries");
      blockedQueriesElement.textContent = utils.formatNumber(
        Number.parseFloat(data.queries.blocked)
      );
      const percentBlockedElement = document.getElementById("percent_blocked");
      percentBlockedElement.textContent = utils.toPercent(data.queries.percent_blocked, 1);

      updateQueryFrequency(data.queries.frequency);

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
        gravitySizeElement.textContent = utils.formatNumber(gravityCount);
      }

      const gravitySizeContainer = gravitySizeElement.closest(".small-box");
      if (gravitySizeContainer) {
        gravitySizeContainer.title = updatetxt;
      }

      // Update the charts if the number of queries has increased significantly
      // Do not run this on the first update as reloading the same data after
      // creating the charts happens asynchronously and can cause a race condition
      if (2 * previousCount < newCount && newCount > 100 && !firstSummaryUpdate) {
        updateQueriesOverTime();
        updateClientsOverTime();
        updateQueryTypesPie();
        updateForwardDestinationsPie();
        updateTopLists();
      }

      previousCount = newCount;
      firstSummaryUpdate = false;

      if (!runOnce) utils.setTimer(updateSummaryData, utils.REFRESH_INTERVAL.summary);
    })
    .catch(() => {
      utils.setTimer(updateSummaryData, 3 * utils.REFRESH_INTERVAL.summary);
    });
}

function labelWithPercentage(tooltipLabel, skipZero = false) {
  const data = Number.parseInt(tooltipLabel.parsed._stacks.y[tooltipLabel.datasetIndex], 10);
  if (skipZero && data === 0) return;

  // Sum all queries for the current time
  const sum = Object.values(tooltipLabel.parsed._stacks.y).reduce(
    (total, value) => total + (Number.parseInt(value, 10) || 0),
    0
  );

  const percentage = sum > 0 ? (100 * data) / sum : 0;

  return `${tooltipLabel.dataset.label}: ${tooltipLabel.parsed.y} (${utils.toPercent(percentage, 1)})`;
}

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

    const clickedElementindex = activePoints[0].index;
    const label = chartInstance.data.labels[clickedElementindex];
    const from = label / 1000 - 300;
    const until = label / 1000 + 300;
    globalThis.location.href = `queries?from=${from}&until=${until}`;

    return false;
  });
}

// Factory function to create timeline charts with common configuration
function createTimelineChart(elementId, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  const gridColor = utils.getStylePropertyFromClass("graphs-grid", "background-color");
  const ticksColor = utils.getStylePropertyFromClass("graphs-ticks", "color");

  const zoomPlugin = {
    zoom: {
      wheel: {
        enabled: true,
        modifierKey: "ctrl",
      },
      pinch: {
        enabled: true,
      },
      mode: "y",
      onZoom({ chart, trigger }) {
        // Ignore onZoom triggered by the chart.zoomScale api call below
        if (trigger === "api") return;

        // The first time the chart is zoomed, save the maximum initial scale bound
        chart.absMax ||= chart.getInitialScaleBounds().y.max;
        // Calculate the maximum value to be shown for the current zoom level
        const zoomMax = chart.absMax / chart.getZoomLevel();
        // Update the y axis scale
        chart.zoomScale("y", { min: 0, max: zoomMax }, "default");
        // Update the y axis ticks and round values to natural numbers
        chart.options.scales.y.ticks.callback = value => value.toFixed(0);

        const parent = document.getElementById(chart.canvas.id).parentElement.parentElement
          .parentElement;
        const zoomInfoEl = parent.querySelector(".zoom-info");
        const zoomResetEl = parent.querySelector(".zoom-reset");

        // Update the top right info icon and reset zoom button depending on the current zoom level
        if (chart.getZoomLevel() === 1) {
          // Show the closest info icon to the current chart
          zoomInfoEl.classList.remove("d-none");
          // Hide the reset zoom button
          zoomResetEl.classList.add("d-none");
        } else {
          // Hide the closest info icon to the current chart
          zoomInfoEl.classList.add("d-none");
          // Show the reset zoom button
          zoomResetEl.classList.remove("d-none");
        }
      },
    },
    // Allow panning only on the y axis
    pan: {
      enabled: true,
      mode: "y",
    },
    limits: {
      y: {
        // Users are not allowed to zoom out further than the initial range
        min: "original",
        max: "original",
        // Users are not allowed to zoom in further than a range of 10 queries
        minRange: 10,
      },
    },
  };

  return new Chart(element.getContext("2d"), {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          parsing: false,
        },
      ],
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
          enabled: !options.useCustomTooltips,
          external: options.useCustomTooltips ? customTooltips : null,
          intersect: false,
          yAlign: options.useCustomTooltips ? "top" : "bottom",
          itemSort(a, b) {
            return options.useCustomTooltips ? b.raw - a.raw : b.datasetIndex - a.datasetIndex;
          },
          callbacks: {
            title(tooltipTitle) {
              const label = tooltipTitle[0].label;
              const time = label.match(/(\d?\d):?(\d?\d?)/);
              // Extract hour and minute from the time regex match
              const hour = Number.parseInt(time[1], 10);
              const minute = Number.parseInt(time[2], 10) || 0;

              // Calculate time range (5 minutes before and 4 minutes after)
              const minuteFrom = Math.max(0, minute - 5);
              const minuteTo = Math.min(59, minute + 4);

              // Format with padded zeros
              const paddedHour = hour.toString().padStart(2, "0");
              const paddedMinuteFrom = minuteFrom.toString().padStart(2, "0");
              const paddedMinuteTo = minuteTo.toString().padStart(2, "0");

              const from = `${paddedHour}:${paddedMinuteFrom}:00`;
              const to = `${paddedHour}:${paddedMinuteTo}:59`;
              return `${options.tooltipTitlePrefix || "Queries"} from ${from} to ${to}`;
            },
            label(tooltipLabel) {
              return labelWithPercentage(tooltipLabel, options.skipZeroValues);
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
      ...options.chartOptions,
    },
  });
}

function addZoomResetListener(button) {
  button.addEventListener("click", event => {
    const target = event.currentTarget;

    if (target.dataset.sel === "reset-clients") {
      const clientsChart = Chart.getChart("clientsChart");
      clientsChart?.resetZoom();
    } else {
      const timeLineChart = Chart.getChart("queryOverTimeChart");
      timeLineChart?.resetZoom();
    }

    // Show the closest info icon to the current chart
    target.parentElement.querySelector(".zoom-info").classList.remove("d-none");
    // Hide the reset zoom button
    target.classList.add("d-none");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Pull in data via AJAX
  updateSummaryData();

  // Create the queries over time chart
  const timeLineChart = createTimelineChart("queryOverTimeChart", {
    tooltipTitlePrefix: "Queries",
    useCustomTooltips: false,
    skipZeroValues: false,
  });

  // Pull in data via AJAX
  if (timeLineChart) {
    updateQueriesOverTime();
  }

  const queryOverTimeChartEl = document.getElementById("queryOverTimeChart");
  addChartClickHandler(queryOverTimeChartEl, timeLineChart);

  // Create the clients over time chart
  const clientsChart = createTimelineChart("clientsChart", {
    tooltipTitlePrefix: "Client activity",
    useCustomTooltips: true,
    skipZeroValues: true,
  });

  // Pull in data via AJAX
  if (clientsChart) {
    updateClientsOverTime();
  }

  const clientsChartEl = document.getElementById("clientsChart");
  addChartClickHandler(clientsChartEl, clientsChart);

  // Create query types pie chart
  const queryTypePieChart = utils.createPieChart("queryTypePieChart", {
    legendContainerId: "query-types-legend",
    tooltipTitle: "Query type",
  });

  // Pull in data via AJAX
  if (queryTypePieChart) {
    updateQueryTypesPie();
  }

  // Create forward destinations pie chart
  const forwardDestinationPieChart = utils.createPieChart("forwardDestinationPieChart", {
    legendContainerId: "forward-destinations-legend",
    tooltipTitle: "Upstream server",
  });

  // Pull in data via AJAX
  if (forwardDestinationPieChart) {
    updateForwardDestinationsPie();
  }

  // Initialize privacy level before loading any data that depends on it
  initPrivacyLevel().then(() => {
    // After privacy level is initialized, load the top lists
    updateTopLists();
  });

  // On click of the "Reset zoom" buttons, the closest chart to the button is reset
  for (const button of document.querySelectorAll(".zoom-reset")) {
    addZoomResetListener(button);
  }
});

// Destroy all chartjs tooltips on window resize
window.addEventListener("resize", () => {
  const chartJsTooltips = document.querySelectorAll(".chartjs-tooltip");
  for (const chartJsTooltip of chartJsTooltips) {
    chartJsTooltip.remove();
  }
});
