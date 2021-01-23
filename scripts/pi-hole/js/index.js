/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false, updateInfo: false */

// Define global variables
var timeLineChart, clientsChart;
var queryTypePieChart, forwardDestinationPieChart;
var indexPage;

var THEME_COLORS = [
  "#f56954",
  "#3c8dbc",
  "#00a65a",
  "#00c0ef",
  "#f39c12",
  "#0073b7",
  "#001f3f",
  "#39cccc",
  "#3d9970",
  "#01ff70",
  "#ff851b",
  "#f012be",
  "#8e24aa",
  "#d81b60",
  "#222222",
  "#d2d6de"
];

var customTooltips = function (tooltip) {
  var tooltipEl = document.getElementById(this._chart.canvas.id + "-customTooltip");
  if (!tooltipEl) {
    // Create Tooltip Element once per chart
    tooltipEl = document.createElement("div");
    tooltipEl.id = this._chart.canvas.id + "-customTooltip";
    tooltipEl.classList.add("chartjs-tooltip");
    tooltipEl.innerHTML = "<div class='arrow'></div> <table></table>";
    // avoid browser's font-zoom since we know that <body>'s
    // font-size was set to 14px by bootstrap's css
    var fontZoom = parseFloat($("body").css("font-size")) / 14;
    // set styles and font
    tooltipEl.style.padding = tooltip.yPadding + "px " + tooltip.xPadding + "px";
    tooltipEl.style.borderRadius = tooltip.cornerRadius + "px";
    tooltipEl.style.fontFamily = tooltip._bodyFontFamily;
    tooltipEl.style.fontSize = tooltip.bodyFontSize / fontZoom + "px";
    tooltipEl.style.fontStyle = tooltip._bodyFontStyle;
    // append Tooltip next to canvas-containing box
    tooltipEl.ancestor = this._chart.canvas.closest(".box[id]").parentNode;
    tooltipEl.ancestor.append(tooltipEl);
  }

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set caret position
  tooltipEl.classList.remove("left", "right", "center", "top", "bottom");
  tooltipEl.classList.add(tooltip.xAlign, tooltip.yAlign);

  // Set Text
  if (tooltip.body) {
    var titleLines = tooltip.title || [];
    var bodyLines = tooltip.body.map(function (bodyItem) {
      return bodyItem.lines;
    });
    var innerHtml = "<thead>";

    titleLines.forEach(function (title) {
      innerHtml += "<tr><th>" + title + "</th></tr>";
    });
    innerHtml += "</thead><tbody>";
    var printed = 0;

    var devicePixel = (1 / window.devicePixelRatio).toFixed(1);
    bodyLines.forEach(function (body, i) {
      var labelColors = tooltip.labelColors[i];
      var style = "background-color: " + labelColors.backgroundColor;
      style += "; outline: 1px solid " + labelColors.backgroundColor;
      style += "; border: " + devicePixel + "px solid #fff";
      var span = "<span class='chartjs-tooltip-key' style='" + style + "'></span>";

      var num = body[0].split(": ");
      // do not display entries with value of 0 (in bar chart),
      // but pass through entries with "0.0% (in pie charts)
      if (num[1] !== "0") {
        innerHtml += "<tr><td>" + span + body + "</td></tr>";
        printed++;
      }
    });
    if (printed < 1) {
      innerHtml += "<tr><td>No activity recorded</td></tr>";
    }

    innerHtml += "</tbody>";

    var tableRoot = tooltipEl.querySelector("table");
    tableRoot.innerHTML = innerHtml;
  }

  var canvasPos = this._chart.canvas.getBoundingClientRect();
  var boxPos = tooltipEl.ancestor.getBoundingClientRect();
  var offsetX = canvasPos.left - boxPos.left;
  var offsetY = canvasPos.top - boxPos.top;
  var tooltipWidth = tooltipEl.offsetWidth;
  var tooltipHeight = tooltipEl.offsetHeight;
  var caretX = tooltip.caretX;
  var caretY = tooltip.caretY;
  var caretPadding = tooltip.caretPadding;
  var tooltipX, tooltipY, arrowX;
  var arrowMinIndent = 2 * tooltip.cornerRadius;
  var arrowSize = 5;

  // Compute X position
  if ($(document).width() > 2 * tooltip.width || tooltip.xAlign !== "center") {
    // If the viewport is wide enough, let the tooltip follow the caret position
    tooltipX = offsetX + caretX;
    if (tooltip.yAlign === "top" || tooltip.yAlign === "bottom") {
      switch (tooltip.xAlign) {
        case "center":
          // set a minimal X position to 5px to prevent
          // the tooltip to stick out left of the viewport
          var minX = 5;
          if (2 * tooltipX < tooltipWidth + minX) {
            arrowX = tooltipX - minX;
            tooltipX = minX;
          } else {
            tooltipX -= tooltipWidth / 2;
          }

          break;
        case "left":
          tooltipX -= arrowMinIndent;
          arrowX = arrowMinIndent;
          break;
        case "right":
          tooltipX -= tooltipWidth - arrowMinIndent;
          arrowX = tooltipWidth - arrowMinIndent;
          break;
        default:
          break;
      }
    } else if (tooltip.yAlign === "center") {
      switch (tooltip.xAlign) {
        case "left":
          tooltipX += caretPadding;
          break;
        case "right":
          tooltipX -= tooltipWidth - caretPadding;
          break;
        case "center":
          tooltipX -= tooltipWidth / 2;
          break;
        default:
          break;
      }
    }
  } else {
    // compute the tooltip's center inside ancestor element
    tooltipX = (tooltipEl.ancestor.offsetWidth - tooltipWidth) / 2;
    // move the tooltip if the arrow would stick out to the left
    if (offsetX + caretX - arrowMinIndent < tooltipX) {
      tooltipX = offsetX + caretX - arrowMinIndent;
    }

    // move the tooltip if the arrow would stick out to the right
    if (offsetX + caretX - tooltipWidth + arrowMinIndent > tooltipX) {
      tooltipX = offsetX + caretX - tooltipWidth + arrowMinIndent;
    }

    arrowX = offsetX + caretX - tooltipX;
  }

  // Compute Y position
  switch (tooltip.yAlign) {
    case "top":
      tooltipY = offsetY + caretY + arrowSize + caretPadding;
      break;
    case "center":
      tooltipY = offsetY + caretY - tooltipHeight / 2;
      if (tooltip.xAlign === "left") {
        tooltipX += arrowSize;
      } else if (tooltip.xAlign === "right") {
        tooltipX -= arrowSize;
      }

      break;
    case "bottom":
      tooltipY = offsetY + caretY - tooltipHeight - arrowSize - caretPadding;
      break;
    default:
      break;
  }

  // Position tooltip and display
  tooltipEl.style.top = tooltipY.toFixed(1) + "px";
  tooltipEl.style.left = tooltipX.toFixed(1) + "px";
  if (arrowX === undefined) {
    tooltipEl.querySelector(".arrow").style.left = "";
  } else {
    // Calculate percentage X value depending on the tooltip's
    // width to avoid hanging arrow out on tooltip width changes
    var arrowXpercent = ((100 / tooltipWidth) * arrowX).toFixed(1);
    tooltipEl.querySelector(".arrow").style.left = arrowXpercent + "%";
  }

  tooltipEl.style.opacity = 1;
};

// Functions to update data in page

var failures = 0;
function updateQueriesOverTime() {
  $.getJSON("/api/stats/overTime/history", function (data) {
    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets = [];

    var labels = ["Blocked DNS Queries", "Cached DNS Queries", "Forwarded DNS Queries"];
    var blockedColor = $(".queries-blocked").css("background-color");
    var cachedColor = $(".queries-cached").css("background-color");
    var permittedColor = $(".queries-permitted").css("background-color");
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
        cubicInterpolationMode: "monotone"
      });
    }

    // Add data for each dataset that is available
    data.data.forEach(function (item) {
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
    });
}

var querytypeids = [];
function updateQueryTypesPie() {
  $.getJSON("/api/stats/query_types", function (data) {
    var v = [],
      c = [],
      k = [],
      i = 0,
      sum = 0;

    // Compute total number of queries
    data.forEach(function (item) {
      sum += item.count;
    });

    // Fill chart with data (only include query types which appeared recently)
    querytypeids = [];
    data.forEach(function (item) {
      if (item.count > 0) {
        v.push((100 * item.count) / sum);
        c.push(THEME_COLORS[i % THEME_COLORS.length]);
        k.push(item.name);
        querytypeids.push(i + 1);
      }

      i++;
    });

    // Build a single dataset with the data to be pushed
    var dd = { data: v, backgroundColor: c };
    // and push it at once
    queryTypePieChart.data.datasets[0] = dd;
    queryTypePieChart.data.labels = k;
    $("#query-types-pie .overlay").hide();
    queryTypePieChart.chart.config.options.cutoutPercentage = 50;
    queryTypePieChart.update();
    // Don't use rotation animation for further updates
    queryTypePieChart.options.animation.duration = 0;
    // Generate legend in separate div
    $("#query-types-legend").html(queryTypePieChart.generateLegend());
    $("#query-types-legend > ul > li").on("mousedown", function (e) {
      if (e.which === 2) {
        // which == 2 is middle mouse button
        $(this).toggleClass("strike");
        var index = $(this).index();
        var ci = e.view.queryTypePieChart;
        var mobj = ci.data.datasets[0]._meta;
        var metas = Object.keys(mobj).map(function (e) {
          return mobj[e];
        });
        metas.forEach(function (meta) {
          var curr = meta.data[index];
          curr.hidden = !curr.hidden;
        });

        ci.update();
      } else if (e.which === 1) {
        // which == 1 is left mouse button
        window.open("queries.php?querytype=" + querytypeids[$(this).index()], "_self");
      }
    });
  }).done(function () {
    // Reload graph after minute
    setTimeout(updateQueryTypesPie, 60000);
  });
}

function updateClientsOverTime() {
  $.getJSON("/api/stats/overTime/clients", function (data) {
    // Remove graph if there are no results (e.g. new
    // installation or privacy mode enabled)
    if (jQuery.isEmptyObject(data.data)) {
      $("#clients-over-time").parent().remove();
      return;
    }

    var i,
      labels = [];
    data.clients.forEach(function (client) {
      labels.push(client.name.length > 0 ? client.name : client.ip);
    });

    // Remove possibly already existing data
    clientsChart.data.labels = [];
    clientsChart.data.datasets = [];

    // Collect values and colors, and labels
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
        cubicInterpolationMode: "monotone"
      });
    }

    // Add data for each dataset that is available
    data.clients.forEach(function (i, c) {
      data.data.forEach(function (item) {
        clientsChart.data.datasets[c].data.push(item.data[c]);
      });
    });

    // Extract data timestamps
    data.data.forEach(function (item) {
      var d = new Date(1000 * parseInt(item.timestamp, 10));
      clientsChart.data.labels.push(d);
    });

    $("#clients-over-time .overlay").hide();
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
      if (item.name.length > 0) {
        label = item.ip;
      }

      var percent = (100 * item.count) / sum;
      values.push([label, percent, THEME_COLORS[i++ % THEME_COLORS.length]]);
    });

    // Split data into individual arrays for the graphs
    values.forEach(function (item) {
      k.push(item[0]);
      v.push(item[1]);
      c.push(item[2]);
    });

    // Build a single dataset with the data to be pushed
    var dd = { data: v, backgroundColor: c };
    // and push it at once
    forwardDestinationPieChart.data.labels = k;
    forwardDestinationPieChart.data.datasets[0] = dd;
    // and push it at once
    $("#forward-destinations-pie .overlay").hide();
    forwardDestinationPieChart.chart.config.options.cutoutPercentage = 50;
    forwardDestinationPieChart.update();
    // Don't use rotation animation for further updates
    forwardDestinationPieChart.options.animation.duration = 0;
    // Generate legend in separate div
    $("#forward-destinations-legend").html(forwardDestinationPieChart.generateLegend());
    $("#forward-destinations-legend > ul > li").on("mousedown", function (e) {
      if (e.which === 2) {
        // which == 2 is middle mouse button
        $(this).toggleClass("strike");
        var index = $(this).index();
        var ci = e.view.forwardDestinationPieChart;
        var mobj = ci.data.datasets[0]._meta;
        var metas = Object.keys(mobj).map(function (e) {
          return mobj[e];
        });
        metas.forEach(function (meta) {
          var curr = meta.data[index];
          curr.hidden = !curr.hidden;
        });

        ci.update();
      } else if (e.which === 1) {
        // which == 1 is left mouse button
        var obj = encodeURIComponent(e.target.textContent);
        if (obj.length > 0) {
          window.open("queries.php?forwarddest=" + obj, "_self");
        }
      }
    });
  }).done(function () {
    // Reload graph after one minute
    setTimeout(updateForwardDestinationsPie, 60000);
  });
}

// Credit: http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript/4835406#4835406
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };

  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
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
    if (jQuery.isEmptyObject(data.top_domains)) {
      domaintable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.top_domains.forEach(function (item) {
      // Sanitize domain
      domain = escapeHtml(item.domain);
      // Substitute "." for empty domain lookups
      urlText = domain === "" ? "." : domain;
      url = '<a href="queries.php?domain=' + domain + '">' + urlText + "</a>";
      percentage = (item.count / sum) * 100;

      domaintable.append(
        "<tr> <td>" +
          url +
          "</td> <td>" +
          item.count +
          '</td> <td> <div class="progress progress-sm" title="' +
          percentage.toFixed(1) +
          "% of " +
          sum +
          '"> <div class="progress-bar ' +
          style +
          '" style="width: ' +
          percentage +
          '%"></div> </div> </td> </tr> '
      );
    });

    overlay.hide();
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
    if (jQuery.isEmptyObject(data.top_clients)) {
      clienttable.append('<tr><td colspan="3"><center>- No data -</center></td></tr>');
    }

    // Populate table with content
    data.top_clients.forEach(function (client) {
      // Sanitize client
      var clientname = escapeHtml(client.name);
      var clientip = escapeHtml(client.ip);
      if (clientname.length === 0) clientname = clientip;
      url = '<a href="queries.php?client=' + clientip + '">' + clientname + "</a>";
      percentage = (client.count / sum) * 100;

      clienttable.append(
        "<tr> <td>" +
          url +
          "</td> <td>" +
          client.count +
          '</td> <td> <div class="progress progress-sm" title="' +
          percentage.toFixed(1) +
          "% of " +
          sum +
          '"> <div class="progress-bar ' +
          style +
          '" style="width: ' +
          percentage +
          '%"></div> </div> </td> </tr> '
      );
    });

    overlay.hide();
  });
}

var FTLoffline = false;
function updateSummaryData(runOnce) {
  var setTimer = function (timeInSeconds) {
    if (!runOnce) {
      setTimeout(updateSummaryData, timeInSeconds * 1000);
    }
  };

  $.getJSON("/api/stats/summary", function (data) {
    //Element name might have a different name to the property of the API so we split it at |
    var intl = new Intl.NumberFormat();
    ["blocked_queries", "dns_queries", "percent_blocked", "total_clients", "gravity_size"].forEach(
      function (arrayItem) {
        var $todayElement = $("span#" + arrayItem);
        var textData = "";
        textData = arrayItem === "gravity_size" ? data.ftl.gravity : data[arrayItem];
        if (arrayItem === "dns_queries") {
          var sum = 0;
          Object.entries(data.total_queries).forEach(function (arrayItem) {
            sum += arrayItem[1];
          });
          textData = intl.format(sum);
        } else if (arrayItem === "percent_blocked") {
          textData = textData.toFixed(1) + "%";
        } else {
          textData = intl.format(textData);
        }

        if ($todayElement.text() !== textData) {
          $todayElement.addClass("glow");
          $todayElement.text(textData);
        }
      }
    );

    updateInfo(data);

    setTimeout(function () {
      $("span.glow").removeClass("glow");
    }, 500);
  })
    .done(function () {
      if (!FTLoffline) {
        setTimer(1);
      } else {
        setTimer(10);
      }
    })
    .fail(function () {
      setTimer(300);
    });
}

/*eslint-disable no-unused-vars*/
function onAuth(okay) {
  /*eslint-enable no-unused-vars*/
  if (okay === true) {
    // Okay, show graphs ...
    $("#clients-over-time").show();
    $("#query-types-pie").show();
    $("#domain-frequency").show();
    $("#ad-frequency").show();
    $("#client-frequency").show();
    $("#client-frequency-blocked").show();
    $("#forward-destinations-pie").show();
    // ... and trigger updates of the advanced graphs
    createAdvancedGraphs();
    updateTopLists();
  } else {
    // Hide graphs
    $("#clients-over-time").hide();
    $("#query-types-pie").hide();
    $("#domain-frequency").hide();
    $("#ad-frequency").hide();
    $("#client-frequency").hide();
    $("#client-frequency-blocked").hide();
    $("#forward-destinations-pie").hide();
  }
}

function doughnutTooltip(tooltipItems, data) {
  var dataset = data.datasets[tooltipItems.datasetIndex];
  var label = data.labels[tooltipItems.index];
  // Compute share of total and of displayed
  var scale = 0,
    total = 0;
  var metas = Object.keys(dataset._meta).map(function (e) {
    return dataset._meta[e];
  });
  metas.forEach(function (meta) {
    meta.data.forEach(function (val, i) {
      if (val.hidden) scale += dataset.data[i];
      total += dataset.data[i];
    });
  });
  if (scale === 0)
    // All items shown
    return label + ": " + dataset.data[tooltipItems.index].toFixed(1) + "%";
  return (
    label +
    ":<br>- " +
    dataset.data[tooltipItems.index].toFixed(1) +
    "% of all queries<br>- " +
    ((dataset.data[tooltipItems.index] * 100) / (total - scale)).toFixed(1) +
    "% of shown items"
  );
}

$(function () {
  // Signal footer.js that this is the index page which takes
  // care of updating the system information itself
  indexPage = true; // eslint-disable-line no-unused-vars
  // These two can always be done, even without authentication
  updateSummaryData();
  updateQueriesOverTime();

  var gridColor = $(".graphs-grid").css("background-color");
  var ticksColor = $(".graphs-ticks").css("color");
  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  timeLineChart = new Chart(ctx, {
    type: utils.getGraphType(),
    data: {
      labels: [],
      datasets: [{ data: [] }]
    },
    options: {
      tooltips: {
        enabled: true,
        mode: "x-axis",
        itemSort: function (a, b) {
          return b.datasetIndex - a.datasetIndex;
        },
        callbacks: {
          title: function (tooltipItem) {
            var label = tooltipItem[0].xLabel;
            var time = label.match(/(\d?\d):?(\d?\d?)/);
            var h = parseInt(time[1], 10);
            var m = parseInt(time[2], 10) || 0;
            var from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
            var to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
            return "Queries from " + from + " to " + to;
          },
          label: function (tooltipItems, data) {
            var percentage = 0;
            var current = parseInt(tooltipItems.yLabel, 10);
            var blocked = parseInt(data.datasets[0].data[tooltipItems.index], 10);
            var cached = parseInt(data.datasets[1].data[tooltipItems.index], 10);
            var forwarded = parseInt(data.datasets[2].data[tooltipItems.index], 10);
            var total = blocked + cached + forwarded;
            if (total > 0) {
              percentage = (100 * current) / total;
            }

            return (
              data.datasets[tooltipItems.datasetIndex].label +
              ": " +
              current +
              " (" +
              percentage.toFixed(1) +
              "%)"
            );
          }
        }
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [
          {
            type: "time",
            stacked: true,
            time: {
              unit: "hour",
              displayFormats: {
                hour: "HH:mm"
              },
              tooltipFormat: "HH:mm"
            },
            gridLines: {
              color: gridColor
            },
            ticks: {
              fontColor: ticksColor
            }
          }
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              beginAtZero: true,
              fontColor: ticksColor
            },
            gridLines: {
              color: gridColor
            }
          }
        ]
      },
      maintainAspectRatio: false
    }
  });

  $("#queryOverTimeChart").click(function (evt) {
    var activePoints = timeLineChart.getElementAtEvent(evt);
    if (activePoints.length > 0) {
      //get the internal index of slice in pie chart
      var clickedElementindex = activePoints[0]._index;

      //get specific label by index
      var label = timeLineChart.data.labels[clickedElementindex];

      //get value by index
      var from = label / 1000 - 300;
      var until = label / 1000 + 300;
      window.location.href = "queries.php?from=" + from + "&until=" + until;
    }

    return false;
  });
});

function createAdvancedGraphs() {
  var gridColor = $(".graphs-grid").css("background-color");
  var ticksColor = $(".graphs-ticks").css("color");

  // Create "Top Clients over Time"
  var ctx = document.getElementById("clientsChart").getContext("2d");
  clientsChart = new Chart(ctx, {
    type: utils.getGraphType(),
    data: {
      labels: [],
      datasets: [{ data: [] }]
    },
    options: {
      tooltips: {
        enabled: false,
        mode: "x-axis",
        custom: customTooltips,
        yAlign: "top",
        itemSort: function (a, b) {
          return b.yLabel - a.yLabel;
        },
        callbacks: {
          title: function (tooltipItem) {
            var label = tooltipItem[0].xLabel;
            var time = label.match(/(\d?\d):?(\d?\d?)/);
            var h = parseInt(time[1], 10);
            var m = parseInt(time[2], 10) || 0;
            var from = utils.padNumber(h) + ":" + utils.padNumber(m - 5) + ":00";
            var to = utils.padNumber(h) + ":" + utils.padNumber(m + 4) + ":59";
            return "Client activity from " + from + " to " + to;
          },
          label: function (tooltipItems, data) {
            return data.datasets[tooltipItems.datasetIndex].label + ": " + tooltipItems.yLabel;
          }
        }
      },
      legend: {
        display: false
      },
      scales: {
        xAxes: [
          {
            type: "time",
            stacked: true,
            time: {
              unit: "hour",
              displayFormats: {
                hour: "HH:mm"
              },
              tooltipFormat: "HH:mm"
            },
            gridLines: {
              color: gridColor
            },
            ticks: {
              fontColor: ticksColor
            }
          }
        ],
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
              fontColor: ticksColor
            },
            stacked: true,
            gridLines: {
              color: gridColor
            }
          }
        ]
      },
      maintainAspectRatio: false,
      hover: {
        animationDuration: 0
      }
    }
  });
  updateClientsOverTime();

  $("#clientsChart").click(function (evt) {
    var activePoints = clientsChart.getElementAtEvent(evt);
    if (activePoints.length > 0) {
      //get the internal index of slice in pie chart
      var clickedElementindex = activePoints[0]._index;

      //get specific label by index
      var label = clientsChart.data.labels[clickedElementindex];

      //get value by index
      var from = label / 1000 - 300;
      var until = label / 1000 + 300;
      window.location.href = "queries.php?from=" + from + "&until=" + until;
    }

    return false;
  });

  ctx = document.getElementById("queryTypePieChart").getContext("2d");
  queryTypePieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{ data: [] }]
    },
    options: {
      elements: {
        arc: {
          borderColor: $(".box").css("background-color")
        }
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        custom: customTooltips,
        callbacks: {
          title: function () {
            return "Query types";
          },
          label: function (tooltipItems, data) {
            return doughnutTooltip(tooltipItems, data);
          }
        }
      },
      animation: {
        duration: 750
      },
      cutoutPercentage: 0
    }
  });
  updateQueryTypesPie();

  ctx = document.getElementById("forwardDestinationPieChart").getContext("2d");
  forwardDestinationPieChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{ data: [] }]
    },
    options: {
      elements: {
        arc: {
          borderColor: $(".box").css("background-color")
        }
      },
      legend: {
        display: false
      },
      tooltips: {
        enabled: false,
        custom: customTooltips,
        callbacks: {
          title: function () {
            return "Forward destinations";
          },
          label: function (tooltipItems, data) {
            return doughnutTooltip(tooltipItems, data);
          }
        }
      },
      animation: {
        duration: 750
      },
      cutoutPercentage: 0
    }
  });
  updateForwardDestinationsPie();
}

//destroy all chartjs customTooltips on window resize
window.addEventListener("resize", function () {
  $(".chartjs-tooltip").remove();
});
