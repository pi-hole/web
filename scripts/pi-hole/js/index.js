// Define global variables
var timeLineChart, queryTypeChart, forwardDestinationChart;

function padNumber(num) {
    return ("00" + num).substr(-2,2);
}

// Helper function needed for converting the Objects to Arrays

function objectToArray(p){
    var keys = Object.keys(p);
    keys.sort(function(a, b) {
        return a - b;
    });

    var arr = [], idx = [];
    for (var i = 0; i < keys.length; i++) {
        arr.push(p[keys[i]]);
        idx.push(keys[i]);
    }
    return [idx,arr];
}

// Functions to update data in page


function updateSummaryData(runOnce) {
    var setTimer = function(timeInSeconds) {
        if (!runOnce) {
            setTimeout(updateSummaryData, timeInSeconds * 1000);
        }
    };
    $.getJSON("api.php?summary", function LoadSummaryData(data) {

        ["ads_blocked_today", "dns_queries_today", "ads_percentage_today"].forEach(function(today) {
            var todayElement = $("h3#" + today);
            todayElement.text() !== data[today] && todayElement.addClass("glow");
        });

        window.setTimeout(function() {
            ["ads_blocked_today", "dns_queries_today", "domains_being_blocked", "ads_percentage_today"].forEach(function(header, idx) {
                var textData = idx === 3 ? data[header] + "%" : data[header];
                $("h3#" + header).text(textData);
            });
            $("h3.statistic.glow").removeClass("glow");
        }, 500);

        updateSessionTimer();
    }).done(function() {
        setTimer(10);
    }).fail(function() {
        setTimer(300);
    });
}

var failures = 0;
function updateQueriesOverTime() {
    $.getJSON("api.php?overTimeData10mins", function(data) {
        // convert received objects to arrays
        data.domains_over_time = objectToArray(data.domains_over_time);
        data.ads_over_time = objectToArray(data.ads_over_time);
        // remove last data point since it not representative
        data.ads_over_time[0].splice(-1,1);
        // Remove possibly already existing data
        timeLineChart.data.labels = [];
        timeLineChart.data.datasets[0].data = [];
        timeLineChart.data.datasets[1].data = [];
        // Add data for each hour that is available
        for (var hour in data.ads_over_time[0]) {
            if ({}.hasOwnProperty.call(data.ads_over_time[0], hour)) {
                var h = parseInt(data.domains_over_time[0][hour]);
                var d = new Date().setHours(Math.floor(h / 6), 10 * (h % 6), 0, 0);

                timeLineChart.data.labels.push(d);
                timeLineChart.data.datasets[0].data.push(data.domains_over_time[1][hour]);
                timeLineChart.data.datasets[1].data.push(data.ads_over_time[1][hour]);
            }
        }
        $("#queries-over-time .overlay").remove();
        timeLineChart.update();
    }).done(function() {
        // Reload graph after 10 minutes
        failures = 0;
        setTimeout(updateQueriesOverTime, 600000);
    }).fail(function() {
        failures++;
        if(failures < 5)
        {
            // Try again after 1 minute only if this has not failed more
            // than five times in a row
            setTimeout(updateQueriesOverTime, 60000);
        }
    });
}

function updateQueryTypes() {
    $.getJSON("api.php?getQueryTypes", function(data) {
        var colors = [];
        // Get colors from AdminLTE
        $.each($.AdminLTE.options.colors, function(key, value) { colors.push(value); });
        var v = [], c = [];
        // Collect values and colors, immediately push individual labels
        $.each(data, function(key , value) {
            v.push(value);
            c.push(colors.shift());
            queryTypeChart.data.labels.push(key.substr(6,key.length - 7));
        });
        // Build a single dataset with the data to be pushed
        var dd = {data: v, backgroundColor: c};
        // and push it at once
        queryTypeChart.data.datasets.push(dd);
        $("#query-types .overlay").remove();
        queryTypeChart.update();
        queryTypeChart.chart.config.options.cutoutPercentage=30;
        queryTypeChart.update();
    });
}

// Credit: http://stackoverflow.com/questions/1787322/htmlspecialchars-equivalent-in-javascript/4835406#4835406
function escapeHtml(text) {
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "\'": "&#039;"
  };

  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function updateTopClientsChart() {
    $.getJSON("api.php?summaryRaw&getQuerySources", function(data) {
        var clienttable =  $("#client-frequency").find("tbody:last");
        var domain, percentage, domainname, domainip;
        for (domain in data.top_sources) {

            if ({}.hasOwnProperty.call(data.top_sources, domain)){
                // Sanitize domain
                domain = escapeHtml(domain);
                if(domain.indexOf("|") > -1)
                {
                    var idx = domain.indexOf("|");
                    domainname = domain.substr(0, idx);
                    domainip = domain.substr(idx+1, domain.length-idx);
                }
                else
                {
                    domainname = domain;
                    domainip = domain;
                }

                var url = "<a href=\"queries.php?client="+domain+"\" title=\""+domainip+"\">"+domainname+"</a>";
                percentage = data.top_sources[domain] / data.dns_queries_today * 100;
                clienttable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_sources[domain] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"%\"> <div class=\"progress-bar progress-bar-blue\" style=\"width: " +
                    percentage + "%\"></div> </div> </td> </tr> ");
            }

        }

        $("#client-frequency .overlay").remove();
    });
}

function updateForwardDestinations() {
    $.getJSON("api.php?getForwardDestinations", function(data) {
        var colors = [];
        // Get colors from AdminLTE
        $.each($.AdminLTE.options.colors, function(key, value) { colors.push(value); });
        var v = [], c = [];
        // Collect values and colors, immediately push individual labels
        $.each(data, function(key , value) {
            v.push(value);
            c.push(colors.shift());
            if(key.indexOf("|") > -1)
            {
                var idx = key.indexOf("|");
                key = key.substr(0, idx)+" ("+key.substr(idx+1, key.length-idx)+")";
            }
            forwardDestinationChart.data.labels.push(key);
        });
        // Build a single dataset with the data to be pushed
        var dd = {data: v, backgroundColor: c};
        // and push it at once
        forwardDestinationChart.data.datasets.push(dd);
        $("#forward-destinations .overlay").remove();
        forwardDestinationChart.update();
        forwardDestinationChart.chart.config.options.cutoutPercentage=30;
        forwardDestinationChart.update();
    });
}

function updateTopLists() {
    $.getJSON("api.php?summaryRaw&topItems", function(data) {
        var domaintable = $("#domain-frequency").find("tbody:last");
        var adtable = $("#ad-frequency").find("tbody:last");
        var url, domain, percentage;
        for (domain in data.top_queries) {
            if ({}.hasOwnProperty.call(data.top_queries,domain)){
                // Sanitize domain
                domain = escapeHtml(domain);
                if(domain !== "pi.hole")
                {
                    url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                }
                else
                {
                    url = domain;
                }
                percentage = data.top_queries[domain] / data.dns_queries_today * 100;
                domaintable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_queries[domain] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"%\"> <div class=\"progress-bar progress-bar-green\" style=\"width: " +
                    percentage + "%\"></div> </div> </td> </tr> ");
            }
        }

        // Remove table if there are no results (e.g. privacy mode enabled)
        if(jQuery.isEmptyObject(data.top_queries))
        {
            $("#domain-frequency").parent().remove();
        }

        for (domain in data.top_ads) {
            if ({}.hasOwnProperty.call(data.top_ads,domain)){
                // Sanitize domain
                domain = escapeHtml(domain);
                url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                percentage = data.top_ads[domain] / data.ads_blocked_today * 100;
                adtable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_ads[domain] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"%\"> <div class=\"progress-bar progress-bar-yellow\" style=\"width: " +
                    percentage + "%\"></div> </div> </td> </tr> ");
            }
        }

        $("#domain-frequency .overlay").remove();
        $("#ad-frequency .overlay").remove();
    });
}

$(document).ready(function() {

        var isMobile = {
            Windows: function() {
                return /IEMobile/i.test(navigator.userAgent);
            },
            Android: function() {
                return /Android/i.test(navigator.userAgent);
            },
            BlackBerry: function() {
                return /BlackBerry/i.test(navigator.userAgent);
            },
            iOS: function() {
                return /iPhone|iPad|iPod/i.test(navigator.userAgent);
            },
            any: function() {
                return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Windows());
            }
        };

        var ctx = document.getElementById("queryOverTimeChart").getContext("2d");
        timeLineChart = new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [
                    {
                        label: "Total DNS Queries",
                        fill: true,
                        backgroundColor: "rgba(220,220,220,0.5)",
                        borderColor: "rgba(0, 166, 90,.8)",
                        pointBorderColor: "rgba(0, 166, 90,.8)",
                        pointRadius: 1,
                        pointHoverRadius: 5,
                        data: [],
                        pointHitRadius: 5,
                        cubicInterpolationMode: "monotone"
                    },
                    {
                        label: "Blocked DNS Queries",
                        fill: true,
                        backgroundColor: "rgba(0,192,239,0.5)",
                        borderColor: "rgba(0,192,239,1)",
                        pointBorderColor: "rgba(0,192,239,1)",
                        pointRadius: 1,
                        pointHoverRadius: 5,
                        data: [],
                        pointHitRadius: 5,
                        cubicInterpolationMode: "monotone"
                    }
                ]
            },
            options: {
                tooltips: {
                    enabled: true,
                    mode: "x-axis",
                    callbacks: {
                        title: function(tooltipItem, data) {
                            var label = tooltipItem[0].xLabel;
                            var time = label.match(/(\d?\d):?(\d?\d?)/);
                            var h = parseInt(time[1], 10);
                            var m = parseInt(time[2], 10) || 0;
                            var from = padNumber(h)+":"+padNumber(m)+":00";
                            var to = padNumber(h)+":"+padNumber(m+9)+":59";
                            return "Queries from "+from+" to "+to;
                        },
                        label: function(tooltipItems, data) {
                            if(tooltipItems.datasetIndex === 1)
                            {
                                var percentage = 0.0;
                                var total = parseInt(data.datasets[0].data[tooltipItems.index]);
                                var blocked = parseInt(data.datasets[1].data[tooltipItems.index]);
                                if(total > 0)
                                {
                                    percentage = 100.0*blocked/total;
                                }
                                return data.datasets[tooltipItems.datasetIndex].label + ": " + tooltipItems.yLabel + " (" + percentage.toFixed(1) + "%)";
                            }
                            else
                            {
                                return data.datasets[tooltipItems.datasetIndex].label + ": " + tooltipItems.yLabel;
                            }
                        }
                    }
                },
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        type: "time",
                        time: {
                            unit: "hour",
                            displayFormats: {
                                hour: "HH:mm"
                            },
                            tooltipFormat: "HH:mm"
                        }
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                maintainAspectRatio: false
            }
        });

        // Pull in data via AJAX

        updateSummaryData();

        updateQueriesOverTime();

        // Create / load "Query Types" only if authorized
        if(document.getElementById("queryTypeChart"))
        {
            ctx = document.getElementById("queryTypeChart").getContext("2d");
            queryTypeChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: [],
                    datasets: [{ data: [] }]
                },
                options: {
                    legend: {
                        display: false
                    },
                    animation: {
                        duration: 2000
                    },
                    cutoutPercentage: 0
                }
            });
            updateQueryTypes();
        }

        // Create / load "Forward Destinations" only if authorized
        if(document.getElementById("forwardDestinationChart"))
        {
            ctx = document.getElementById("forwardDestinationChart").getContext("2d");
            forwardDestinationChart = new Chart(ctx, {
                type: "doughnut",
                data: {
                    labels: [],
                    datasets: [{ data: [] }]
                },
                options: {
                    legend: {
                        display: false
                    },
                    animation: {
                        duration: 2000
                    },
                    cutoutPercentage: 0
                }
            });
            updateForwardDestinations();
        }

        // Create / load "Top Domains" and "Top Advertisers" only if authorized
        if(document.getElementById("domain-frequency")
            && document.getElementById("ad-frequency"))
        {
            updateTopLists();
        }

        // Create / load "Top Clients" only if authorized
        if(document.getElementById("client-frequency"))
        {
            updateTopClientsChart();
        }

        $("#queryOverTimeChart").click(function(evt){
            var activePoints = timeLineChart.getElementAtEvent(evt);
            if(activePoints.length > 0)
            {
                //get the internal index of slice in pie chart
                var clickedElementindex = activePoints[0]["_index"];

                //get specific label by index
                var label = timeLineChart.data.labels[clickedElementindex];

                //get value by index
                //var value = timeLineChart.data.datasets[0].data[clickedElementindex];
                var time = new Date(label);
                var from = time.getHours()+":"+time.getMinutes();
                var until = time.getHours()+":"+padNumber(parseInt(time.getMinutes()+9),2);
                window.location.href = "queries.php?from="+from+"&until="+until;
            }
            return false;
        });
    });
