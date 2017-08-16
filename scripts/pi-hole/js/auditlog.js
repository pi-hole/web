/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
// Define global variables
var timeLineChart, queryTypeChart, forwardDestinationChart;

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
                    "</td> <td>" + data.top_queries[domain] + "</td> <td> <button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button> <button style=\"color:orange; white-space: nowrap;\"><i class=\"fa fa-balance-scale\"></i> Audit</button> </td> </tr> ");
            }
        }

        for (domain in data.top_ads) {
            if ({}.hasOwnProperty.call(data.top_ads,domain)){
                var input = domain.split(" ");
                // Sanitize domain
                var printdomain = escapeHtml(input[0]);
                if(input.length > 1)
                {
                    url = "<a href=\"queries.php?domain="+printdomain+"\">"+printdomain+"</a> (wildcard blocked)";
                    adtable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_ads[domain] + "</td> <td> <button style=\"color:orange; white-space: nowrap;\"><i class=\"fa fa-balance-scale\"></i> Audit</button> </td> </tr> ");
                }
                else
                {
                    url = "<a href=\"queries.php?domain="+printdomain+"\">"+printdomain+"</a>";
                    adtable.append("<tr> <td>" + url +
                    "</td> <td>" + data.top_ads[domain] + "</td> <td> <button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button> <button style=\"color:orange; white-space: nowrap;\"><i class=\"fa fa-balance-scale\"></i> Audit</button> </td> </tr> ");
                }
            }
        }

        $("#domain-frequency .overlay").hide();
        $("#ad-frequency .overlay").hide();
        // Update top lists data every second
        setTimeout(updateTopLists, 1000);
    });
}


function add(domain,list) {
    var token = $("#token").html();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain, "list":list, "token":token, "auditlog":1}
    });
}

$(document).ready(function() {

    // Pull in data via AJAX
    updateTopLists();

    $("#domain-frequency tbody").on( "click", "button", function () {
        var url = ($(this).parents("tr"))[0].innerText.split("	")[0];
        if($(this).context.innerText === " Blacklist")
        {
            add(url,"black");
            $("#gravityBtn").prop("disabled", false);
        }
        else
        {
            add(url,"audit");
        }
    });

    $("#ad-frequency tbody").on( "click", "button", function () {
        var url = ($(this).parents("tr"))[0].innerText.split("	")[0].split(" ")[0];
        if($(this).context.innerText === " Whitelist")
        {
            add(url,"white");
            $("#gravityBtn").prop("disabled", false);
        }
        else
        {
            add(url,"audit");
        }
    });
});


$("#gravityBtn").on("click", function() {
    window.location.replace("gravity.php?go");
});
