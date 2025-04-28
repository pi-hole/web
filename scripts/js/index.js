/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/*
  global utils:false, Chart:false, THEME_COLORS:false, customTooltips:false,
  ChartDeferred:false, REFRESH_INTERVAL: false, updateQueryFrequency: false
*/

"use strict";

// Define global variables
let timeLineChart;
let clientsChart;
let queryTypePieChart;
let forwardDestinationPieChart;
let privacyLevel = 0;

let failures = 0;
const upstreams = {};

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
        jQuery.isEmptyObject(
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
    // Remove possibly already existing data
    chart.data.labels = [];
    chart.data.datasets = [];

    const series = [
      {
        label: "Other DNS Queries",
        color: utils.getStylePropertyFromClass("queries-other", "background-color"),
      },
      {
        label: "Blocked DNS Queries",
        color: utils.getStylePropertyFromClass("queries-blocked", "background-color"),
      },
      {
        label: "Cached DNS Queries",
        color: utils.getStylePropertyFromClass("queries-cached", "background-color"),
      },
      {
        label: "Forwarded DNS Queries",
        color: utils.getStylePropertyFromClass("queries-permitted", "background-color"),
      },
    ];

    // Collect values and colors, and labels
    for (const { color, label } of series) {
      chart.data.datasets.push({
        data: [],
        backgroundColor: color,
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        cubicInterpolationMode: "monotone",
        label,
      });
    }

    // Add data for each dataset that is available
    for (const { timestamp, total, blocked, cached, forwarded } of data.history) {
      chart.data.labels.push(new Date(1000 * Number.parseInt(timestamp, 10)));
      chart.data.datasets[0].data.push(total - (blocked + cached + forwarded));
      chart.data.datasets[1].data.push(blocked);
      chart.data.datasets[2].data.push(cached);
      chart.data.datasets[3].data.push(forwarded);
    }
  },

  clientsOverTime(chart, data) {
    const clients = {};
    const labels = Object.entries(data.clients).map(([ip, client], index) => {
      clients[ip] = index;
      return client.name || ip;
    });

    chart.data.labels = [];
    chart.data.datasets = [];

    for (const [i, label] of labels.entries()) {
      // If we ran out of colors, make a random one
      const randomHexColor = `#${(0x1_00_00_00 + Math.random() * 0xff_ff_ff).toString(16).substr(1, 6)}`;
      const backgroundColor = i < THEME_COLORS.length ? THEME_COLORS[i] : randomHexColor;

      chart.data.datasets.push({
        data: [],
        backgroundColor,
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label,
        cubicInterpolationMode: "monotone",
      });
    }

    // Add data for each dataset that is available
    for (const item of data.history) {
      for (const [client, index] of Object.entries(clients)) {
        const clientData = item.data[client];
        // If there is no data for this client in this timeslot, we push 0, otherwise the data
        chart.data.datasets[index].data.push(clientData === undefined ? 0 : clientData);
      }

      chart.data.labels.push(new Date(1000 * Number.parseInt(item.timestamp, 10)));
    }
  },

  queryTypes(chart, data) {
    const values = [];
    const colors = [];
    const labels = [];
    let sum = 0;

    // Compute total number of queries
    for (const value of Object.values(data.types)) {
      sum += value;
    }

    // Fill chart with data (only include query types which appeared recently)
    for (const [i, [item, value]] of Object.entries(data.types).entries()) {
      if (value > 0) {
        values.push((100 * value) / sum);
        colors.push(THEME_COLORS[i % THEME_COLORS.length]);
        labels.push(item);
      }
    }

    // Build a single dataset with the data to be pushed
    chart.data.datasets[0] = { data: values, backgroundColor: colors };
    chart.data.labels = labels;
  },

  forwardDestinations(chart, data) {
    const values = [];
    const colors = [];
    const labels = [];
    let sum = 0;

    // Clear the upstreams object
    for (const key of Object.keys(upstreams)) {
      delete upstreams[key];
    }

    // Compute total number of queries
    for (const item of data.upstreams) {
      sum += item.count;
    }

    // Collect values and colors
    for (const [i, item] of data.upstreams.entries()) {
      const portSuffix = item.port > 0 ? `#${item.port}` : "";
      const label = (item.name || item.ip) + portSuffix;

      // Store upstreams for generating links to the Query Log
      upstreams[label] = item.ip + portSuffix;

      values.push((100 * item.count) / sum);
      colors.push(THEME_COLORS[i % THEME_COLORS.length]);
      labels.push(label);
    }

    // Update chart data
    chart.data.datasets[0] = { data: values, backgroundColor: colors };
    chart.data.labels = labels;
  },
};

function updateQueriesOverTime() {
  updateChartData({
    chart: timeLineChart,
    apiEndpoint: "/history",
    processor: processors.queriesOverTime,
    container: "#queries-over-time",
    refreshInterval: REFRESH_INTERVAL.history,
  });
}

function updateClientsOverTime() {
  updateChartData({
    chart: clientsChart,
    apiEndpoint: "/history/clients",
    processor: processors.clientsOverTime,
    container: "#clients",
    refreshInterval: REFRESH_INTERVAL.clients,
  });
}

function updateQueryTypesPie() {
  updateChartData({
    chart: queryTypePieChart,
    apiEndpoint: "/stats/query_types",
    processor: processors.queryTypes,
    container: "#query-types-pie",
    refreshInterval: REFRESH_INTERVAL.query_types,
  });
}

function updateForwardDestinationsPie() {
  updateChartData({
    chart: forwardDestinationPieChart,
    apiEndpoint: "/stats/upstreams",
    processor: processors.forwardDestinations,
    container: "#forward-destinations-pie",
    refreshInterval: REFRESH_INTERVAL.upstreams,
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

  const $table = $(tableElement);
  const $tableContent = $table.find("td").parent();
  const $overlay = $table.find(".overlay");
  const $tbody = $table.find("tbody:last");

  const style = blocked ? "queries-blocked" : "queries-permitted";

  utils
    .fetchFactory(`${document.body.dataset.apiurl}${apiPath}${blocked ? "?blocked=true" : ""}`)
    .then(data => {
      // Clear tables before filling them with data
      $tableContent.remove();
      const sum = blocked ? data.blocked_queries : data.total_queries;

      // When there is no data...
      // a) remove table if there are no results (privacy mode enabled) or
      // b) add note if there are no results (e.g. new installation)
      if (jQuery.isEmptyObject(data[type])) {
        if (privacyLevel > 0) {
          $table.remove();
        } else {
          $tbody.append('<tr><td colspan="3" class="text-center">- No data -</td></tr>');
          $overlay.hide();
        }

        return;
      }

      // Populate table with content
      for (const item of data[type]) {
        const count = item.count;
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

        const percentage = ((count / sum) * 100).toFixed(7);
        const urlHtml = `<a href="${url}">${utils.escapeHtml(itemName)}</a>`;

        // Add row to table
        $tbody.append(
          `<tr> ${utils.addTD(urlHtml)}${utils.addTD(count)}${utils.addTD(utils.colorBar(percentage, sum, style))}</tr> `
        );
      }

      // Hide overlay
      $overlay.hide();
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

function updateSummaryData(runOnce = false) {
  utils
    .fetchFactory(`${document.body.dataset.apiurl}/stats/summary`)
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

      if (!runOnce) utils.setTimer(updateSummaryData, REFRESH_INTERVAL.summary);
    })
    .catch(() => {
      utils.setTimer(updateSummaryData, 3 * REFRESH_INTERVAL.summary);
    });
}

function labelWithPercentage(tooltipLabel, skipZero = false) {
  const data = Number.parseInt(tooltipLabel.parsed._stacks.y[tooltipLabel.datasetIndex], 10);
  if (skipZero && data === 0) return;

  // Sum all queries for the current time by iterating over all values in the current dataset
  let sum = 0;
  for (const value of Object.values(tooltipLabel.parsed._stacks.y)) {
    if (value === undefined) continue;
    const num = Number.parseInt(value, 10);
    if (num) sum += num;
  }

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

        const parent = $(chart.canvas).parent().parent().parent();

        // Update the top right info icon and reset zoom button depending on the
        // current zoom level
        if (chart.getZoomLevel() === 1) {
          // Show the closest info icon to the current chart
          parent.find(".zoom-info").show();
          // Hide the reset zoom button
          parent.find(".zoom-reset").hide();
        } else {
          // Hide the closest info icon to the current chart
          parent.find(".zoom-info").hide();
          // Show the reset zoom button
          parent.find(".zoom-reset").show();
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

  const queryOverTimeChartEl = document.getElementById("queryOverTimeChart");

  timeLineChart = createTimelineChart("queryOverTimeChart", {
    tooltipTitlePrefix: "Queries",
    useCustomTooltips: false,
    skipZeroValues: false,
  });

  if (timeLineChart) {
    updateQueriesOverTime();
  }

  // Create / load "Top Clients over Time" only if authorized
  const clientsChartEl = document.getElementById("clientsChart");
  if (clientsChartEl) {
    clientsChart = createTimelineChart("clientsChart", {
      tooltipTitlePrefix: "Client activity",
      useCustomTooltips: true,
      skipZeroValues: true,
    });

    // Pull in data via AJAX
    updateClientsOverTime();
  }

  // Initialize privacy level before loading any data that depends on it
  initPrivacyLevel().then(() => {
    // After privacy level is initialized, load the top lists
    updateTopLists();
  });

  if (queryOverTimeChartEl && timeLineChart) {
    addChartClickHandler(queryOverTimeChartEl, timeLineChart);
  }

  if (clientsChartEl && clientsChart) {
    addChartClickHandler(clientsChartEl, clientsChart);
  }

  queryTypePieChart = utils.createPieChart("queryTypePieChart", {
    legendContainerId: "query-types-legend",
    tooltipTitle: "Query type",
  });

  if (queryTypePieChart) {
    // Pull in data via AJAX
    updateQueryTypesPie();
  }

  forwardDestinationPieChart = utils.createPieChart("forwardDestinationPieChart", {
    legendContainerId: "forward-destinations-legend",
    tooltipTitle: "Upstream server",
  });

  if (forwardDestinationPieChart) {
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
