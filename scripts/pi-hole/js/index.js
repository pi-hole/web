/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

// Define global variables
/* global Chart:false, updateSessionTimer:false */
var timeLineChart, clientsChart;
var queryTypePieChart, forwardDestinationPieChart;

function padNumber(num) {
  return ("00" + num).substr(-2, 2);
}

// Helper function needed for converting the Objects to Arrays

function objectToArray(p) {
  var keys = Object.keys(p);
  keys.sort(function(a, b) {
    return a - b;
  });

  var arr = [],
    idx = [];
  for (var i = 0; i < keys.length; i++) {
    arr.push(p[keys[i]]);
    idx.push(keys[i]);
  }

  return [idx, arr];
}

var customTooltips = function(tooltip) {
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
    tooltipEl.ancestor.appendChild(tooltipEl);
  }

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set caret position
  tooltipEl.classList.remove("left", "right", "center", "top", "bottom");
  tooltipEl.classList.add(tooltip.xAlign, tooltip.yAlign);

  function getBody(bodyItem) {
    return bodyItem.lines;
  }

  // Set Text
  if (tooltip.body) {
    var titleLines = tooltip.title || [];
    var bodyLines = tooltip.body.map(getBody);
    var innerHtml = "<thead>";

    titleLines.forEach(function(title) {
      innerHtml += "<tr><th>" + title + "</th></tr>";
    });
    innerHtml += "</thead><tbody>";
    var printed = 0;

    var devicePixel = (1 / window.devicePixelRatio).toFixed(1);
    bodyLines.forEach(function(body, i) {
      var colors = tooltip.labelColors[i];
      var style = "background: " + colors.backgroundColor;
      style += "; outline: 1px solid " + colors.backgroundColor;
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
  $.getJSON("api.php?overTimeData10mins", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // convert received objects to arrays
    data.domains_over_time = objectToArray(data.domains_over_time);
    data.ads_over_time = objectToArray(data.ads_over_time);
    // remove last data point since it not representative
    data.ads_over_time[0].splice(-1, 1);
    // Remove possibly already existing data
    timeLineChart.data.labels = [];
    timeLineChart.data.datasets[0].data = [];
    timeLineChart.data.datasets[1].data = [];

    // Add data for each hour that is available
    for (var hour in data.ads_over_time[0]) {
      if (Object.prototype.hasOwnProperty.call(data.ads_over_time[0], hour)) {
        var d, h;
        h = parseInt(data.domains_over_time[0][hour]);
        if (parseInt(data.ads_over_time[0][0]) < 1200) {
          // Fallback - old style
          d = new Date().setHours(Math.floor(h / 6), 10 * (h % 6), 0, 0);
        } else {
          // New style: Get Unix timestamps
          d = new Date(1000 * h);
        }

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
    .done(function() {
      // Reload graph after 10 minutes
      failures = 0;
      setTimeout(updateQueriesOverTime, 600000);
    })
    .fail(function() {
      failures++;
      if (failures < 5) {
        // Try again after 1 minute only if this has not failed more
        // than five times in a row
        setTimeout(updateQueriesOverTime, 60000);
      }
    });
}

function updateQueryTypesPie() {
  $.getJSON("api.php?getQueryTypes", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    var colors = [];
    // Get colors from AdminLTE
    $.each($.AdminLTE.options.colors, function(key, value) {
      colors.push(value);
    });
    var v = [],
      c = [],
      k = [],
      iter;
    // Collect values and colors, and labels
    if (Object.prototype.hasOwnProperty.call(data, "querytypes")) {
      iter = data.querytypes;
    } else {
      iter = data;
    }

    $.each(iter, function(key, value) {
      v.push(value);
      c.push(colors.shift());
      k.push(key);
    });
    // Build a single dataset with the data to be pushed
    var dd = { data: v, backgroundColor: c };
    // and push it at once
    queryTypePieChart.data.datasets[0] = dd;
    queryTypePieChart.data.labels = k;
    $("#query-types-pie .overlay").hide();
    queryTypePieChart.update();
    queryTypePieChart.chart.config.options.cutoutPercentage = 50;
    queryTypePieChart.update();
    // Don't use rotation animation for further updates
    queryTypePieChart.options.animation.duration = 0;
    // Generate legend in separate div
    $("#query-types-legend").html(queryTypePieChart.generateLegend());
    $("#query-types-legend > ul > li").on("mousedown", function(e) {
      if (e.which === 2) {
        // which == 2 is middle mouse button
        $(this).toggleClass("strike");
        var index = $(this).index();
        var ci = e.view.queryTypePieChart;
        var meta = ci.data.datasets[0]._meta;
        for (var i in meta) {
          if (Object.prototype.hasOwnProperty.call(meta, i)) {
            var curr = meta[i].data[index];
            curr.hidden = !curr.hidden;
          }
        }

        ci.update();
      } else if (e.which === 1) {
        // which == 1 is left mouse button
        window.open("queries.php?querytype=" + ($(this).index() + 1), "_self");
      }
    });
  }).done(function() {
    // Reload graph after minute
    setTimeout(updateQueryTypesPie, 60000);
  });
}

function updateClientsOverTime() {
  $.getJSON("api.php?overTimeDataClients&getClientNames", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Remove graph if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.over_time)) {
      $("#clients")
        .parent()
        .remove();
      return;
    }

    // convert received objects to arrays
    data.over_time = objectToArray(data.over_time);

    // remove last data point since it not representative
    data.over_time[0].splice(-1, 1);
    var timestamps = data.over_time[0];
    var plotdata = data.over_time[1];
    var labels = [];
    var key, i, j;
    for (key in data.clients) {
      if (!Object.prototype.hasOwnProperty.call(data.clients, key)) {
        continue;
      }

      var clientname;
      if (data.clients[key].name.length > 0) {
        clientname = data.clients[key].name;
      } else {
        clientname = data.clients[key].ip;
      }

      labels.push(clientname);
    }

    // Get colors from AdminLTE
    var colors = [];
    $.each($.AdminLTE.options.colors, function(key, value) {
      colors.push(value);
    });

    // Remove possibly already existing data
    clientsChart.data.labels = [];
    clientsChart.data.datasets[0].data = [];
    for (i = 1; i < clientsChart.data.datasets.length; i++) {
      clientsChart.data.datasets[i].data = [];
    }

    // Collect values and colors, and labels
    clientsChart.data.datasets[0].backgroundColor = colors[0];
    clientsChart.data.datasets[0].pointRadius = 0;
    clientsChart.data.datasets[0].pointHitRadius = 5;
    clientsChart.data.datasets[0].pointHoverRadius = 5;
    clientsChart.data.datasets[0].label = labels[0];

    for (i = clientsChart.data.datasets.length; plotdata.length && i < plotdata[0].length; i++) {
      clientsChart.data.datasets.push({
        data: [],
        // If we ran out of colors, make a random one
        backgroundColor:
          i < colors.length
            ? colors[i]
            : "#" + (0x1000000 + Math.random() * 0xffffff).toString(16).substr(1, 6),
        pointRadius: 0,
        pointHitRadius: 5,
        pointHoverRadius: 5,
        label: labels[i],
        cubicInterpolationMode: "monotone"
      });
    }

    // Add data for each dataset that is available
    for (j in timestamps) {
      if (!Object.prototype.hasOwnProperty.call(timestamps, j)) {
        continue;
      }

      for (key in plotdata[j]) {
        if (!Object.prototype.hasOwnProperty.call(plotdata[j], key)) {
          continue;
        }

        clientsChart.data.datasets[key].data.push(plotdata[j][key]);
      }

      var d = new Date(1000 * parseInt(timestamps[j]));
      clientsChart.data.labels.push(d);
    }

    $("#clients .overlay").hide();
    clientsChart.update();
  })
    .done(function() {
      // Reload graph after 10 minutes
      failures = 0;
      setTimeout(updateClientsOverTime, 600000);
    })
    .fail(function() {
      failures++;
      if (failures < 5) {
        // Try again after 1 minute only if this has not failed more
        // than five times in a row
        setTimeout(updateClientsOverTime, 60000);
      }
    });
}

function updateForwardDestinationsPie() {
  $.getJSON("api.php?getForwardDestinations", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    var colors = [];
    // Get colors from AdminLTE
    $.each($.AdminLTE.options.colors, function(key, value) {
      colors.push(value);
    });
    var v = [],
      c = [],
      k = [],
      values = [];

    // Collect values and colors
    $.each(data.forward_destinations, function(key, value) {
      if (key.indexOf("|") > -1) {
        key = key.substr(0, key.indexOf("|"));
      }

      values.push([key, value, colors.shift()]);
    });

    // Split data into individual arrays for the graphs
    $.each(values, function(key, value) {
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
    forwardDestinationPieChart.chart.config.options.cutoutPercentage = 50;
    forwardDestinationPieChart.update();
    // Don't use rotation animation for further updates
    forwardDestinationPieChart.options.animation.duration = 0;
    // Generate legend in separate div
    $("#forward-destinations-legend").html(forwardDestinationPieChart.generateLegend());
    $("#forward-destinations-legend > ul > li").on("mousedown", function(e) {
      if (e.which === 2) {
        // which == 2 is middle mouse button
        $(this).toggleClass("strike");
        var index = $(this).index();
        var ci = e.view.forwardDestinationPieChart;
        var meta = ci.data.datasets[0]._meta;
        for (var i in meta) {
          if (Object.prototype.hasOwnProperty.call(meta, i)) {
            var curr = meta[i].data[index];
            curr.hidden = !curr.hidden;
          }
        }

        ci.update();
      } else if (e.which === 1) {
        // which == 1 is left mouse button
        var obj = encodeURIComponent(e.target.textContent);
        window.open("queries.php?forwarddest=" + obj, "_self");
      }
    });
  }).done(function() {
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

  return text.replace(/[&<>"']/g, function(m) {
    return map[m];
  });
}

function updateTopClientsChart() {
  $.getJSON("api.php?summaryRaw&getQuerySources&topClientsBlocked", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Clear tables before filling them with data
    $("#client-frequency td")
      .parent()
      .remove();
    var clienttable = $("#client-frequency").find("tbody:last");
    var client, percentage, clientname, clientip, idx, url;
    for (client in data.top_sources) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources, client)) {
        // Sanitize client
        if (escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources[escapeHtml(client)] = data.top_sources[client];
        }

        client = escapeHtml(client);
        if (client.indexOf("|") > -1) {
          idx = client.indexOf("|");
          clientname = client.substr(0, idx);
          clientip = client.substr(idx + 1, client.length - idx);
        } else {
          clientname = client;
          clientip = client;
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
          "<tr> <td>" +
            url +
            "</td> <td>" +
            data.top_sources[client] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            data.dns_queries_today +
            '"> <div class="progress-bar progress-bar-blue" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    // Clear tables before filling them with data
    $("#client-frequency-blocked td")
      .parent()
      .remove();
    var clientblockedtable = $("#client-frequency-blocked").find("tbody:last");
    for (client in data.top_sources_blocked) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources_blocked, client)) {
        // Sanitize client
        if (escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources_blocked[escapeHtml(client)] = data.top_sources_blocked[client];
        }

        client = escapeHtml(client);
        if (client.indexOf("|") > -1) {
          idx = client.indexOf("|");
          clientname = client.substr(0, idx);
          clientip = client.substr(idx + 1, client.length - idx);
        } else {
          clientname = client;
          clientip = client;
        }

        url =
          '<a href="queries.php?client=' +
          clientip +
          '" title="' +
          clientip +
          '">' +
          clientname +
          "</a>";
        percentage = (data.top_sources_blocked[client] / data.ads_blocked_today) * 100;
        clientblockedtable.append(
          "<tr> <td>" +
            url +
            "</td> <td>" +
            data.top_sources_blocked[client] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            data.ads_blocked_today +
            '"> <div class="progress-bar progress-bar-blue" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_sources)) {
      $("#client-frequency")
        .parent()
        .remove();
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_sources_blocked)) {
      $("#client-frequency-blocked")
        .parent()
        .remove();
    }

    $("#client-frequency .overlay").hide();
    $("#client-frequency-blocked .overlay").hide();
    // Update top clients list data every ten seconds
    setTimeout(updateTopClientsChart, 10000);
  });
}

function updateTopLists() {
  $.getJSON("api.php?summaryRaw&topItems", function(data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    // Clear tables before filling them with data
    $("#domain-frequency td")
      .parent()
      .remove();
    $("#ad-frequency td")
      .parent()
      .remove();
    var domaintable = $("#domain-frequency").find("tbody:last");
    var adtable = $("#ad-frequency").find("tbody:last");
    var url, domain, percentage, urlText;
    for (domain in data.top_queries) {
      if (Object.prototype.hasOwnProperty.call(data.top_queries, domain)) {
        // Sanitize domain
        if (escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_queries[escapeHtml(domain)] = data.top_queries[domain];
        }

        domain = escapeHtml(domain);
        urlText = domain === "" ? "." : domain;
        url = '<a href="queries.php?domain=' + domain + '">' + urlText + "</a>";
        percentage = (data.top_queries[domain] / data.dns_queries_today) * 100;
        domaintable.append(
          "<tr> <td>" +
            url +
            "</td> <td>" +
            data.top_queries[domain] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            data.dns_queries_today +
            '"> <div class="progress-bar progress-bar-green" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_queries)) {
      $("#domain-frequency")
        .parent()
        .remove();
    }

    for (domain in data.top_ads) {
      if (Object.prototype.hasOwnProperty.call(data.top_ads, domain)) {
        // Sanitize domain
        if (escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_ads[escapeHtml(domain)] = data.top_ads[domain];
        }

        domain = escapeHtml(domain);
        urlText = domain === "" ? "." : domain;
        url = '<a href="queries.php?domain=' + domain + '">' + urlText + "</a>";
        percentage = (data.top_ads[domain] / data.ads_blocked_today) * 100;
        adtable.append(
          "<tr> <td>" +
            url +
            "</td> <td>" +
            data.top_ads[domain] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            data.ads_blocked_today +
            '"> <div class="progress-bar progress-bar-yellow" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    // Remove table if there are no results (e.g. privacy mode enabled)
    if (jQuery.isEmptyObject(data.top_ads)) {
      $("#ad-frequency")
        .parent()
        .remove();
    }

    $("#domain-frequency .overlay").hide();
    $("#ad-frequency .overlay").hide();
    // Update top lists data every 10 seconds
    setTimeout(updateTopLists, 10000);
  });
}

var FTLoffline = false;
function updateSummaryData(runOnce) {
  var setTimer = function(timeInSeconds) {
    if (!runOnce) {
      setTimeout(updateSummaryData, timeInSeconds * 1000);
    }
  };

  $.getJSON("api.php?summary", function(data) {
    updateSessionTimer();

    if ("FTLnotrunning" in data) {
      data.dns_queries_today = "Lost";
      data.ads_blocked_today = "connection";
      data.ads_percentage_today = "to";
      data.domains_being_blocked = "API";
      // Adjust text
      $("#temperature").html('<i class="fa fa-circle text-red"></i> FTL offline');
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
      $("#temperature").text(" ");
      updateQueriesOverTime();
      updateTopClientsChart();
      updateTopLists();
    }

    ["ads_blocked_today", "dns_queries_today", "ads_percentage_today", "unique_clients"].forEach(
      function(today) {
        var $todayElement = $("span#" + today);

        if ($todayElement.text() !== data[today] && $todayElement.text() !== data[today] + "%") {
          $todayElement.addClass("glow");
        }
      }
    );

    if (Object.prototype.hasOwnProperty.call(data, "dns_queries_all_types")) {
      $("#total_queries").prop(
        "title",
        "only A + AAAA queries (" + data.dns_queries_all_types + " in total)"
      );
    }

    window.setTimeout(function() {
      [
        "ads_blocked_today",
        "dns_queries_today",
        "domains_being_blocked",
        "ads_percentage_today",
        "unique_clients"
      ].forEach(function(header, idx) {
        var textData = idx === 3 && data[header] !== "to" ? data[header] + "%" : data[header];
        $("span#" + header).text(textData);
      });
      $("span.glow").removeClass("glow");
    }, 500);
  })
    .done(function() {
      if (!FTLoffline) {
        setTimer(1);
      } else {
        setTimer(10);
      }
    })
    .fail(function() {
      setTimer(300);
    });
}

$(document).ready(function() {
  // Pull in data via AJAX
  updateSummaryData();

  var blockedColor = "#999";
  var permittedColor = "#00a65a";

  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  timeLineChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Blocked DNS Queries",
          fill: true,
          backgroundColor: blockedColor,
          borderColor: blockedColor,
          pointBorderColor: blockedColor,
          pointRadius: 1,
          pointHoverRadius: 5,
          data: [],
          pointHitRadius: 5
        },
        {
          label: "Permitted DNS Queries",
          fill: true,
          backgroundColor: permittedColor,
          borderColor: permittedColor,
          pointBorderColor: permittedColor,
          pointRadius: 1,
          pointHoverRadius: 5,
          data: [],
          pointHitRadius: 5
        }
      ]
    },
    options: {
      tooltips: {
        enabled: true,
        mode: "x-axis",
        itemSort: function(a, b) {
          return b.datasetIndex - a.datasetIndex;
        },
        callbacks: {
          title: function(tooltipItem) {
            var label = tooltipItem[0].xLabel;
            var time = label.match(/(\d?\d):?(\d?\d?)/);
            var h = parseInt(time[1], 10);
            var m = parseInt(time[2], 10) || 0;
            var from = padNumber(h) + ":" + padNumber(m - 5) + ":00";
            var to = padNumber(h) + ":" + padNumber(m + 4) + ":59";
            return "Queries from " + from + " to " + to;
          },
          label: function(tooltipItems, data) {
            if (tooltipItems.datasetIndex === 0) {
              var percentage = 0.0;
              var permitted = parseInt(data.datasets[1].data[tooltipItems.index]);
              var blocked = parseInt(data.datasets[0].data[tooltipItems.index]);
              var total = permitted + blocked;
              if (total > 0) {
                percentage = (100.0 * blocked) / total;
              }

              return (
                data.datasets[tooltipItems.datasetIndex].label +
                ": " +
                tooltipItems.yLabel +
                " (" +
                percentage.toFixed(1) +
                "%)"
              );
            }

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
            }
          }
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              beginAtZero: true
            }
          }
        ]
      },
      maintainAspectRatio: false
    }
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
        datasets: [{ data: [] }]
      },
      options: {
        tooltips: {
          enabled: false,
          mode: "x-axis",
          custom: customTooltips,
          yAlign: "top",
          itemSort: function(a, b) {
            return b.yLabel - a.yLabel;
          },
          callbacks: {
            title: function(tooltipItem) {
              var label = tooltipItem[0].xLabel;
              var time = label.match(/(\d?\d):?(\d?\d?)/);
              var h = parseInt(time[1], 10);
              var m = parseInt(time[2], 10) || 0;
              var from = padNumber(h) + ":" + padNumber(m - 5) + ":00";
              var to = padNumber(h) + ":" + padNumber(m + 4) + ":59";
              return "Client activity from " + from + " to " + to;
            },
            label: function(tooltipItems, data) {
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
              }
            }
          ],
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              },
              stacked: true
            }
          ]
        },
        maintainAspectRatio: false,
        hover: {
          animationDuration: 0
        }
      }
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

  $("#queryOverTimeChart").click(function(evt) {
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

  if (document.getElementById("queryTypePieChart")) {
    ctx = document.getElementById("queryTypePieChart").getContext("2d");
    queryTypePieChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [],
        datasets: [{ data: [] }]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          enabled: false,
          custom: customTooltips,
          callbacks: {
            title: function() {
              return "Query types";
            },
            label: function(tooltipItems, data) {
              var dataset = data.datasets[tooltipItems.datasetIndex];
              var label = data.labels[tooltipItems.index];
              return label + ": " + dataset.data[tooltipItems.index].toFixed(1) + "%";
            }
          }
        },
        animation: {
          duration: 750
        },
        cutoutPercentage: 0
      }
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
        datasets: [{ data: [] }]
      },
      options: {
        legend: {
          display: false
        },
        tooltips: {
          enabled: false,
          custom: customTooltips,
          callbacks: {
            title: function() {
              return "Forward destinations";
            },
            label: function(tooltipItems, data) {
              var dataset = data.datasets[tooltipItems.datasetIndex];
              var label = data.labels[tooltipItems.index];
              return label + ": " + dataset.data[tooltipItems.index].toFixed(1) + "%";
            }
          }
        },
        animation: {
          duration: 750
        },
        cutoutPercentage: 0
      }
    });

    // Pull in data via AJAX
    updateForwardDestinationsPie();
  }
});

//destroy all chartjs customTooltips on window resize
window.addEventListener("resize", function() {
  $(".chartjs-tooltip").remove();
});
