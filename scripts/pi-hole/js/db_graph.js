/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, Chart:false, moment:false */

var start__ = moment().subtract(7, "days");
var from = Math.round(moment(start__).utc().valueOf() / 1000);
var end__ = moment();
var until = Math.round(moment(end__).utc().valueOf() / 1000);
var interval = 0;

var dateformat = "MMMM Do YYYY, HH:mm";

// get the database min timestamp
var mintimestamp;
$.getJSON("api_db.php?getMinTimestamp", function (ts) {
  mintimestamp = ts.mintimestamp * 1000 || 0; // return the timestamp in milliseconds or zero (in case of NaN)
});

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
        "All Time": [moment(mintimestamp), moment()],
      },
      opens: "center",
      showDropdowns: true,
      autoUpdateInput: false,
    },
    function (startt, endt) {
      from = Math.round(moment(startt).utc().valueOf() / 1000);
      until = Math.round(moment(endt).utc().valueOf() / 1000);
    }
  );
});

var timeLineChart;

function compareNumbers(a, b) {
  return a - b;
}

function computeInterval(from, until) {
  // Compute interval to obtain about 200 values
  var num = 200;
  // humanly understandable intervals (in seconds)
  var intervals = [
    10,
    20,
    30,
    60,
    120,
    180,
    300,
    600,
    900,
    1200,
    1800,
    3600,
    3600 * 2,
    3600 * 3,
    3600 * 4,
    3600 * 6,
    3600 * 8,
    3600 * 12,
    3600 * 24,
    3600 * 24 * 7,
    3600 * 24 * 30,
  ];

  var duration = until - from;
  if (duration / (num * intervals[0]) < 1) {
    return intervals[0];
  }

  var preverr = Number.MAX_VALUE,
    err;
  for (var i = 0; i < intervals.length; i++) {
    err = Math.abs(1 - duration / (num * intervals[i]));
    // pick the interval with least deviation
    // from selected duration
    if (preverr < err) {
      return intervals[i - 1];
    }

    preverr = err;
  }

  return intervals[intervals.length - 1];
}

function updateQueriesOverTime() {
  var timeoutWarning = $("#timeoutWarning");

  $("#queries-over-time .overlay").show();
  timeoutWarning.show();

  interval = computeInterval(from, until);
  // Default displaying axis scaling
  timeLineChart.options.scales.xAxes[0].time.unit = "hour";

  var duration = until - from;
  // Xaxis scaling based on selected daterange
  if (duration > 4 * 365 * 24 * 60 * 60) {
    // If the requested data is more than 4 years, set ticks interval to year
    timeLineChart.options.scales.xAxes[0].time.unit = "year";
  } else if (duration >= 366 * 24 * 60 * 60) {
    // If the requested data is more than 1 year, set ticks interval to quarter
    timeLineChart.options.scales.xAxes[0].time.unit = "quarter";
  } else if (duration >= 92 * 24 * 60 * 60) {
    // If the requested data is more than 3 months, set ticks interval to months
    timeLineChart.options.scales.xAxes[0].time.unit = "month";
  } else if (duration >= 31 * 24 * 60 * 60) {
    // If the requested data is 1 month or more, set ticks interval to weeks
    timeLineChart.options.scales.xAxes[0].time.unit = "week";
  } else if (duration > 3 * 24 * 60 * 60) {
    // If the requested data is more than 3 days (72 hours), set ticks interval to days
    timeLineChart.options.scales.xAxes[0].time.unit = "day";
  }

  $.getJSON(
    "api_db.php?getGraphData&from=" + from + "&until=" + until + "&interval=" + interval,
    function (data) {
      // convert received objects to arrays
      data.domains_over_time = utils.objectToArray(data.domains_over_time);
      data.ads_over_time = utils.objectToArray(data.ads_over_time);
      // Remove possibly already existing data
      timeLineChart.data.labels = [];
      timeLineChart.data.datasets[0].data = [];
      timeLineChart.data.datasets[1].data = [];

      var dates = [],
        hour;

      for (hour in data.domains_over_time[0]) {
        if (Object.prototype.hasOwnProperty.call(data.domains_over_time[0], hour)) {
          dates.push(parseInt(data.domains_over_time[0][hour], 10));
        }
      }

      for (hour in data.ads_over_time[0]) {
        if (
          Object.prototype.hasOwnProperty.call(data.ads_over_time[0], hour) &&
          dates.indexOf(parseInt(data.ads_over_time[0][hour], 10)) === -1
        ) {
          dates.push(parseInt(data.ads_over_time[0][hour], 10));
        }
      }

      dates.sort(compareNumbers);

      // Add data for each hour that is available
      for (hour in dates) {
        if (Object.prototype.hasOwnProperty.call(dates, hour)) {
          var date,
            total = 0,
            blocked = 0;
          date = new Date(1000 * dates[hour]);

          var idx = data.domains_over_time[0].indexOf(dates[hour].toString());
          if (idx > -1) {
            total = data.domains_over_time[1][idx];
          }

          idx = data.ads_over_time[0].indexOf(dates[hour].toString());
          if (idx > -1) {
            blocked = data.ads_over_time[1][idx];
          }

          timeLineChart.data.labels.push(date);
          timeLineChart.data.datasets[0].data.push(blocked);
          timeLineChart.data.datasets[1].data.push(total - blocked);
        }
      }

      timeLineChart.options.scales.xAxes[0].display = true;
      $("#queries-over-time .overlay").hide();
      timeoutWarning.hide();
      timeLineChart.update();
    }
  );
}

$(function () {
  var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
  var blockedColor = $(".queries-blocked").css("background-color");
  var permittedColor = $(".queries-permitted").css("background-color");
  var gridColor = $(".graphs-grid").css("background-color");
  var ticksColor = $(".graphs-ticks").css("color");

  timeLineChart = new Chart(ctx, {
    type: utils.getGraphType(),
    data: {
      labels: [],
      datasets: [
        {
          label: "Blocked DNS Queries",
          fill: true,
          backgroundColor: blockedColor,
          borderColor: blockedColor,
          pointBorderColor: blockedColor,
          pointRadius: 0,
          pointHoverRadius: 5,
          data: [],
          pointHitRadius: 5,
        },
        {
          label: "Permitted DNS Queries",
          fill: true,
          backgroundColor: permittedColor,
          borderColor: permittedColor,
          pointBorderColor: permittedColor,
          pointRadius: 0,
          pointHoverRadius: 5,
          data: [],
          pointHitRadius: 5,
        },
      ],
    },
    options: {
      tooltips: {
        enabled: true,
        itemSort: function (a, b) {
          return b.datasetIndex - a.datasetIndex;
        },
        mode: "x-axis",
        callbacks: {
          title: function (tooltipItem) {
            var label = tooltipItem[0].xLabel;
            var time = new Date(label);
            var fromDate =
              time.getFullYear() +
              "-" +
              utils.padNumber(time.getMonth() + 1) +
              "-" +
              utils.padNumber(time.getDate());
            var fromTime =
              utils.padNumber(time.getHours()) +
              ":" +
              utils.padNumber(time.getMinutes()) +
              ":" +
              utils.padNumber(time.getSeconds());
            time = new Date(time.valueOf() + 1000 * interval);
            var untilDate =
              time.getFullYear() +
              "-" +
              utils.padNumber(time.getMonth() + 1) +
              "-" +
              utils.padNumber(time.getDate());
            var untilTime =
              utils.padNumber(time.getHours()) +
              ":" +
              utils.padNumber(time.getMinutes()) +
              ":" +
              utils.padNumber(time.getSeconds());

            if (fromDate === untilDate) {
              // Abbreviated form for intervals on the same day
              // We split title in two lines on small screens
              if ($(window).width() < 992) {
                untilTime += "\n";
              }

              return ("Queries from " + fromTime + " to " + untilTime + " on " + fromDate).split(
                "\n "
              );
            }

            // Full tooltip for intervals spanning more than one day
            // We split title in two lines on small screens
            if ($(window).width() < 992) {
              fromDate += "\n";
            }

            return (
              "Queries from " +
              fromDate +
              " " +
              fromTime +
              " to " +
              untilDate +
              " " +
              untilTime
            ).split("\n ");
          },
          label: function (tooltipItems, data) {
            if (tooltipItems.datasetIndex === 0) {
              var percentage = 0;
              var permitted = parseInt(data.datasets[1].data[tooltipItems.index], 10);
              var blocked = parseInt(data.datasets[0].data[tooltipItems.index], 10);
              if (permitted + blocked > 0) {
                percentage = (100 * blocked) / (permitted + blocked);
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
          },
        },
      },
      legend: {
        display: false,
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
                quarter: "YYYY MMM",
                year: "YYYY",
              },
            },
            gridLines: {
              color: gridColor,
              zeroLineColor: gridColor,
            },
            ticks: {
              fontColor: ticksColor,
            },
          },
        ],
        yAxes: [
          {
            stacked: true,
            ticks: {
              beginAtZero: true,
              fontColor: ticksColor,
            },
            gridLines: {
              color: gridColor,
            },
          },
        ],
      },
      elements: {
        line: {
          borderWidth: 0,
          spanGaps: false,
        },
      },
      maintainAspectRatio: false,
    },
  });
});

$("#querytime").on("apply.daterangepicker", function (ev, picker) {
  $(this).val(picker.startDate.format(dateformat) + " to " + picker.endDate.format(dateformat));
  $("#queries-over-time").show();
  updateQueriesOverTime();
});

$("#queryOverTimeChart").click(function (evt) {
  var activePoints = timeLineChart.getElementAtEvent(evt);
  if (activePoints.length > 0) {
    //get the internal index in the chart
    var clickedElementindex = activePoints[0]._index;

    //get specific label by index
    var label = timeLineChart.data.labels[clickedElementindex];

    //get value by index
    var from = label / 1000;
    var until = label / 1000 + interval;
    window.location.href = "db_queries.php?from=" + from + "&until=" + until;
  }

  return false;
});
