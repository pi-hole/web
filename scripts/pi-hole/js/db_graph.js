/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global Chart:false, moment:false */

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
var interval = 0;

var timeoutWarning = $("#timeoutWarning");

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

var timeLineChart;

function compareNumbers(a, b) {
  return a - b;
}

function updateQueriesOverTime() {
  $("#queries-over-time .overlay").show();
  timeoutWarning.show();

  // Compute interval to obtain about 200 values
  var num = 200;
  interval = (until - from) / num;
  // Default displaying axis scaling
  timeLineChart.options.scales.xAxes[0].time.unit = "hour";

  if (num * interval >= 6 * 29 * 24 * 60 * 60) {
    // If the requested data is more than 3 months, set ticks interval to quarterly
    timeLineChart.options.scales.xAxes[0].time.unit = "quarter";
  } else if (num * interval >= 3 * 29 * 24 * 60 * 60) {
    // If the requested data is more than 3 months, set ticks interval to months
    timeLineChart.options.scales.xAxes[0].time.unit = "month";
  }

  if (num * interval >= 29 * 24 * 60 * 60) {
    // If the requested data is more than 1 month, set ticks interval to weeks
    timeLineChart.options.scales.xAxes[0].time.unit = "week";
  } else if (num * interval >= 6 * 24 * 60 * 60) {
    // If the requested data is more than 1 week, set ticks interval to days
    timeLineChart.options.scales.xAxes[0].time.unit = "day";
  }

  $.getJSON(
    "api_db.php?getGraphData&from=" + from + "&until=" + until + "&interval=" + interval,
    function(data) {
      // convert received objects to arrays
      data.domains_over_time = objectToArray(data.domains_over_time);
      data.ads_over_time = objectToArray(data.ads_over_time);
      // Remove possibly already existing data
      timeLineChart.data.labels = [];
      timeLineChart.data.datasets[0].data = [];
      timeLineChart.data.datasets[1].data = [];

      var dates = [],
        hour;

      for (hour in data.domains_over_time[0]) {
        if (Object.prototype.hasOwnProperty.call(data.domains_over_time[0], hour)) {
          dates.push(parseInt(data.domains_over_time[0][hour]));
        }
      }

      for (hour in data.ads_over_time[0]) {
        if (Object.prototype.hasOwnProperty.call(data.ads_over_time[0], hour)) {
          if (dates.indexOf(parseInt(data.ads_over_time[0][hour])) === -1) {
            dates.push(parseInt(data.ads_over_time[0][hour]));
          }
        }
      }

      dates.sort(compareNumbers);

      // Add data for each hour that is available
      for (hour in dates) {
        if (Object.prototype.hasOwnProperty.call(dates, hour)) {
          var date,
            dom = 0,
            ads = 0;
          date = new Date(1000 * dates[hour]);

          var idx = data.domains_over_time[0].indexOf(dates[hour].toString());
          if (idx > -1) {
            dom = data.domains_over_time[1][idx];
          }

          idx = data.ads_over_time[0].indexOf(dates[hour].toString());
          if (idx > -1) {
            ads = data.ads_over_time[1][idx];
          }

          timeLineChart.data.labels.push(date);
          timeLineChart.data.datasets[0].data.push(dom - ads);
          timeLineChart.data.datasets[1].data.push(ads);
        }
      }

      timeLineChart.options.scales.xAxes[0].display = true;
      $("#queries-over-time .overlay").hide();
      timeoutWarning.hide();
      timeLineChart.update();
    }
  );
}

$(document).ready(function() {
  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  timeLineChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Permitted DNS Queries",
          fill: true,
          backgroundColor: "rgba(0, 166, 90,.8)",
          borderColor: "rgba(0, 166, 90,.8)",
          pointBorderColor: "rgba(0, 166, 90,.8)",
          pointRadius: 1,
          pointHoverRadius: 5,
          data: [],
          pointHitRadius: 5
        },
        {
          label: "Blocked DNS Queries",
          fill: true,
          backgroundColor: "rgba(0,192,239,1)",
          borderColor: "rgba(0,192,239,1)",
          pointBorderColor: "rgba(0,192,239,1)",
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
        callbacks: {
          title: function(tooltipItem) {
            var label = tooltipItem[0].xLabel;
            var time = new Date(label);
            var from_date =
              time.getFullYear() +
              "-" +
              padNumber(time.getMonth() + 1) +
              "-" +
              padNumber(time.getDate()) +
              " " +
              padNumber(time.getHours()) +
              ":" +
              padNumber(time.getMinutes()) +
              ":" +
              padNumber(time.getSeconds());
            time = new Date(time.valueOf() + 1000 * interval);
            var until_date =
              time.getFullYear() +
              "-" +
              padNumber(time.getMonth() + 1) +
              "-" +
              padNumber(time.getDate()) +
              " " +
              padNumber(time.getHours()) +
              ":" +
              padNumber(time.getMinutes()) +
              ":" +
              padNumber(time.getSeconds());
            return "Queries from " + from_date + " to " + until_date;
          },
          label: function(tooltipItems, data) {
            if (tooltipItems.datasetIndex === 1) {
              var percentage = 0.0;
              var total = parseInt(data.datasets[0].data[tooltipItems.index]);
              var blocked = parseInt(data.datasets[1].data[tooltipItems.index]);
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
                minute: "HH:mm",
                hour: "HH:mm",
                day: "MMM DD",
                week: "MMM DD",
                month: "MMM",
                quarter: "MMM",
                year: "YYYY MMM"
              }
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
});

$("#querytime").on("apply.daterangepicker", function(ev, picker) {
  $(this).val(picker.startDate.format(dateformat) + " to " + picker.endDate.format(dateformat));
  $("#queries-over-time").show();
  updateQueriesOverTime();
});

$("#queryOverTimeChart").click(function(evt) {
  var activePoints = timeLineChart.getElementAtEvent(evt);
  if (activePoints.length > 0) {
    //get the internal index in the chart
    var clickedElementindex = activePoints[0]._index;

    //get specific label by index
    var label = timeLineChart.data.labels[clickedElementindex];

    //get value by index
    var from = label / 1000;
    var until = label / 1000 + 600;
    window.location.href = "db_queries.php?from=" + from + "&until=" + until;
  }

  return false;
});
