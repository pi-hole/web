/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment: false, apiFailure: false, utils: false, REFRESH_INTERVAL: false */

var nextID = 0;
var lastPID = -1;

// Maximum number of lines to display
const maxlines = 5000;

// Fade in new lines
const fadeIn = true;

// Mark new lines with a red line above them
const markUpdates = true;

// Format a line of the dnsmasq log
function formatDnsmasq(line) {
  // Remove dnsmasq + PID
  let txt = line.replaceAll(/ dnsmasq\[\d*]/g, "");

  if (line.includes("denied") || line.includes("gravity blocked")) {
    // Red bold text for blocked domains
    txt = `<b class="log-red">${txt}</b>`;
  } else if (line.includes("query[A") || line.includes("query[DHCP")) {
    // Bold text for initial query lines
    txt = `<b>${txt}</b>`;
  } else {
    // Grey text for all other lines
    txt = `<span class="text-muted">${txt}</span>`;
  }

  return txt;
}

function formatFTL(line, prio) {
  // Colorize priority
  let prioClass = "";
  switch (prio) {
    case "INFO": {
      prioClass = "text-success";
      break;
    }

    case "WARNING": {
      prioClass = "text-warning";
      break;
    }

    case "ERR":
    case "ERROR":
    case "EMERG":
    case "ALERT":
    case "CRIT": {
      prioClass = "text-danger";
      break;
    }

    default:
      prioClass = prio.startsWith("DEBUG") ? "text-info" : "text-muted";
  }

  // Return formatted line
  return `<span class="${prioClass}">${utils.escapeHtml(prio)}</span> ${line}`;
}

// Function that asks the API for new data
function getData() {
  // Only update when spinner is spinning
  if (!$("#feed-icon").hasClass("fa-play")) {
    utils.setTimer(getData, REFRESH_INTERVAL.logs);
    return;
  }

  var GETDict = utils.parseQueryString();
  if (!("file" in GETDict)) {
    window.location.href += "?file=dnsmasq";
    return;
  }

  $.ajax({
    url: "/api/logs/" + GETDict.file + "?nextID=" + nextID,
    timeout: 5000,
    method: "GET",
  })
    .done(function (data) {
      // Check if we have a new PID -> FTL was restarted
      if (lastPID !== data.pid) {
        if (lastPID !== -1) {
          $("#output").append("<div><i class='text-danger'>*** FTL restarted ***</i></div>");
        }

        // Remember PID
        lastPID = data.pid;
        // Reset nextID
        nextID = 0;

        getData();
        return;
      }

      // Set placeholder text if log file is empty and we have no new lines
      if (data.log.length === 0) {
        if (nextID === 0) {
          $("#output").html("<div><i>*** Log file is empty ***</i></div>");
        }

        utils.setTimer(getData, REFRESH_INTERVAL.logs);
        return;
      }

      // We have new lines
      if (markUpdates && nextID > 0) {
        // Add red fading out background to new lines
        $("#output").append('<hr class="hr-small">').children(":last").fadeOut(2000);
      }

      data.log.forEach(function (line) {
        // Escape HTML
        line.message = utils.escapeHtml(line.message);
        // Format line if applicable
        if (GETDict.file === "dnsmasq") line.message = formatDnsmasq(line.message);
        else if (GETDict.file === "ftl") line.message = formatFTL(line.message, line.prio);

        // Add new line to output
        $("#output").append(
          '<div class="log-entry"><span class="text-muted">' +
            moment(1000 * line.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS") +
            "</span> " +
            line.message +
            "</div>"
        );
        if (fadeIn) {
          //$(".left-line:last").fadeOut(2000);
          $("#output").children(":last").hide().fadeIn("fast");
        }
      });

      // Limit output to <maxlines> lines
      var lines = $("#output").val().split("\n");
      if (lines.length > maxlines) {
        lines.splice(0, lines.length - maxlines);
        $("#output").val(lines.join("\n"));
      }

      // Scroll to bottom of output if we are already at the bottom
      if (gAutoScrolling) {
        // Auto-scrolling is enabled
        $("#output").scrollTop($("#output")[0].scrollHeight);
      }

      // Update nextID
      nextID = data.nextID;

      // Set filename
      $("#filename").text(data.file);

      utils.setTimer(getData, REFRESH_INTERVAL.logs);
    })
    .fail(function (data) {
      apiFailure(data);
      utils.setTimer(getData, 5 * REFRESH_INTERVAL.logs);
    });
}

var gAutoScrolling = true;
$("#output").on("scroll", function () {
  // Check if we are at the bottom of the output
  //
  // - $("#output")[0].scrollHeight: This gets the entire height of the content
  //   of the "output" element, including the part that is not visible due to
  //   scrolling.
  // - $("#output").innerHeight(): This gets the inner height of the "output"
  //   element, which is the visible part of the content.
  // - $("#output").scrollTop(): This gets the number of pixels that the content
  //   of the "output" element is scrolled vertically from the top.
  //
  // By subtracting the inner height and the scroll top from the scroll height,
  // you get the distance from the bottom of the scrollable area.
  const bottom =
    $("#output")[0].scrollHeight - $("#output").innerHeight() - $("#output").scrollTop();
  // Add a tolerance of four line heights
  const tolerance = 4 * parseFloat($("#output").css("line-height"));
  if (bottom <= tolerance) {
    // Auto-scrolling is enabled
    gAutoScrolling = true;
    $("#autoscrolling").addClass("fa-check");
    $("#autoscrolling").removeClass("fa-xmark");
  } else {
    // Auto-scrolling is disabled
    gAutoScrolling = false;
    $("#autoscrolling").addClass("fa-xmark");
    $("#autoscrolling").removeClass("fa-check");
  }
});

$(function () {
  getData();

  // Clicking on the element with class "fa-spinner" will toggle the play/pause state
  $("#live-feed").on("click", function () {
    if ($("#feed-icon").hasClass("fa-play")) {
      // Toggle button color
      $("#feed-icon").addClass("fa-pause");
      $("#feed-icon").removeClass("fa-fade");
      $("#feed-icon").removeClass("fa-play");
      $(this).addClass("btn-danger");
      $(this).removeClass("btn-success");
      $("#title").text("Paused");
    } else {
      // Toggle button color
      $("#feed-icon").addClass("fa-play");
      $("#feed-icon").addClass("fa-fade");
      $("#feed-icon").removeClass("fa-pause");
      $(this).addClass("btn-success");
      $(this).removeClass("btn-danger");
      $("#title").text("Live");
    }
  });
});
