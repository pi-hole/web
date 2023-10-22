/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false, apiFailure:false, THEME_COLORS:false, customTooltips:false, htmlLegendPlugin:false,doughnutTooltip:false */

// Define global variables
var timeLineChart, clientsChart;
var queryTypePieChart, forwardDestinationPieChart;

// Functions to update data in page

var failures = 0;
function updateQueriesOverTime() {
  $.getJSON("/api/history", function (data) {
    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets = [];

    var labels = ["Blocked DNS Queries", "Cached DNS Queries", "Forwarded DNS Queries"];
    var cachedColor = utils.getCSSval("queries-cached", "background-color");
    var blockedColor = utils.getCSSval("queries-blocked", "background-color");
    var permittedColor = utils.getCSSval("queries-permitted", "background-color");
    var colors = [blockedColor, cachedColor, permittedColor];

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
      var blocked = item.blocked;
      var cached = item.cached;
      var permitted = item.total - (blocked + cached);
      timeLineChart.data.datasets[0].data.push(blocked);
      timeLineChart.data.datasets[1].data.push(cached);
      timeLineChart.data.datasets[2].data.push(permitted);
    });

    $("#queries-over-time .overlay").hide();
    timeLineChart.update();
  })
    .done(function () {
      // Reload graph after 10 minutes
      failures = 0;
      setTimeout(updateQueriesOverTime, 600000);
    })
    .fail(function () {
      failures++;
      if (failures < 5) {
        // Try again after 1 minute only if this has not failed more
        // than five times in a row
        setTimeout(updateQueriesOverTime, 60000);
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
    queryTypePieChart.update();

    // Don't use rotation animation for further updates
    queryTypePieChart.options.animation.duration = 0;
  })
    .done(function () {
      // Reload graph after minute
      setTimeout(updateQueryTypesPie, 60000);
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
      $("#clients-over-time").parent().remove();
      return;
    }

    // remove last data point for line charts as it is not representative there
    if (utils.getGraphType() === "line") data.history.splice(-1, 1);

    var i,
      labels = [];
    data.clients.forEach(function (client) {
      labels.push(client.name !== null ? client.name : client.ip);
    });

    // Remove possibly already existing data
    clientsChart.data.labels = [];
    clientsChart.data.datasets = [];

    for (i = 0; i < data.clients.length; i++) {
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
    data.clients.forEach(function (i, c) {
      data.history.forEach(function (item) {
        clientsChart.data.datasets[c].data.push(item.data[c]);
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
      setTimeout(updateClientsOverTime, 600000);
    })
    .fail(function () {
      failures++;
      if (failures < 5) {
        // Try again after 1 minute only if this has not failed more
        // than five times in a row
        setTimeout(updateClientsOverTime, 60000);
      }
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

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
      var label = item.ip;
      if (item.port > 0) {
        label += "#" + item.port;
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
    forwardDestinationPieChart.update();

    // Don't use rotation animation for further updates
    forwardDestinationPieChart.options.animation.duration = 0;
  })
    .done(function () {
      // Reload graph after one minute
      setTimeout(updateForwardDestinationsPie, 60000);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

function updateTopClientsTable(blocked) {
  var api, style, tablecontent, overlay, clienttable;
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
    var url,
      percentage,
      sum = blocked ? data.blocked_queries : data.total_queries;

    // Add note if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.clients)) {
      clienttable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.clients.forEach(function (client) {
      // Sanitize client
      var clientname = utils.escapeHtml(client.name);
      var clientip = utils.escapeHtml(client.ip);
      if (clientname.length === 0) clientname = clientip;
      url = '<a href="queries.lp?client_ip=' + clientip + '">' + clientname + "</a>";
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
  var api, style, tablecontent, overlay, domaintable;
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
    var url,
      domain,
      percentage,
      urlText,
      sum = blocked ? data.blocked_queries : data.total_queries;

    // Add note if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.domains)) {
      domaintable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.domains.forEach(function (item) {
      // Sanitize domain
      domain = utils.escapeHtml(item.domain);
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
  setTimeout(updateTopLists, 10000);
}

function glowIfChanged(elem, textData) {
  if (elem.text() !== textData) {
    elem.addClass("glow");
    elem.text(textData);
  }
}

function updateSummaryData(runOnce) {
  var setTimer = function (timeInSeconds) {
    if (!runOnce) {
      setTimeout(updateSummaryData, timeInSeconds * 1000);
    }
  };

  $.getJSON("/api/stats/summary", function (data) {
    var intl = new Intl.NumberFormat();
    glowIfChanged($("span#dns_queries"), intl.format(parseInt(data.queries.total, 10)));
    glowIfChanged($("span#active_clients"), intl.format(parseInt(data.clients.active, 10)));
    $("a#total_clients").attr(
      "title",
      intl.format(parseInt(data.clients.total, 10)) + " total clients"
    );
    glowIfChanged($("span#blocked_queries"), intl.format(parseFloat(data.queries.blocked)));
    glowIfChanged(
      $("span#percent_blocked"),
      parseFloat(data.queries.percent_blocked).toFixed(1) + "%"
    );
    glowIfChanged(
      $("span#gravity_size"),
      intl.format(parseInt(data.gravity.domains_being_blocked, 10))
    );

    setTimeout(function () {
      $("span.glow").removeClass("glow");
    }, 500);
  })
    .done(function () {
      setTimer(1);
    })
    .fail(function (data) {
      setTimer(300);
      apiFailure(data);
    });
}

$(function () {
  // Pull in data via AJAX
  updateSummaryData();

  var gridColor = utils.getCSSval("graphs-grid", "background-color");
  var ticksColor = utils.getCSSval("graphs-ticks", "color");
  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  timeLineChart = new Chart(ctx, {
    type: utils.getGraphType(),
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
              var label = tooltipLabel.dataset.label;
              // Add percentage only for blocked queries
              if (tooltipLabel.datasetIndex === 0) {
                var percentage = 0;
                var permitted = parseInt(tooltipLabel.parsed._stacks.y[1], 10);
                var blocked = parseInt(tooltipLabel.parsed._stacks.y[0], 10);
                if (permitted + blocked > 0) {
                  percentage = (100 * blocked) / (permitted + blocked);
                }

                label += ": " + tooltipLabel.parsed.y + " (" + percentage.toFixed(1) + "%)";
              } else {
                label += ": " + tooltipLabel.parsed.y;
              }

              return label;
            },
          },
        },
      },
      scales: {
        xAxes: {
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
            drawBorder: false,
          },
          ticks: {
            color: ticksColor,
          },
        },
        yAxes: {
          stacked: true,
          beginAtZero: true,
          ticks: {
            color: ticksColor,
            precision: 0,
          },
          grid: {
            color: gridColor,
            drawBorder: false,
          },
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
      type: utils.getGraphType(),
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
            },
          },
        },
        scales: {
          xAxes: {
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
              drawBorder: false,
            },
            ticks: {
              color: ticksColor,
            },
          },
          yAxes: {
            beginAtZero: true,
            ticks: {
              color: ticksColor,
              precision: 0,
            },
            stacked: true,
            grid: {
              color: gridColor,
              drawBorder: false,
            },
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
