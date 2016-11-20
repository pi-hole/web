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
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: "All Queries",
                    fill: true,
                    backgroundColor: "rgba(220,220,220,0.5)",
                    borderColor: "rgba(0, 166, 90,.8)",
                    pointBorderColor: "rgba(0, 166, 90,.8)",
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    data: [],
                    pointHitRadius: 20,
                    cubicInterpolationMode: 'monotone'
                },
                {
                    label: "Ad Queries",
                    fill: true,
                    backgroundColor: "rgba(0,192,239,0.5)",
                    borderColor: "rgba(0,192,239,1)",
                    pointBorderColor: "rgba(0,192,239,1)",
                    pointRadius: 1,
                    pointHoverRadius: 5,
                    data: [],
                    pointHitRadius: 20,
                    cubicInterpolationMode: 'monotone'
                }
            ]
        },
        options: {
            tooltips: {
                enabled: true,
                mode: 'x-axis'
            },
            legend: {
                display: false
            },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            },
            maintainAspectRatio: false
        }
    });

    // Create / load "Query Types" only if authorized
    if(!!document.getElementById("queryTypeChart"))
    {
        ctx = document.getElementById("queryTypeChart").getContext("2d");
        queryTypeChart = new Chart(ctx, {
            type: 'doughnut',
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
    if(!!document.getElementById("forwardDestinationChart"))
    {
        ctx = document.getElementById("forwardDestinationChart").getContext("2d");
        forwardDestinationChart = new Chart(ctx, {
            type: 'doughnut',
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

    // Pull in data via AJAX

    updateSummaryData();

    updateQueriesOverTime();

    updateTopClientsChart();

    updateTopLists();
});

// Functions to update data in page

function updateSummaryData(runOnce) {
    $.getJSON("api.php?summary", function LoadSummaryData(data) {
        //$("h3.statistic").addClass("glow");
        if ($("h3#ads_blocked_today").text() != data.ads_blocked_today) {
            $("h3#ads_blocked_today").addClass("glow");
        }
        if ($("h3#dns_queries_today").text() != data.dns_queries_today) {
            $("h3#dns_queries_today").addClass("glow");
        }
        if ($("h3#ads_percentage_today").text() != data.ads_percentage_today) {
            $("h3#ads_percentage_today").addClass("glow");
        }

        window.setTimeout(function(){
            $("h3#ads_blocked_today").text(data.ads_blocked_today);
            $("h3#dns_queries_today").text(data.dns_queries_today);
            $("h3#domains_being_blocked").text(data.domains_being_blocked);
            $("h3#ads_percentage_today").text(data.ads_percentage_today + "%");
            $("h3.statistic.glow").removeClass("glow")
        }, 500);
    }).done(function() {
        if (runOnce !== true) {
            setTimeout(updateSummaryData, 10000);
        }
    }).fail(function() {
        if (runOnce !== true) {
            setTimeout(updateSummaryData, (1000 * 60 * 5));
        }
    });;
}

function updateQueriesOverTime() {
    $.getJSON("api.php?overTimeData", function(data) {
        // Add data for each hour that is available
        // remove last data point since it not representative
        data.ads_over_time.splice(-1,1);
        for (hour in data.ads_over_time) {
            // Add x-axis label
            timeLineChart.data.labels.push(hour + ":00");
            timeLineChart.data.datasets[0].data.push(data.domains_over_time[hour]);
            timeLineChart.data.datasets[1].data.push(data.ads_over_time[hour]);
        }
        $('#queries-over-time .overlay').remove();
        timeLineChart.update();
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
        $('#query-types .overlay').remove();
        queryTypeChart.update();
        queryTypeChart.chart.config.options.cutoutPercentage=30;
        queryTypeChart.update();
    });
}

function updateTopClientsChart() {
    $.getJSON("api.php?summaryRaw&getQuerySources", function(data) {
        var clienttable =  $('#client-frequency').find('tbody:last');
        for (domain in data.top_sources) {
            clienttable.append('<tr> <td>' + domain +
                '</td> <td>' + data.top_sources[domain] + '</td> <td> <div class="progress progress-sm"> <div class="progress-bar progress-bar-blue" style="width: ' +
                data.top_sources[domain] / data.dns_queries_today * 100 + '%"></div> </div> </td> </tr> ');
        }

        $('#client-frequency .overlay').remove();
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
            forwardDestinationChart.data.labels.push(key);
        });
        // Build a single dataset with the data to be pushed
        var dd = {data: v, backgroundColor: c};
        // and push it at once
        forwardDestinationChart.data.datasets.push(dd);
        $('#forward-destinations .overlay').remove();
        forwardDestinationChart.update();
        forwardDestinationChart.chart.config.options.cutoutPercentage=30;
        forwardDestinationChart.update();
    });
}

function updateTopLists() {
    $.getJSON("api.php?summaryRaw&topItems", function(data) {
        var domaintable = $('#domain-frequency').find('tbody:last');
        var adtable = $('#ad-frequency').find('tbody:last');

        for (domain in data.top_queries) {
            domaintable.append('<tr> <td>' + domain +
                '</td> <td>' + data.top_queries[domain] + '</td> <td> <div class="progress progress-sm"> <div class="progress-bar progress-bar-green" style="width: ' +
                data.top_queries[domain] / data.dns_queries_today * 100 + '%"></div> </div> </td> </tr> ');
        }
        for (domain in data.top_ads) {
            adtable.append('<tr> <td>' + domain +
                '</td> <td>' + data.top_ads[domain] + '</td> <td> <div class="progress progress-sm"> <div class="progress-bar progress-bar-yellow" style="width: ' +
                data.top_ads[domain] / data.ads_blocked_today * 100 + '%"></div> </div> </td> </tr> ');
        }

        $('#domain-frequency .overlay').remove();
        $('#ad-frequency .overlay').remove();
    });
}
