/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
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

var failures = 0;
function updateQueriesOverTime() {
    $.getJSON("api.php?overTimeData10mins", function(data) {

        if("FTLnotrunning" in data)
        {
            return;
        }

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
                var d,h;
                h = parseInt(data.domains_over_time[0][hour]);
                if(parseInt(data.ads_over_time[0][0]) < 1200)
                {
                    // Fallback - old style
                    d = new Date().setHours(Math.floor(h / 6), 10 * (h % 6), 0, 0);
                }
                else
                {
                    // New style: Get Unix timestamps
                    d = new Date(1000*h);
                }

                timeLineChart.data.labels.push(d);
                timeLineChart.data.datasets[0].data.push(data.domains_over_time[1][hour]);
                timeLineChart.data.datasets[1].data.push(data.ads_over_time[1][hour]);
            }
        }
        $("#queries-over-time .overlay").hide();
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

function updateQueryTypesOverTime() {
    $.getJSON("api.php?overTimeDataQueryTypes", function(data) {

        if("FTLnotrunning" in data)
        {
            return;
        }

        // convert received objects to arrays
        data.over_time = objectToArray(data.over_time);
        var timestamps = data.over_time[0];
        var plotdata  = data.over_time[1];
        // Remove possibly already existing data
        queryTypeChart.data.labels = [];
        queryTypeChart.data.datasets[0].data = [];
        queryTypeChart.data.datasets[1].data = [];

        var colors = [];
        $.each($.AdminLTE.options.colors, function(key, value) { colors.push(value); });
        queryTypeChart.data.datasets[0].backgroundColor = colors[0];
        queryTypeChart.data.datasets[1].backgroundColor = colors[1];

            // Add data for each hour that is available
        for (var j in timestamps) {
            if ({}.hasOwnProperty.call(timestamps, j)) {
                var d,h;
                h = parseInt(timestamps[j]);
                // New style: Get Unix timestamps
                d = new Date(1000*h);

                var sum = plotdata[j][0] + plotdata[j][1];
                var A = 0, AAAA = 0;
                if(sum > 0)
                {
                    A = plotdata[j][0]/sum;
                    AAAA = plotdata[j][1]/sum;
                }

                queryTypeChart.data.labels.push(d);
                queryTypeChart.data.datasets[0].data.push(A);
                queryTypeChart.data.datasets[1].data.push(AAAA);
            }
        }
        $("#query-types .overlay").hide();
        queryTypeChart.update();
    }).done(function() {
        // Reload graph after 10 minutes
        failures = 0;
        setTimeout(updateQueryTypesOverTime, 600000);
    }).fail(function() {
        failures++;
        if(failures < 5)
        {
            // Try again after 1 minute only if this has not failed more
            // than five times in a row
            setTimeout(updateQueryTypesOverTime, 60000);
        }
    });
}

function updateForwardedOverTime() {
    $.getJSON("api.php?overTimeDataForwards&getForwardDestinationNames", function(data) {

        if("FTLnotrunning" in data)
        {
            return;
        }

        // convert received objects to arrays
        data.over_time = objectToArray(data.over_time);
        var timestamps = data.over_time[0];
        var plotdata  = data.over_time[1];
        var labels = [];
        var key, i, j;
        for (key in data.forward_destinations)
        {
            if (!{}.hasOwnProperty.call(data.forward_destinations, key)) continue;
            if(key.indexOf("|") > -1)
            {
                var idx = key.indexOf("|");
                key = key.substr(0, idx);
            }
            labels.push(key);
        }
        // Get colors from AdminLTE
        var colors = [];
        $.each($.AdminLTE.options.colors, function(key, value) { colors.push(value); });
        var v = [], c = [], k = [];

        // Remove possibly already existing data
        forwardDestinationChart.data.labels = [];
        forwardDestinationChart.data.datasets[0].data = [];
        for (i = 1; i < forwardDestinationChart.data.datasets.length; i++)
        {
            forwardDestinationChart.data.datasets[i].data = [];
        }

        // Collect values and colors, and labels
        forwardDestinationChart.data.datasets[0].backgroundColor = colors[0];
        forwardDestinationChart.data.datasets[0].pointRadius = 0;
        forwardDestinationChart.data.datasets[0].pointHitRadius = 5;
        forwardDestinationChart.data.datasets[0].pointHoverRadius = 5;
        forwardDestinationChart.data.datasets[0].label = labels[0];

        for (i = forwardDestinationChart.data.datasets.length; i < plotdata[0].length; i++)
        {
            forwardDestinationChart.data.datasets.push({data: [], backgroundColor: colors[i], pointRadius: 0, pointHitRadius: 5, pointHoverRadius: 5, label: labels[i]});
        }

        // Add data for each dataset that is available
        for (j in timestamps)
        {
            if (!{}.hasOwnProperty.call(timestamps, j)) continue;
            var sum = 0.0;
            for (key in plotdata[j])
            {
                if (!{}.hasOwnProperty.call(plotdata[j], key)) continue;
                sum += plotdata[j][key];
            }
            var dd = [];
            for (key in plotdata[j])
            {
                if (!{}.hasOwnProperty.call(plotdata[j], key)) continue;
                var singlepoint = plotdata[j][key];
                forwardDestinationChart.data.datasets[key].data.push(singlepoint/sum);
            }

            var d = new Date(1000*parseInt(timestamps[j]));
            forwardDestinationChart.data.labels.push(d);
        }
        $("#forward-destinations .overlay").hide();
        forwardDestinationChart.update();
    }).done(function() {
        // Reload graph after 10 minutes
        failures = 0;
        setTimeout(updateForwardedOverTime, 600000);
    }).fail(function() {
        failures++;
        if(failures < 5)
        {
            // Try again after 1 minute only if this has not failed more
            // than five times in a row
            setTimeout(updateForwardedOverTime, 60000);
        }
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

        if("FTLnotrunning" in data)
        {
            return;
        }

        // Clear tables before filling them with data
        $("#client-frequency td").parent().remove();
        var clienttable =  $("#client-frequency").find("tbody:last");
        var client, percentage, clientname, clientip;
        for (client in data.top_sources) {

            if ({}.hasOwnProperty.call(data.top_sources, client)){
                // Sanitize client
                if(escapeHtml(client) !== client)
                {
                    // Make a copy with the escaped index if necessary
                    data.top_sources[escapeHtml(client)] = data.top_sources[client];
                }
                client = escapeHtml(client);
                if(client.indexOf("|") > -1)
                {
                    var idx = client.indexOf("|");
                    clientname = client.substr(0, idx);
                    clientip = client.substr(idx+1, client.length-idx);
                }
                else
                {
                    clientname = client;
                    clientip = client;
                }

                var url = "<a href=\"queries.php?client="+clientip+"\" title=\""+clientip+"\">"+clientname+"</a>";
                percentage = data.top_sources[client] / data.dns_queries_today * 100;
                clienttable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_sources[client] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"% of " + data.dns_queries_today + "\"> <div class=\"progress-bar progress-bar-blue\" style=\"width: " +
                    percentage + "%\"></div> </div> </td> </tr> ");
            }

        }

        $("#client-frequency .overlay").hide();
        // Update top clients list data every ten seconds
        setTimeout(updateTopClientsChart, 10000);
    });
}

function updateTopLists() {
    $.getJSON("api.php?summaryRaw&topItems", function(data) {

        if("FTLnotrunning" in data)
        {
            return;
        }

        // Clear tables before filling them with data
        $("#domain-frequency td").parent().remove();
        $("#ad-frequency td").parent().remove();
        var domaintable = $("#domain-frequency").find("tbody:last");
        var adtable = $("#ad-frequency").find("tbody:last");
        var url, domain, percentage;
        for (domain in data.top_queries) {
            if ({}.hasOwnProperty.call(data.top_queries,domain)){
                // Sanitize domain
                if(escapeHtml(domain) !== domain)
                {
                    // Make a copy with the escaped index if necessary
                    data.top_queries[escapeHtml(domain)] = data.top_queries[domain];
                }
                domain = escapeHtml(domain);
                url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                percentage = data.top_queries[domain] / data.dns_queries_today * 100;
                domaintable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_queries[domain] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"% of " + data.dns_queries_today + "\"> <div class=\"progress-bar progress-bar-green\" style=\"width: " +
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
                if(escapeHtml(domain) !== domain)
                {
                    // Make a copy with the escaped index if necessary
                    data.top_ads[escapeHtml(domain)] = data.top_ads[domain];
                }
                domain = escapeHtml(domain);
                url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                percentage = data.top_ads[domain] / data.ads_blocked_today * 100;
                adtable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_ads[domain] + "</td> <td> <div class=\"progress progress-sm\" title=\""+percentage.toFixed(1)+"% of " + data.ads_blocked_today + "\"> <div class=\"progress-bar progress-bar-yellow\" style=\"width: " +
                    percentage + "%\"></div> </div> </td> </tr> ");
            }
        }

        // Remove table if there are no results (e.g. privacy mode enabled)
        if(jQuery.isEmptyObject(data.top_ads))
        {
            $("#ad-frequency").parent().remove();
        }

        $("#domain-frequency .overlay").hide();
        $("#ad-frequency .overlay").hide();
        // Update top lists data every 10 seconds
        setTimeout(updateTopLists, 10000);
    });
}

var FTLoffline = false;
function updateSummaryData(runOnce) {
    var setTimer = function(timeInSeconds) {
        if (!runOnce) {
            setTimeout(updateSummaryData, timeInSeconds * 1000);
        }
    };
    $.getJSON("api.php?summary", function LoadSummaryData(data) {

        updateSessionTimer();

        if("FTLnotrunning" in data)
        {
            data["ads_blocked_today"] = "Lost";
            data["dns_queries_today"] = "connection";
            data["ads_percentage_today"] = "to";
            data["domains_being_blocked"] = "API";
            // Adjust text
            $("#temperature").html("<i class=\"fa fa-circle\" style=\"color:#FF0000\"></i> FTL offline");
            // Show spinner
            $("#queries-over-time .overlay").show();
            $("#forward-destinations .overlay").show();
            $("#query-types .overlay").show();
            $("#client-frequency .overlay").show();
            $("#domain-frequency .overlay").show();
            $("#ad-frequency .overlay").show();

            FTLoffline = true;
        }
        else
        {
            if(FTLoffline)
            {
                // FTL was previously offline
                FTLoffline = false;
                $("#temperature").text(" ");
                updateQueriesOverTime();
                updateForwardedOverTime();
                updateQueryTypesOverTime();
                updateTopClientsChart();
                updateTopLists();
            }
        }

        ["ads_blocked_today", "dns_queries_today", "ads_percentage_today"].forEach(function(today) {
            var todayElement = $("h3#" + today);
            todayElement.text() !== data[today] &&
            todayElement.text() !== data[today] + "%" &&
            todayElement.addClass("glow");
        });

        window.setTimeout(function() {
            ["ads_blocked_today", "dns_queries_today", "domains_being_blocked", "ads_percentage_today"].forEach(function(header, idx) {
                var textData = (idx === 3 && data[header] !== "to") ? data[header] + "%" : data[header];
                $("h3#" + header).text(textData);
            });
            $("h3.statistic.glow").removeClass("glow");
        }, 500);

    }).done(function() {
        if(!FTLoffline)
        {
          setTimer(1);
        }
        else
        {
          setTimer(10);
        }
    }).fail(function() {
        setTimer(300);
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

        // Pull in data via AJAX

        updateSummaryData();

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
                            var from = padNumber(h)+":"+padNumber(m-5)+":00";
                            var to = padNumber(h)+":"+padNumber(m+4)+":59";
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

        updateQueriesOverTime();

        // Create / load "Forward Destinations over Time" only if authorized
        if(document.getElementById("forwardDestinationChart"))
        {
            ctx = document.getElementById("forwardDestinationChart").getContext("2d");
            forwardDestinationChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{ data: [] }]
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
                                var from = padNumber(h)+":"+padNumber(m-5)+":00";
                                var to = padNumber(h)+":"+padNumber(m+4)+":59";
                                return "Forward destinations from "+from+" to "+to;
                            },
                            label: function(tooltipItems, data) {
                                return data.datasets[tooltipItems.datasetIndex].label + ": " + (100.0*tooltipItems.yLabel).toFixed(1) + "%";
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
                                mix: 0.0,
                                max: 1.0,
                                beginAtZero: true,
                                callback: function(value, index, values) {
                                    return Math.round(value*100) + " %";
                                }
                            },
                            stacked: true
                        }]
                    },
                    maintainAspectRatio: true
                }
            });

            // Pull in data via AJAX
            updateForwardedOverTime();
        }

        // Create / load "Query Types over Time" only if authorized
        if(document.getElementById("queryTypeChart"))
        {
            ctx = document.getElementById("queryTypeChart").getContext("2d");
            queryTypeChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: "A: IPv4 queries",
                            pointRadius: 0,
                            pointHitRadius: 5,
                            pointHoverRadius: 5,
                            data: []
                        },
                        {
                            label: "AAAA: IPv6 queries",
                            pointRadius: 0,
                            pointHitRadius: 5,
                            pointHoverRadius: 5,
                            data: []
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
                                var from = padNumber(h)+":"+padNumber(m-5)+":00";
                                var to = padNumber(h)+":"+padNumber(m+4)+":59";
                                return "Query types from "+from+" to "+to;
                            },
                            label: function(tooltipItems, data) {
                                return data.datasets[tooltipItems.datasetIndex].label + ": " + (100.0*tooltipItems.yLabel).toFixed(1) + "%";
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
                                mix: 0.0,
                                max: 1.0,
                                beginAtZero: true,
                                callback: function(value, index, values) {
                                    return Math.round(value*100) + " %";
                                }
                            },
                            stacked: true
                        }]
                    },
                    maintainAspectRatio: true
                }
            });

            // Pull in data via AJAX
            updateQueryTypesOverTime();
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
                var from = label/1000 - 300;
                var until = label/1000 + 300;
                window.location.href = "queries.php?from="+from+"&until="+until;
            }
            return false;
        });
    });
