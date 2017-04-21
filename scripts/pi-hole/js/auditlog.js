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

function updateTopLists() {
    $.getJSON("api.php?topItems=audit", function(data) {

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
                domain = escapeHtml(domain);
                url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                percentage = data.top_queries[domain] / data.dns_queries_today * 100;
                domaintable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_queries[domain] + "</td> <td> Buttons ... </td> </tr> ");
            }
        }

        for (domain in data.top_ads) {
            if ({}.hasOwnProperty.call(data.top_ads,domain)){
                // Sanitize domain
                domain = escapeHtml(domain);
                url = "<a href=\"queries.php?domain="+domain+"\">"+domain+"</a>";
                percentage = data.top_ads[domain] / data.ads_blocked_today * 100;
                adtable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_ads[domain] + "</td> <td> Buttons ... </td> </tr> ");
            }
        }

        $("#domain-frequency .overlay").hide();
        $("#ad-frequency .overlay").hide();
        // Update top lists data every 10 seconds
        setTimeout(updateTopLists, 10000);
    });
}

$(document).ready(function() {

        // Pull in data via AJAX
        updateTopLists();
    });
