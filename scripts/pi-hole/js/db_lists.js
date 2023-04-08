/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, moment:false */

var start__ = moment().subtract(7, "days");
var from = moment(start__).utc().valueOf() / 1000;
var end__ = moment();
var until = moment(end__).utc().valueOf() / 1000;

var timeoutWarning = $("#timeoutWarning");
var listsStillLoading = 0;

var dateformat = "MMMM Do YYYY, HH:mm";

$(function () {
  $("#querytime").daterangepicker(
    {
      timePicker: true,
      timePickerIncrement: 15,
      timePicker24Hour: true,
      locale: { format: dateformat },
      startDate: start__,
      endDate: end__,
      ranges: {
        Today: [moment().startOf("day"), moment()],
        Yesterday: [
          moment().subtract(1, "days").startOf("day"),
          moment().subtract(1, "days").endOf("day"),
        ],
        "Last 7 Days": [moment().subtract(7, "days"), moment()],
        "Last 30 Days": [moment().subtract(30, "days"), moment()],
        "This Month": [moment().startOf("month"), moment()],
        "Last Month": [
          moment().subtract(1, "month").startOf("month"),
          moment().subtract(1, "month").endOf("month"),
        ],
        "This Year": [moment().startOf("year"), moment()],
        "All Time": [moment(0), moment()],
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: false,
    },
    function (startt, endt) {
      from = moment(startt).utc().valueOf() / 1000;
      until = moment(endt).utc().valueOf() / 1000;
    }
  );
});

function updateTopClientsChart() {
  $("#client-frequency .overlay").show();
  $.getJSON("api_db.php?topClients&from=" + from + "&until=" + until, function (data) {
    // Clear tables before filling them with data
    $("#client-frequency td").parent().remove();
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
        client = utils.escapeHtml(client);
        if (utils.escapeHtml(client) !== client) {
          // Make a copy with the escaped index if necessary
          data.top_sources[utils.escapeHtml(client)] = data.top_sources[client];
        }

        if (client.indexOf("|") === -1) {
          clientname = client;
        } else {
          var idx = client.indexOf("|");
          clientname = client.substr(0, idx);
        }

        percentage = (data.top_sources[client] / sum) * 100;
        clienttable.append(
          "<tr> " +
            utils.addTD(clientname) +
            utils.addTD(data.top_sources[client]) +
            utils.addTD(utils.colorBar(percentage, sum, "progress-bar-blue")) +
            "</tr> "
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
  $.getJSON("api_db.php?topDomains&from=" + from + "&until=" + until, function (data) {
    // Clear tables before filling them with data
    $("#domain-frequency td").parent().remove();
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
        domain = utils.escapeHtml(domain);
        if (utils.escapeHtml(domain) !== domain) {
          // Make a copy with the escaped index if necessary
          data.top_domains[utils.escapeHtml(domain)] = data.top_domains[domain];
        }

        percentage = (data.top_domains[domain] / sum) * 100;
        domaintable.append(
          "<tr> " +
            utils.addTD(domain) +
            utils.addTD(data.top_domains[domain]) +
            utils.addTD(utils.colorBar(percentage, sum, "queries-permitted")) +
            "</tr> "
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
  $.getJSON("api_db.php?topAds&from=" + from + "&until=" + until, function (data) {
    // Clear tables before filling them with data
    $("#ad-frequency td").parent().remove();
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
        ad = utils.escapeHtml(ad);
        if (utils.escapeHtml(ad) !== ad) {
          // Make a copy with the escaped index if necessary
          data.top_ads[utils.escapeHtml(ad)] = data.top_ads[ad];
        }

        percentage = (data.top_ads[ad] / sum) * 100;
        adtable.append(
          "<tr> " +
            utils.addTD(ad) +
            utils.addTD(data.top_ads[ad]) +
            utils.addTD(utils.colorBar(percentage, sum, "queries-blocked")) +
            "</tr> "
        );
      }
    }

    $("#ad-frequency .overlay").hide();

    listsStillLoading--;
    if (listsStillLoading === 0) timeoutWarning.hide();
  });
}

$("#querytime").on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format(dateformat) + " to " + picker.endDate.format(dateformat));
  timeoutWarning.show();
  listsStillLoading = 3;
  updateTopClientsChart();
  updateTopDomainsChart();
  updateTopAdsChart();
});
