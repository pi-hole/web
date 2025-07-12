/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global upstreams:false */

"use strict";

globalThis.THEME_COLORS = [
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

globalThis.htmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart, args, options) {
    // Use the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);

    // Exit early if the legend has the same items as last time
    const isLegendUnchanged =
      options.lastLegendItems &&
      items.length === options.lastLegendItems.length &&
      items.every(
        (item, i) =>
          item.text === options.lastLegendItems[i].text &&
          item.hidden === options.lastLegendItems[i].hidden
      );

    if (isLegendUnchanged) return;

    // else: Update the HTML legend if it is different from last time or if it
    // did not exist

    // Save the legend items so we can check against them next time to see if we
    // need to update the legend
    options.lastLegendItems = items;

    const ul = getOrCreateLegendList(options.containerID);

    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }

    for (const item of items) {
      const li = document.createElement("li");

      // Color checkbox (toggle visibility)
      const boxSpan = document.createElement("span");
      boxSpan.title = "Toggle visibility";
      boxSpan.style.color = item.fillStyle;
      boxSpan.style.cursor = "pointer";
      boxSpan.innerHTML = `<i class="colorBoxWrapper fa ${item.hidden ? "fa-square" : "fa-check-square"}"></i>`;

      boxSpan.addEventListener("click", () => {
        const { type } = chart.config;
        const isPieOrDoughnut = type === "pie" || type === "doughnut";

        if (isPieOrDoughnut) {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          const isVisible = chart.isDatasetVisible(item.datasetIndex);
          chart.setDatasetVisibility(item.datasetIndex, !isVisible);
        }

        chart.update();
      });

      const link = document.createElement("a");
      const isQueryTypeChart = chart.canvas.id === "queryTypePieChart";
      const isForwardDestinationChart = chart.canvas.id === "forwardDestinationPieChart";

      if (isQueryTypeChart || isForwardDestinationChart) {
        // Text (link to query log page)
        link.title = `List ${item.text} queries`;
        link.className = "legend-label-text clickable";

        if (isQueryTypeChart) {
          link.href = `queries?type=${item.text}`;
        } else if (isForwardDestinationChart) {
          // Encode the forward destination as it may contain an "#" character
          link.href = `queries?upstream=${encodeURIComponent(upstreams[item.text])}`;
        }
      } else {
        // no clickable links in other charts
        link.className = "legend-label-text";
      }

      link.style.textDecoration = item.hidden ? "line-through" : "";
      link.textContent = item.text;

      li.append(boxSpan, link);
      ul.append(li);
    }
  },
};

globalThis.customTooltips = context => {
  const tooltip = context.tooltip;
  const canvasId = context.chart.canvas.id;
  const tooltipEl = getOrCreateTooltipElement(canvasId, tooltip.options, context);

  // Hide if no tooltip
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  // Set caret position
  setTooltipCaretPosition(tooltipEl, tooltip);

  // Set tooltip content
  if (tooltip.body) {
    setTooltipContent(tooltipEl, tooltip);
  }

  // Position tooltip
  positionTooltip(tooltipEl, tooltip, context);

  // Make tooltip visible
  tooltipEl.style.opacity = 1;
};

function getOrCreateTooltipElement(canvasId, options, context) {
  let tooltipEl = document.getElementById(`${canvasId}-customTooltip`);
  if (tooltipEl) return tooltipEl;

  // Create Tooltip Element once per chart
  tooltipEl = document.createElement("div");
  tooltipEl.id = `${canvasId}-customTooltip`;
  tooltipEl.className = "chartjs-tooltip";
  tooltipEl.innerHTML = '<div class="arrow"></div> <table></table>';

  // Avoid browser's font-zoom since we know that <body>'s
  // font-size was set to 14px by Bootstrap's CSS
  const fontZoom = Number.parseFloat(getComputedStyle(document.body).fontSize) / 14;

  // Set styles and font
  tooltipEl.style.cssText = `
    padding: ${options.padding}px ${options.padding}px;
    border-radius: ${options.cornerRadius}px;
    font: ${options.bodyFont.string};
    font-family: ${options.bodyFont.family};
    font-size: ${options.bodyFont.size / fontZoom}px;
    font-style: ${options.bodyFont.style};
  `;

  // Append Tooltip next to canvas-containing box
  tooltipEl.ancestor = context.chart.canvas.closest(".box[id]").parentNode;
  tooltipEl.ancestor.append(tooltipEl);

  return tooltipEl;
}

function setTooltipCaretPosition(tooltipEl, tooltip) {
  tooltipEl.classList.remove("left", "right", "center", "top", "bottom");
  tooltipEl.classList.add(tooltip.xAlign, tooltip.yAlign);
}

function setTooltipContent(tooltipEl, tooltip) {
  const bodyLines = tooltip.body.map(bodyItem => bodyItem.lines);
  if (bodyLines.length === 0) return;

  const titleLines = tooltip.title || [];
  let tooltipHtml = "<thead>";

  for (const title of titleLines) {
    tooltipHtml += `<tr><th>${title}</th></tr>`;
  }

  tooltipHtml += "</thead><tbody>";

  const devicePixel = (1 / window.devicePixelRatio).toFixed(1);
  let printed = 0;

  for (const [i, body] of bodyLines.entries()) {
    const labelColors = tooltip.labelColors[i];
    const style =
      `background-color: ${labelColors.backgroundColor}; ` +
      `outline: 1px solid ${labelColors.backgroundColor}; ` +
      `border: ${devicePixel}px solid #fff`;
    const span = `<span class="chartjs-tooltip-key" style="${style}"></span>`;

    const num = body[0].split(": ");
    // Do not display entries with value of 0 in bar chart,
    // but pass through entries with "0.0%" (in pie charts)
    if (num[1] !== "0") {
      tooltipHtml += `<tr><td>${span}${body}</td></tr>`;
      printed++;
    }
  }

  if (printed < 1) {
    tooltipHtml += "<tr><td>No activity recorded</td></tr>";
  }

  tooltipHtml += "</tbody>";

  const tableRoot = tooltipEl.querySelector("table");
  tableRoot.innerHTML = tooltipHtml;
}

function positionTooltip(tooltipEl, tooltip, context) {
  if (tooltip.opacity === 0 || tooltipEl.style.opacity === 0) return;

  const canvasPos = context.chart.canvas.getBoundingClientRect();
  const boxPos = tooltipEl.ancestor.getBoundingClientRect();
  const offsetX = canvasPos.left - boxPos.left;
  const offsetY = canvasPos.top - boxPos.top;
  const tooltipWidth = tooltipEl.offsetWidth;
  const tooltipHeight = tooltipEl.offsetHeight;
  const { caretX, caretY } = tooltip;
  const { caretPadding } = tooltip.options;
  const arrowMinIndent = 2 * tooltip.options.cornerRadius;
  const arrowSize = 5;

  let tooltipX = offsetX + caretX;
  let arrowX;

  // Compute X position
  if (tooltip.yAlign === "top" || tooltip.yAlign === "bottom") {
    switch (tooltip.xAlign) {
      case "center": {
        // Set a minimal X position to 5px to prevent
        // the tooltip to stick out left of the viewport
        const minX = 5;
        tooltipX = Math.max(minX, tooltipX - tooltipWidth / 2);
        arrowX = tooltip.caretX - (tooltipX - offsetX);
        break;
      }

      case "left": {
        tooltipX -= arrowMinIndent;
        arrowX = arrowMinIndent;
        break;
      }

      case "right": {
        tooltipX -= tooltipWidth - arrowMinIndent;
        arrowX = tooltipWidth - arrowMinIndent;
        break;
      }
      // No default
    }
  } else if (tooltip.yAlign === "center") {
    switch (tooltip.xAlign) {
      case "left": {
        tooltipX += caretPadding;
        break;
      }

      case "right": {
        tooltipX -= tooltipWidth - caretPadding;
        break;
      }

      case "center": {
        tooltipX -= tooltipWidth / 2;
        break;
      }
      // No default
    }
  }

  // Adjust X position if tooltip is centered inside ancestor
  if (document.documentElement.clientWidth <= 2 * tooltip.width && tooltip.xAlign === "center") {
    tooltipX = (tooltipEl.ancestor.offsetWidth - tooltipWidth) / 2;
    tooltipX = Math.max(tooltipX, offsetX + caretX - arrowMinIndent); // Prevent left overflow
    tooltipX = Math.min(tooltipX, offsetX + caretX - tooltipWidth + arrowMinIndent); // Prevent right overflow
    arrowX = offsetX + caretX - tooltipX;
  }

  let tooltipY = offsetY + caretY;

  // Compute Y position
  switch (tooltip.yAlign) {
    case "top": {
      tooltipY += arrowSize + caretPadding;
      break;
    }

    case "center": {
      tooltipY -= tooltipHeight / 2;
      if (tooltip.xAlign === "left") tooltipX += arrowSize;
      if (tooltip.xAlign === "right") tooltipX -= arrowSize;
      break;
    }

    case "bottom": {
      tooltipY -= tooltipHeight + arrowSize + caretPadding;
      break;
    }
    // No default
  }

  // Position tooltip and display
  tooltipEl.style.top = `${tooltipY.toFixed(1)}px`;
  tooltipEl.style.left = `${tooltipX.toFixed(1)}px`;

  // Set arrow position
  const arrowEl = tooltipEl.querySelector(".arrow");
  let arrowLeftPosition = "";

  if (arrowX !== undefined) {
    // Calculate percentage X value depending on the tooltip's
    // width to avoid hanging arrow out on tooltip width changes
    const arrowXpercent = ((100 / tooltipWidth) * arrowX).toFixed(1);
    arrowLeftPosition = `${arrowXpercent}%`;
  }

  arrowEl.style.left = arrowLeftPosition;
}

globalThis.doughnutTooltip = tooltipLabel => {
  if (tooltipLabel.parsed === 0) return "";

  // tooltipLabel.chart._metasets[0].total returns the total percentage of the shown slices
  // to compensate rounding errors we round to one decimal
  let percentageTotalShown = tooltipLabel.chart._metasets[0].total.toFixed(1);
  const label = ` ${tooltipLabel.label}`;
  let itemPercentage;

  // if we only show < 1% percent of all, show each item with two decimals
  if (percentageTotalShown < 1) {
    itemPercentage = tooltipLabel.parsed.toFixed(2);
  } else {
    // show with one decimal, but in case the item share is really small it could be rounded to 0.0
    // we compensate for this
    itemPercentage =
      tooltipLabel.parsed.toFixed(1) === "0.0" ? "< 0.1" : tooltipLabel.parsed.toFixed(1);
  }

  // even if no doughnut slice is hidden, sometimes percentageTotalShown is slightly less than 100
  // we therefore use 99.9 to decide if slices are hidden (we only show with 0.1 precision)
  if (percentageTotalShown > 99.9) {
    // All items shown
    return `${label}: ${itemPercentage}%`;
  }

  // set percentageTotalShown again without rounding to account
  // for cases where the total shown percentage would be <0.1% of all
  percentageTotalShown = tooltipLabel.chart._metasets[0].total;
  const percentageOfShownItems = ((tooltipLabel.parsed * 100) / percentageTotalShown).toFixed(1);

  return (
    `${label}:<br>&bull; ${itemPercentage}% of all data<br>` +
    `&bull; ${percentageOfShownItems}% of shown items`
  );
};

// chartjs plugin used by the custom doughnut legend
function getOrCreateLegendList(id) {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector("ul");
  if (listContainer) return listContainer;

  listContainer = document.createElement("ul");
  legendContainer.append(listContainer);

  return listContainer;
}
