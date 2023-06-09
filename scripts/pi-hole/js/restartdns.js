/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

var timeleft = 60;
var status = -1;
var reloadMsg =
  "FTL was restarted: <a href='settings.php' class='btn btn-sm btn-primary'>Reload FTL details.</a>";
var warningMsg = "FTL was not able to reload after " + timeleft + " seconds.";
var counterMsg = "FTL is reloading: ";

var reloadTimer = setInterval(function () {
  $.getJSON("api.php?dns-port", function (data) {
    if ("FTLnotrunning" in data) {
      return;
    }

    status = data["dns-port"];
  });

  if (timeleft <= 0 || status >= 0) {
    clearInterval(reloadTimer);
    if (status < 0) {
      // FTL was not restarted in 60 seconds. Show warning message
      document.getElementById("restart-countdown").innerHTML = warningMsg;
    } else {
      // FTL restartd.
      document.getElementById("restart-countdown").innerHTML = reloadMsg;
    }
  } else {
    document.getElementById("restart-countdown").innerHTML =
      counterMsg + timeleft + " seconds remaining...";
  }

  timeleft -= 1;
}, 1000);
