/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false, apiFailure:false, THEME_COLORS:false, customTooltips:false, htmlLegendPlugin:false,doughnutTooltip:false, ChartDeferred:false, REFRESH_INTERVAL: false */

// Define global variables
var timeLineChart, clientsChart;
var queryTypePieChart, forwardDestinationPieChart;

// Register the ChartDeferred plugin to all charts:
Chart.register(ChartDeferred);
Chart.defaults.set("plugins.deferred", {
  yOffset: "20%",
  delay: 300,
});

// Functions to update data in page

var failures = 0;
function updateQueriesOverTime() {
  $.getJSON("/api/history", function (data) {
    // Remove graph if there are no results (e.g. new
    // installation or privacy mode enabled)
    if (jQuery.isEmptyObject(data.history)) {
      $("#queries-over-time").remove();
      return;
    }

    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets = [];

    var labels = [
      "Other DNS Queries",
      "Blocked DNS Queries",
      "Cached DNS Queries",
      "Forwarded DNS Queries",
    ];
    var cachedColor = utils.getCSSval("queries-cached", "background-color");
    var blockedColor = utils.getCSSval("queries-blocked", "background-color");
    var permittedColor = utils.getCSSval("queries-permitted", "background-color");
    var otherColor = utils.getCSSval("queries-other", "background-color");
    var colors = [otherColor, blockedColor, cachedColor, permittedColor];

    // Collect values and colors, and labels
    for (var i = 0; i < labels.length; i++) {
      timeLineChart.data.datasets.push({
        data: [],
        // If we ran out of colors, make a random one
        backgroundColor: colors[i],
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label: labels[i],
        cubicInterpolationMode: "monotone",
      });
    }

    // Add data for each dataset that is available
    data.history.forEach(function (item) {
      var timestamp = new Date(1000 * parseInt(item.timestamp, 10));

      timeLineChart.data.labels.push(timestamp);
      var other = item.total - (item.blocked + item.cached + item.forwarded);
      timeLineChart.data.datasets[0].data.push(other);
      timeLineChart.data.datasets[1].data.push(item.blocked);
      timeLineChart.data.datasets[2].data.push(item.cached);
      timeLineChart.data.datasets[3].data.push(item.forwarded);
    });

    $("#queries-over-time .overlay").hide();
    timeLineChart.update();
  })
    .done(function () {
      failures = 0;
      utils.setTimer(updateQueriesOverTime, REFRESH_INTERVAL.history);
    })
    .fail(function () {
      failures++;
      if (failures < 5) {
        // Try again ´only if this has not failed more than five times in a row
        utils.setTimer(updateQueriesOverTime, 0.1 * REFRESH_INTERVAL.history);
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function updateQueryTypesPie() {
  $.getJSON("/api/stats/query_types", function (data) {
    var v = [],
      c = [],
      k = [],
      i = 0,
      sum = 0;

    // Compute total number of queries
    Object.keys(data.types).forEach(function (item) {
      sum += data.types[item];
    });

    // Fill chart with data (only include query types which appeared recently)
    Object.keys(data.types).forEach(function (item) {
      if (data.types[item] > 0) {
        v.push((100 * data.types[item]) / sum);
        c.push(THEME_COLORS[i % THEME_COLORS.length]);
        k.push(item);
      }

      i++;
    });

    // Build a single dataset with the data to be pushed
    var dd = { data: v, backgroundColor: c };
    // and push it at once
    queryTypePieChart.data.datasets[0] = dd;
    queryTypePieChart.data.labels = k;
    $("#query-types-pie .overlay").hide();
    // Passing 'none' will prevent rotation animation for further updates
    //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
    queryTypePieChart.update("none");
  })
    .done(function () {
      utils.setTimer(updateQueryTypesPie, REFRESH_INTERVAL.query_types);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function updateClientsOverTime() {
  $.getJSON("/api/history/clients", function (data) {
    // Remove graph if there are no results (e.g. new
    // installation or privacy mode enabled)
    if (jQuery.isEmptyObject(data.history)) {
      $("#clients").remove();
      return;
    }

    let numClients = 0;
    const labels = [],
      clients = {};
    Object.keys(data.clients).forEach(function (ip) {
      clients[ip] = numClients++;
      labels.push(data.clients[ip].name !== null ? data.clients[ip].name : ip);
    });

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
            : "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6),
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label: labels[i],
        cubicInterpolationMode: "monotone",
      });
    }

    // Add data for each dataset that is available
    // We need to iterate over all time slots and fill in the data for each client
    Object.keys(data.history).forEach(function (item) {
      Object.keys(clients).forEach(function (client) {
        if (data.history[item].data[client] === undefined) {
          // If there is no data for this client in this timeslot, we push 0
          clientsChart.data.datasets[clients[client]].data.push(0);
        } else {
          // Otherwise, we push the data
          clientsChart.data.datasets[clients[client]].data.push(data.history[item].data[client]);
        }
      });
    });

    // Extract data timestamps
    data.history.forEach(function (item) {
      var d = new Date(1000 * parseInt(item.timestamp, 10));
      clientsChart.data.labels.push(d);
    });

    $("#clients .overlay").hide();
    clientsChart.update();
  })
    .done(function () {
      // Reload graph after 10 minutes
      failures = 0;
      utils.setTimer(updateClientsOverTime, REFRESH_INTERVAL.clients);
    })
    .fail(function () {
      failures++;
      if (failures < 5) {
        // Try again only if this has not failed more than five times in a row
        utils.setTimer(updateClientsOverTime, 0.1 * REFRESH_INTERVAL.clients);
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

var upstreams = {};
function updateForwardDestinationsPie() {
  $.getJSON("/api/stats/upstreams", function (data) {
    var v = [],
      c = [],
      k = [],
      i = 0,
      sum = 0,
      values = [];

    // Compute total number of queries
    data.upstreams.forEach(function (item) {
      sum += item.count;
    });

    // Collect values and colors
    data.upstreams.forEach(function (item) {
      var label = item.name !== null && item.name.length > 0 ? item.name : item.ip;
      if (item.port > 0) {
        label += "#" + item.port;
      }

      // Store upstreams for generating links to the Query Log
      upstreams[label] = item.ip;
      if (item.port > 0) {
        upstreams[label] += "#" + item.port;
      }

      var percent = (100 * item.count) / sum;
      values.push([label, percent, THEME_COLORS[i++ % THEME_COLORS.length]]);
    });

    // Split data into individual arrays for the graphs
    values.forEach(function (value) {
      k.push(value[0]);
      v.push(value[1]);
      c.push(value[2]);
    });

    // Build a single dataset with the data to be pushed
    var dd = { data: v, backgroundColor: c };
    // and push it at once
    forwardDestinationPieChart.data.labels = k;
    forwardDestinationPieChart.data.datasets[0] = dd;
    // and push it at once
    $("#forward-destinations-pie .overlay").hide();

    // Passing 'none' will prevent rotation animation for further updates
    //https://www.chartjs.org/docs/latest/developers/updates.html#preventing-animations
    queryTypePieChart.update("none");
    forwardDestinationPieChart.update("none");
  })
    .done(function () {
      utils.setTimer(updateForwardDestinationsPie, REFRESH_INTERVAL.upstreams);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function updateTopClientsTable(blocked) {
  let api, style, tablecontent, overlay, clienttable;
  if (blocked) {
    api = "/api/stats/top_clients?blocked=true";
    style = "queries-blocked";
    tablecontent = $("#client-frequency-blocked td").parent();
    overlay = $("#client-frequency-blocked .overlay");
    clienttable = $("#client-frequency-blocked").find("tbody:last");
  } else {
    api = "/api/stats/top_clients";
    style = "queries-permitted";
    tablecontent = $("#client-frequency td").parent();
    overlay = $("#client-frequency .overlay");
    clienttable = $("#client-frequency").find("tbody:last");
  }

  $.getJSON(api, function (data) {
    // Clear tables before filling them with data
    tablecontent.remove();
    let url, percentage;
    const sum = blocked ? data.blocked_queries : data.total_queries;

    // Add note if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.clients)) {
      clienttable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.clients.forEach(function (client) {
      // Sanitize client
      let clientname = client.name;
      if (clientname.length === 0) clientname = client.ip;
      url =
        '<a href="queries.lp?client_ip=' +
        encodeURIComponent(client.ip) +
        '">' +
        utils.escapeHtml(clientname) +
        "</a>";
      percentage = (client.count / sum) * 100;

      // Add row to table
      clienttable.append(
        "<tr> " +
          utils.addTD(url) +
          utils.addTD(client.count) +
          utils.addTD(utils.colorBar(percentage, sum, style)) +
          "</tr> "
      );
    });

    // Hide overlay
    overlay.hide();
  }).fail(function (data) {
    apiFailure(data);
  });
}

function updateTopDomainsTable(blocked) {
  let api, style, tablecontent, overlay, domaintable;
  if (blocked) {
    api = "/api/stats/top_domains?blocked=true";
    style = "queries-blocked";
    tablecontent = $("#ad-frequency td").parent();
    overlay = $("#ad-frequency .overlay");
    domaintable = $("#ad-frequency").find("tbody:last");
  } else {
    api = "/api/stats/top_domains";
    style = "queries-permitted";
    tablecontent = $("#domain-frequency td").parent();
    overlay = $("#domain-frequency .overlay");
    domaintable = $("#domain-frequency").find("tbody:last");
  }

  $.getJSON(api, function (data) {
    // Clear tables before filling them with data
    tablecontent.remove();
    let url, domain, percentage, urlText;
    const sum = blocked ? data.blocked_queries : data.total_queries;

    // Add note if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.domains)) {
      domaintable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.domains.forEach(function (item) {
      // Sanitize domain
      domain = encodeURIComponent(item.domain);
      // Substitute "." for empty domain lookups
      urlText = domain === "" ? "." : domain;
      url = '<a href="queries.lp?domain=' + domain + '">' + urlText + "</a>";
      percentage = (item.count / sum) * 100;
      domaintable.append(
        "<tr> " +
          utils.addTD(url) +
          utils.addTD(item.count) +
          utils.addTD(utils.colorBar(percentage, sum, style)) +
          "</tr> "
      );
    });

    overlay.hide();
  }).fail(function (data) {
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

function glowIfChanged(elem, textData) {
  if (elem.text() !== textData) {
    elem.addClass("glow");
    elem.text(textData);
  }
}

function updateSummaryData(runOnce = false) {
  $.getJSON("/api/stats/summary", function (data) {
    var intl = new Intl.NumberFormat();
    glowIfChanged($("span#dns_queries"), intl.format(parseInt(data.queries.total, 10)));
    glowIfChanged($("span#active_clients"), intl.format(parseInt(data.clients.active, 10)));
    $("a#total_clients").attr(
      "title",
      intl.format(parseInt(data.clients.total, 10)) + " total clients"
    );
    glowIfChanged($("span#blocked_queries"), intl.format(parseFloat(data.queries.blocked)));
    var formattedPercentage = utils.toPercent(data.queries.percent_blocked, 1);
    glowIfChanged($("span#percent_blocked"), formattedPercentage);
    glowIfChanged(
      $("span#gravity_size"),
      intl.format(parseInt(data.gravity.domains_being_blocked, 10))
    );

    setTimeout(function () {
      $("span.glow").removeClass("glow");
    }, 500);
  })
    .done(function () {
      if (!runOnce) utils.setTimer(updateSummaryData, REFRESH_INTERVAL.summary);
    })
    .fail(function (data) {
      utils.setTimer(updateSummaryData, 3 * REFRESH_INTERVAL.summary);
      apiFailure(data);
    });
}

function labelWithPercentage(tooltipLabel, skipZero = false) {
  // Sum all queries for the current time by iterating over all keys in the
  // current dataset
  let sum = 0;
  const keys = Object.keys(tooltipLabel.parsed._stacks.y);
  for (let i = 0; i < keys.length; i++) {
    if (tooltipLabel.parsed._stacks.y[i] === undefined) continue;
    sum += parseInt(tooltipLabel.parsed._stacks.y[i], 10);
  }

  let percentage = 0;
  const data = parseInt(tooltipLabel.parsed._stacks.y[tooltipLabel.datasetIndex], 10);
  if (sum > 0) {
    percentage = (100 * data) / sum;
  }

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

$(function () {
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
      onZoom: function ({ chart }) {
        // The first time the chart is zoomed, save the maximum initial scale bound
        if (!chart.absMax) chart.absMax = chart.getInitialScaleBounds().y.max;
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

  var gridColor = utils.getCSSval("graphs-grid", "background-color");
  var ticksColor = utils.getCSSval("graphs-ticks", "color");
  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  timeLineChart = new Chart(ctx, {
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
          itemSort: function (a, b) {
            return b.datasetIndex - a.datasetIndex;
          },
          callbacks: {
            title: function (tooltipTitle) {
              var label = tooltipTitle[0].label;
              var time = label.match(/(\d?\d):?(\d?\d?)/);
              var h = parseInt(time[1], 10);
              var m = parseInt(time[2], 10) || 0;
              var from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
              var to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
              return "Queries from " + from + " to " + to;
            },
            label: function (tooltipLabel) {
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
  var clientsChartEl = document.getElementById("clientsChart");
  if (clientsChartEl) {
    ctx = clientsChartEl.getContext("2d");
    clientsChart = new Chart(ctx, {
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
            itemSort: function (a, b) {
              return b.raw - a.raw;
            },
            callbacks: {
              title: function (tooltipTitle) {
                var label = tooltipTitle[0].label;
                var time = label.match(/(\d?\d):?(\d?\d?)/);
                var h = parseInt(time[1], 10);
                var m = parseInt(time[2], 10) || 0;
                var from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
                var to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
                return "Client activity from " + from + " to " + to;
              },
              label: function (tooltipLabel) {
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

  updateTopLists();

  $("#queryOverTimeChart").on("click", function (evt) {
    var activePoints = timeLineChart.getElementsAtEventForMode(
      evt,
      "nearest",
      { intersect: true },
      false
    );
    if (activePoints.length > 0) {
      //get the internal index
      var clickedElementindex = activePoints[0].index;
      //get specific label by index
      var label = timeLineChart.data.labels[clickedElementindex];

      //get value by index
      var from = label / 1000 - 300;
      var until = label / 1000 + 300;
      window.location.href = "queries.lp?from=" + from + "&until=" + until;
    }

    return false;
  });

  $("#clientsChart").on("click", function (evt) {
    var activePoints = clientsChart.getElementsAtEventForMode(
      evt,
      "nearest",
      { intersect: true },
      false
    );
    if (activePoints.length > 0) {
      //get the internal index
      var clickedElementindex = activePoints[0].index;

      //get specific label by index
      var label = clientsChart.data.labels[clickedElementindex];

      //get value by index
      var from = label / 1000 - 300;
      var until = label / 1000 + 300;
      window.location.href = "queries.lp?from=" + from + "&until=" + until;
    }

    return false;
  });

  if (document.getElementById("queryTypePieChart")) {
    ctx = document.getElementById("queryTypePieChart").getContext("2d");
    queryTypePieChart = new Chart(ctx, {
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
            borderColor: $(".box").css("background-color"),
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
              title: function () {
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

  if (document.getElementById("forwardDestinationPieChart")) {
    ctx = document.getElementById("forwardDestinationPieChart").getContext("2d");
    forwardDestinationPieChart = new Chart(ctx, {
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
            borderColor: $(".box").css("background-color"),
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
              title: function () {
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

//destroy all chartjs customTooltips on window resize
window.addEventListener("resize", function () {
  $(".chartjs-tooltip").remove();
});

// Tooltips
$(function () {
  $('[data-toggle="tooltip"]').tooltip({ html: true, container: "body" });
});
