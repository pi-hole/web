/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false */

var start__ = moment().subtract(6, "days");
var from =
  moment(start__)
    .utc()
    .valueOf() / 1000;
var end__ = moment();
var until =
  moment(end__)
    .utc()
    .valueOf() / 1000;

var timeoutWarning = $("#timeoutWarning");
var listsStillLoading = 0;

var dateformat = "MMMM Do YYYY, HH:mm";

$(function() {
  $("#querytime").daterangepicker(
    {
      timePicker: true,
      timePickerIncrement: 15,
      locale: { format: dateformat },
      startDate: start__,
      endDate: end__,
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment()
            .subtract(1, "days")
            .startOf("day"),
          moment()
            .subtract(1, "days")
            .endOf("day")
        ],
        "Last 7 Days": [moment().subtract(6, "days"), moment()],
        "Last 30 Days": [moment().subtract(29, "days"), moment()],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment()
            .subtract(1, "month")
            .startOf("month"),
          moment()
            .subtract(1, "month")
            .endOf("month")
        ],
        "This Year": [moment().startOf("year"), moment()],
        "All Time": [moment(0), moment()]
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: false
    },
    function(startt, endt) {
      from =
        moment(startt)
          .utc()
          .valueOf() / 1000;
      until =
        moment(endt)
          .utc()
          .valueOf() / 1000;
    }
  );
});

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
  $("#client-frequency .overlay").show();
  $.getJSON("api_db.php?topClients&from=" + from + "&until=" + until, function(data) {
    // Clear tables before filling them with data
    $("#client-frequency td")
      .parent()
      .remove();
    var clienttable = $("#client-frequency").find("tbody:last");
    var client, percentage, clientname;
    var sum = 0;
    for (client in data.top_sources) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources, client)) {
        sum += data.top_sources[client];
      }
    }

    for (client in data.top_sources) {
      if (Object.prototype.hasOwnProperty.call(data.top_sources, client)) {
        // Sanitize client
        client = escapeHtml(client);
        if (escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources[escapeHtml(client)] = data.top_sources[client];
        }

        if (client.indexOf("|") > -1) {
          var idx = client.indexOf("|");
          clientname = client.substr(0, idx);
        } else {
          clientname = client;
        }

        percentage = (data.top_sources[client] / sum) * 100.0;
        clienttable.append(
          "<tr> <td>" +
            clientname +
            "</td> <td>" +
            data.top_sources[client] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            sum +
            '"> <div class="progress-bar progress-bar-blue" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    $("#client-frequency .overlay").hide();

    listsStillLoading--;
    if (listsStillLoading === 0) timeoutWarning.hide();
  });
}

function updateTopDomainsChart() {
  $("#domain-frequency .overlay").show();
  $.getJSON("api_db.php?topDomains&from=" + from + "&until=" + until, function(data) {
    // Clear tables before filling them with data
    $("#domain-frequency td")
      .parent()
      .remove();
    var domaintable = $("#domain-frequency").find("tbody:last");
    var domain, percentage;
    var sum = 0;
    for (domain in data.top_domains) {
      if (Object.prototype.hasOwnProperty.call(data.top_domains, domain)) {
        sum += data.top_domains[domain];
      }
    }

    for (domain in data.top_domains) {
      if (Object.prototype.hasOwnProperty.call(data.top_domains, domain)) {
        // Sanitize domain
        domain = escapeHtml(domain);
        if (escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_domains[escapeHtml(domain)] = data.top_domains[domain];
        }

        percentage = (data.top_domains[domain] / sum) * 100.0;
        domaintable.append(
          "<tr> <td>" +
            domain +
            "</td> <td>" +
            data.top_domains[domain] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            sum +
            '"> <div class="progress-bar progress-bar-blue" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    $("#domain-frequency .overlay").hide();

    listsStillLoading--;
    if (listsStillLoading === 0) timeoutWarning.hide();
  });
}

function updateTopAdsChart() {
  $("#ad-frequency .overlay").show();
  $.getJSON("api_db.php?topAds&from=" + from + "&until=" + until, function(data) {
    // Clear tables before filling them with data
    $("#ad-frequency td")
      .parent()
      .remove();
    var adtable = $("#ad-frequency").find("tbody:last");
    var ad, percentage;
    var sum = 0;
    for (ad in data.top_ads) {
      if (Object.prototype.hasOwnProperty.call(data.top_ads, ad)) {
        sum += data.top_ads[ad];
      }
    }

    for (ad in data.top_ads) {
      if (Object.prototype.hasOwnProperty.call(data.top_ads, ad)) {
        // Sanitize ad
        ad = escapeHtml(ad);
        if (escapeHtml(ad) !== ad) {
          // Make a copy with the escaped index if necessary
          data.top_ads[escapeHtml(ad)] = data.top_ads[ad];
        }

        percentage = (data.top_ads[ad] / sum) * 100.0;
        adtable.append(
          "<tr> <td>" +
            ad +
            "</td> <td>" +
            data.top_ads[ad] +
            '</td> <td> <div class="progress progress-sm" title="' +
            percentage.toFixed(1) +
            "% of " +
            sum +
            '"> <div class="progress-bar progress-bar-blue" style="width: ' +
            percentage +
            '%"></div> </div> </td> </tr> '
        );
      }
    }

    $("#ad-frequency .overlay").hide();

    listsStillLoading--;
    if (listsStillLoading === 0) timeoutWarning.hide();
  });
}

$("#querytime").on("apply.daterangepicker", function(ev, picker) {
  $(this).val(picker.startDate.format(dateformat) + " to " + picker.endDate.format(dateformat));
  timeoutWarning.show();
  listsStillLoading = 3;
  updateTopClientsChart();
  updateTopDomainsChart();
  updateTopAdsChart();
});
