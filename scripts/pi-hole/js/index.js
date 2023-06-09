/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false */

// Define global variables
var timeLineChart, clientsChart;
var queryTypePieChart, forwardDestinationPieChart;

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
  "#d2d6de",
];

var customTooltips = function (context) {
  var tooltip = context.tooltip;
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
    tooltipEl.style.padding = tooltip.options.padding + "px " + tooltip.options.padding + "px";
    tooltipEl.style.borderRadius = tooltip.options.cornerRadius + "px";
    tooltipEl.style.font = tooltip.options.bodyFont.string;
    tooltipEl.style.fontFamily = tooltip.options.bodyFont.family;
    tooltipEl.style.fontSize = tooltip.options.bodyFont.size / fontZoom + "px";
    tooltipEl.style.fontStyle = tooltip.options.bodyFont.style;
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
  var caretPadding = tooltip.options.caretPadding;
  var tooltipX, tooltipY, arrowX;
  var arrowMinIndent = 2 * tooltip.options.cornerRadius;
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
  $.getJSON("api.php?overTimeData10mins", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // convert received objects to arrays
    data.domains_over_time = utils.objectToArray(data.domains_over_time);
    data.ads_over_time = utils.objectToArray(data.ads_over_time);
    // remove last data point for line charts as it is not representative there
    if (utils.getGraphType() === "line") data.ads_over_time[0].splice(-1, 1);
    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets = [];

    var labels = ["Blocked DNS Queries", "Permitted DNS Queries"];
    var blockedColor = utils.getCSSval("queries-blocked", "background-color");
    var permittedColor = utils.getCSSval("queries-permitted", "background-color");
    var colors = [blockedColor, permittedColor];

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

    // Add data for each hour that is available
    for (var hour in data.ads_over_time[0]) {
      if (Object.prototype.hasOwnProperty.call(data.ads_over_time[0], hour)) {
        var h = parseInt(data.domains_over_time[0][hour], 10);
        var d =
          parseInt(data.ads_over_time[0][0], 10) < 1200
            ? new Date().setHours(Math.floor(h / 6), 10 * (h % 6), 0, 0)
            : new Date(1000 * h);

        timeLineChart.data.labels.push(d);
        var blocked = data.ads_over_time[1][hour];
        var permitted = data.domains_over_time[1][hour] - blocked;
        timeLineChart.data.datasets[0].data.push(blocked);
        timeLineChart.data.datasets[1].data.push(permitted);
      }
    }

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
  $.getJSON("api.php?getQueryTypes", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    var v = [],
      c = [],
      k = [],
      i = 0;
    // Collect values and colors, and labels
    var iter = Object.prototype.hasOwnProperty.call(data, "querytypes") ? data.querytypes : data;

    querytypeids = [];
    Object.keys(iter).forEach(function (key) {
      if (iter[key] > 0) {
        v.push(iter[key]);
        c.push(THEME_COLORS[i % THEME_COLORS.length]);
        k.push(key);
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
    queryTypePieChart.update();

    // Don't use rotation animation for further updates
    queryTypePieChart.options.animation.duration = 0;
  }).done(function () {
    // Reload graph after minute
    setTimeout(updateQueryTypesPie, 60000);
  });
}

function updateClientsOverTime() {
  $.getJSON("api.php?overTimeDataClients&getClientNames", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Remove graph if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.over_time)) {
      $("#clients").parent().remove();
      return;
    }

    // convert received objects to arrays
    data.over_time = utils.objectToArray(data.over_time);

    // remove last data point for line charts as it is not representative there
    if (utils.getGraphType() === "line") data.over_time[0].splice(-1, 1);
    var timestamps = data.over_time[0];
    var plotdata = data.over_time[1];
    var labels = [];
    var key;

    for (key in data.clients) {
      if (Object.prototype.hasOwnProperty.call(data.clients, key)) {
        var client = data.clients[key];
        labels.push(client.name.length > 0 ? client.name : client.ip);
      }
    }

    // Remove possibly already existing data
    clientsChart.data.labels = [];
    clientsChart.data.datasets = [];

    // Collect values and colors, and labels
    var numClients = 0;
    if (plotdata.length > 0) {
      numClients = plotdata[0].length;
    }

    for (var i = 0; i < numClients; i++) {
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
    for (var j in timestamps) {
      if (!Object.prototype.hasOwnProperty.call(timestamps, j)) {
        continue;
      }

      for (key in plotdata[j]) {
        if (Object.prototype.hasOwnProperty.call(plotdata[j], key)) {
          clientsChart.data.datasets[key].data.push(plotdata[j][key]);
        }
      }

      var d = new Date(1000 * parseInt(timestamps[j], 10));
      clientsChart.data.labels.push(d);
    }

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
    });
}

function updateForwardDestinationsPie() {
  $.getJSON("api.php?getForwardDestinations", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    var v = [],
      c = [],
      k = [],
      i = 0,
      values = [];

    // Collect values and colors
    Object.keys(data.forward_destinations).forEach(function (key) {
      var value = data.forward_destinations[key];

      if (key.indexOf("|") !== -1) {
        key = key.substr(0, key.indexOf("|"));
      }

      values.push([key, value, THEME_COLORS[i++ % THEME_COLORS.length]]);
    });

    // Show "Other" destination as the last graphic item and only if it's different than zero
    var other = values.splice(
      values.findIndex(arr => arr.includes("other")),
      1
    )[0];
    if (other[1] !== 0) {
      values.push(other);
    }

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
  }).done(function () {
    // Reload graph after one minute
    setTimeout(updateForwardDestinationsPie, 60000);
  });
}

function updateTopClientsChart() {
  $.getJSON("api.php?summaryRaw&getQuerySources&topClientsBlocked", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Clear tables before filling them with data
    $("#client-frequency td").parent().remove();
    var clienttable = $("#client-frequency").find("tbody:last");
    var client, percentage, clientname, clientip, idx, url;
    for (client in data.top_sources) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources, client)) {
        // Sanitize client
        if (utils.escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources[utils.escapeHtml(client)] = data.top_sources[client];
        }

        client = utils.escapeHtml(client);
        if (client.indexOf("|") === -1) {
          clientname = client;
          clientip = client;
        } else {
          idx = client.indexOf("|");
          clientname = client.substr(0, idx);
          clientip = client.substr(idx + 1, client.length - idx);
        }

        url =
          '<a href="queries.php?client=' +
          clientip +
          '" title="' +
          clientip +
          '">' +
          clientname +
          "</a>";
        percentage = (data.top_sources[client] / data.dns_queries_today) * 100;
        clienttable.append(
          "<tr> " +
            utils.addTD(url) +
            utils.addTD(data.top_sources[client]) +
            utils.addTD(utils.colorBar(percentage, data.dns_queries_today, "progress-bar-blue")) +
            "</tr> "
        );
      }
    }

    // Clear tables before filling them with data
    $("#client-frequency-blocked td").parent().remove();
    var clientblockedtable = $("#client-frequency-blocked").find("tbody:last");
    for (client in data.top_sources_blocked) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources_blocked, client)) {
        // Sanitize client
        if (utils.escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources_blocked[utils.escapeHtml(client)] = data.top_sources_blocked[client];
        }

        client = utils.escapeHtml(client);
        if (client.indexOf("|") === -1) {
          clientname = client;
          clientip = client;
        } else {
          idx = client.indexOf("|");
          clientname = client.substr(0, idx);
          clientip = client.substr(idx + 1, client.length - idx);
        }

        url =
          '<a href="queries.php?client=' +
          clientip +
          '&type=blocked" title="' +
          clientip +
          '">' +
          clientname +
          "</a>";
        percentage = (data.top_sources_blocked[client] / data.ads_blocked_today) * 100;
        clientblockedtable.append(
          "<tr> " +
            utils.addTD(url) +
            utils.addTD(data.top_sources_blocked[client]) +
            utils.addTD(utils.colorBar(percentage, data.ads_blocked_today, "progress-bar-blue")) +
            "</tr> "
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_sources)) {
      $("#client-frequency").parent().remove();
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_sources_blocked)) {
      $("#client-frequency-blocked").parent().remove();
    }

    $("#client-frequency .overlay").hide();
    $("#client-frequency-blocked .overlay").hide();
    // Update top clients list data every ten seconds
    setTimeout(updateTopClientsChart, 10000);
  });
}

function updateTopLists() {
  $.getJSON("api.php?summaryRaw&topItems", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Clear tables before filling them with data
    $("#domain-frequency td").parent().remove();
    $("#ad-frequency td").parent().remove();
    var domaintable = $("#domain-frequency").find("tbody:last");
    var adtable = $("#ad-frequency").find("tbody:last");
    var url, domain, percentage;
    for (domain in data.top_queries) {
      if (Object.prototype.hasOwnProperty.call(data.top_queries, domain)) {
        // Sanitize domain
        if (utils.escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_queries[utils.escapeHtml(domain)] = data.top_queries[domain];
        }

        domain = utils.escapeHtml(domain);
        url = '<a href="queries.php?domain=' + domain + '">' + domain + "</a>";
        percentage = (data.top_queries[domain] / data.dns_queries_today) * 100;
        domaintable.append(
          "<tr> " +
            utils.addTD(url) +
            utils.addTD(data.top_queries[domain]) +
            utils.addTD(utils.colorBar(percentage, data.dns_queries_today, "queries-permitted")) +
            "</tr> "
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_queries)) {
      $("#domain-frequency").parent().remove();
    }

    for (domain in data.top_ads) {
      if (Object.prototype.hasOwnProperty.call(data.top_ads, domain)) {
        // Sanitize domain
        if (utils.escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_ads[utils.escapeHtml(domain)] = data.top_ads[domain];
        }

        domain = utils.escapeHtml(domain);
        url = '<a href="queries.php?domain=' + domain + '">' + domain + "</a>";
        percentage = (data.top_ads[domain] / data.ads_blocked_today) * 100;
        adtable.append(
          "<tr> " +
            utils.addTD(url) +
            utils.addTD(data.top_ads[domain]) +
            utils.addTD(utils.colorBar(percentage, data.ads_blocked_today, "queries-blocked")) +
            "</tr> "
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_ads)) {
      $("#ad-frequency").parent().remove();
    }

    $("#domain-frequency .overlay").hide();
    $("#ad-frequency .overlay").hide();
    // Update top lists data every 10 seconds
    setTimeout(updateTopLists, 10000);
  });
}

var FTLoffline = false;
function updateSummaryData(runOnce) {
  var setTimer = function (timeInSeconds) {
    if (!runOnce) {
      setTimeout(updateSummaryData, timeInSeconds * 1000);
    }
  };

  $.getJSON("api.php?summaryRaw", function (data) {
    if ("FTLnotrunning" in data) {
      data.dns_queries_today = "Lost";
      data.ads_blocked_today = "connection";
      data.ads_percentage_today = "to";
      data.domains_being_blocked = "API";
      // Show spinner
      $("#queries-over-time .overlay").show();
      $("#forward-destinations-pie .overlay").show();
      $("#query-types-pie .overlay").show();
      $("#client-frequency .overlay").show();
      $("#domain-frequency .overlay").show();
      $("#ad-frequency .overlay").show();

      FTLoffline = true;
    } else if (FTLoffline) {
      // FTL was previously offline
      FTLoffline = false;
      updateQueriesOverTime();
      updateTopClientsChart();
      updateTopLists();
    }

    //Element name might have a different name to the property of the API so we split it at |
    [
      "ads_blocked_today|queries_blocked_today",
      "dns_queries_today",
      "ads_percentage_today|percentage_blocked_today",
      "unique_clients",
      "domains_being_blocked",
    ].forEach(function (arrayItem, idx) {
      var apiElName = arrayItem.split("|");
      var apiName = apiElName[0];
      var elName = apiElName[1];
      var $todayElement = elName ? $("span#" + elName) : $("span#" + apiName);

      var textData = data[apiName];
      if (!FTLoffline) {
        // Only format as number if FTL is online
        var formatter = new Intl.NumberFormat();

        // Round to one decimal place and format locale-aware
        var text = formatter.format(Math.round(data[apiName] * 10) / 10);
        textData = idx === 2 && data[apiName] !== "to" ? text + "%" : text;
      }

      if ($todayElement.text() !== textData && $todayElement.text() !== textData + "%") {
        $todayElement.addClass("glow");
        $todayElement.text(textData);
      }
    });

    if (Object.prototype.hasOwnProperty.call(data, "dns_queries_all_types")) {
      $("#total_queries").prop(
        "title",
        "only A + AAAA queries (" + data.dns_queries_all_types + " in total)"
      );
    }

    setTimeout(function () {
      $("span.glow").removeClass("glow");
    }, 500);
  })
    .done(function () {
      if (FTLoffline) {
        setTimer(10);
      } else {
        setTimer(1);
      }
    })
    .fail(function () {
      setTimer(300);
    });
}

function doughnutTooltip(tooltipLabel) {
  var percentageTotalShown = tooltipLabel.chart._metasets[0].total.toFixed(1);
  // tooltipLabel.chart._metasets[0].total returns the total percentage of the shown slices
  // to compensate rounding errors we round to one decimal

  var label = " " + tooltipLabel.label;
  var itemPercentage;

  // if we only show < 1% percent of all, show each item with two decimals
  if (percentageTotalShown < 1) {
    itemPercentage = tooltipLabel.parsed.toFixed(2);
  } else {
    // show with one decimal, but in case the item share is really small it could be rounded to 0.0
    // we compensate for this
    itemPercentage =
      tooltipLabel.parsed.toFixed(1) === "0.0" ? "< 0.1" : tooltipLabel.parsed.toFixed(1);
  }

  // even if no doughnut slice is hidden, sometimes percentageTotalShown is slightly less then 100
  // we therefore use 99.9 to decide if slices are hidden (we only show with 0.1 precision)
  if (percentageTotalShown > 99.9) {
    // All items shown
    return label + ": " + itemPercentage + "%";
  } else {
    // set percentageTotalShown again without rounding to account
    // for cases where the total shown percentage would be <0.1% of all
    percentageTotalShown = tooltipLabel.chart._metasets[0].total;
    return (
      label +
      ":<br>&bull; " +
      itemPercentage +
      "% of all queries<br>&bull; " +
      ((tooltipLabel.parsed * 100) / percentageTotalShown).toFixed(1) +
      "% of shown items"
    );
  }
}

var maxlogage = "24";
function getMaxlogage() {
  $.getJSON("api.php?getMaxlogage", function (data) {
    if (!("FTLnotrunning" in data)) {
      maxlogage = data.maxlogage;
    }
  }).done(function () {
    $(".maxlogage-interval").html(maxlogage);
  });
}

// chartjs plugin used by the custom doughnut legend
const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector("ul");

  if (!listContainer) {
    listContainer = document.createElement("ul");
    listContainer.style.display = "flex";
    listContainer.style.flexDirection = "column";
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.append(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    items.forEach(item => {
      const li = document.createElement("li");
      li.style.alignItems = "center";
      li.style.cursor = "pointer";
      li.style.display = "flex";
      li.style.flexDirection = "row";

      // Color checkbox (toggle visibility)
      const boxSpan = document.createElement("span");
      boxSpan.title = "Toggle visibility";
      boxSpan.style.color = item.fillStyle;
      boxSpan.style.display = "inline-block";
      boxSpan.style.margin = "0 10px";
      boxSpan.innerHTML = item.hidden
        ? '<i class="colorBoxWrapper fa fa-square"></i>'
        : '<i class="colorBoxWrapper fa fa-check-square"></i>';

      boxSpan.addEventListener("click", () => {
        const { type } = chart.config;

        if (type === "pie" || type === "doughnut") {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex, !chart.isDatasetVisible(item.datasetIndex));
        }

        chart.update();
      });

      // Text (link to query log page)
      const textLink = document.createElement("p");
      textLink.title = "List " + item.text + " queries";
      textLink.style.color = item.fontColor;
      textLink.style.margin = 0;
      textLink.style.padding = 0;
      textLink.style.textDecoration = item.hidden ? "line-through" : "";
      textLink.className = "legend-label-text";
      textLink.append(item.text);

      textLink.addEventListener("click", () => {
        if (chart.canvas.id === "queryTypePieChart") {
          window.location.href = "queries.php?querytype=" + querytypeids[item.index];
        } else if (chart.canvas.id === "forwardDestinationPieChart") {
          window.location.href = "queries.php?forwarddest=" + encodeURIComponent(item.text);
        }
      });

      li.append(boxSpan, textLink);
      ul.append(li);
    });
  },
};

$(function () {
  // Pull in data via AJAX
  getMaxlogage();
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

  // Create / load "Top Domains" and "Top Advertisers" only if authorized
  if (document.getElementById("domain-frequency") && document.getElementById("ad-frequency")) {
    updateTopLists();
  }

  // Create / load "Top Clients" only if authorized
  if (document.getElementById("client-frequency")) {
    updateTopClientsChart();
  }

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
      window.location.href = "queries.php?from=" + from + "&until=" + until;
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
      window.location.href = "queries.php?from=" + from + "&until=" + until;
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
