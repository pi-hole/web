/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment: false, apiFailure: false */

var nextID = 0;

// Check every 0.5s for fresh data
const interval = 500;

// Maximum number of lines to display
const maxlines = 5000;

// Fade in new lines
const fadeIn = true;

// Mark new lines with a red line above them
const markUpdates = true;

// Function that asks the API for new data
function getData() {
  // Only update when spinner is spinning
  if (!$("#feed-icon").hasClass("fa-play")) {
    window.setTimeout(getData, interval);
    return;
  }

  var GETDict = {};
  window.location.search
    .substr(1)
    .split("&")
    .forEach(function (item) {
      GETDict[item.split("=")[0]] = item.split("=")[1];
    });
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
      if (data.log.length === 0) {
        if (nextID === 0) {
          $("#output").html("<i>*** Log file is empty ***</i>");
        }

        window.setTimeout(getData, interval);
        return;
      }

      // We have new lines
      if (markUpdates && nextID > 0) {
        // Add red fading out background to new lines
        $("#output").append('<hr class="hr-small">').children(":last").fadeOut(2000);
      }

      data.log.forEach(function (line) {
        // Add new line to output
        $("#output").append(
          '<span><span style="border-left: 2px red" class="left-line">&nbsp;</span><span class="text-muted">' +
            moment(1000 * line.timestamp).format("YYYY-MM-DD HH:mm:ss.SSS") +
            "</span> " +
            line.message +
            "<br></span>"
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

      window.setTimeout(getData, interval);
    })
    .fail(function (data) {
      apiFailure(data);
      window.setTimeout(getData, 5 * interval);
    });
}

var gAutoScrolling = true;
$("#output").on("scroll", function () {
  // Check if we are at the bottom of the output
  if ($("#output").scrollTop() + $("#output").innerHeight() >= $("#output")[0].scrollHeight) {
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
