/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global upstreams */

// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
const htmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);

    // Use the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    // Exit early if the legend has the same items as last time
    if (
      options.lastLegendItems &&
      items.length === options.lastLegendItems.length &&
      items.every((item, i) => item.text === options.lastLegendItems[i].text) &&
      items.every((item, i) => item.hidden === options.lastLegendItems[i].hidden)
    ) {
      return;
    }
    // else: Update the HTML legend if it is different from last time or if it
    // did not exist

    // Save the legend items so we can check against them next time to see if we
    // need to update the legend
    options.lastLegendItems = items;

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

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

      const textLink = document.createElement("p");
      if (
        chart.canvas.id === "queryTypePieChart" ||
        chart.canvas.id === "forwardDestinationPieChart"
      ) {
        // Text (link to query log page)
        textLink.title = "List " + item.text + " queries";

        textLink.addEventListener("click", () => {
          if (chart.canvas.id === "queryTypePieChart") {
            window.location.href = "queries.lp?type=" + item.text;
          } else if (chart.canvas.id === "forwardDestinationPieChart") {
            // Encode the forward destination as it may contain an "#" character
            const upstream = encodeURIComponent(upstreams[item.text]);
            window.location.href = "queries.lp?upstream=" + upstream;
          }
        });
      }

      textLink.style.margin = 0;
      textLink.style.padding = 0;
      textLink.style.textDecoration = item.hidden ? "line-through" : "";
      textLink.className = "legend-label-text";
      textLink.append(item.text);

      li.append(boxSpan, textLink);
      ul.append(li);
    });
  },
};

// eslint-disable-next-line no-unused-vars
var customTooltips = function (context) {
  var tooltip = context.tooltip;
  var tooltipEl = document.getElementById(this.chart.canvas.id + "-customTooltip");
  if (!tooltipEl) {
    // Create Tooltip Element once per chart
    tooltipEl = document.createElement("div");
    tooltipEl.id = this.chart.canvas.id + "-customTooltip";
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
    tooltipEl.ancestor = this.chart.canvas.closest(".box[id]").parentNode;
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

  var canvasPos = this.chart.canvas.getBoundingClientRect();
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

// eslint-disable-next-line no-unused-vars
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
      "% of all data<br>&bull; " +
      ((tooltipLabel.parsed * 100) / percentageTotalShown).toFixed(1) +
      "% of shown items"
    );
  }
}

// chartjs plugin used by the custom doughnut legend
const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector("ul");

  if (!listContainer) {
    listContainer = document.createElement("ul");
    listContainer.style.display = "flex";
    listContainer.style.flexDirection = "column";
    listContainer.style.flexWrap = "wrap";
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.append(listContainer);
  }

  return listContainer;
};
