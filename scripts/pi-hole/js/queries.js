/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
var tableApi;

function escapeRegex(text) {
  var map = {
    "(": "\\(",
    ")": "\\)",
    ".": "\\.",
  };
  return text.replace(/[().]/g, function(m) { return map[m]; });
}

function refreshData() {
    tableApi.ajax.url("api.php?getAllQueries").load();
//    updateSessionTimer();
}

function add(domain,list) {
    var token = $("#token").html();
    var alInfo = $("#alInfo");
    var alList = $("#alList");
    var alDomain = $("#alDomain");
    alDomain.html(domain);
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var err = $("#err");

    if(list === "white")
    {
        alList.html("Whitelist");
    }
    else
    {
        alList.html("Blacklist");
    }

    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain, "list":list, "token":token},
        success: function(response) {
            if (response.indexOf("not a valid argument") >= 0 || response.indexOf("is not a valid domain") >= 0)
            {
                alFailure.show();
                err.html(response);
                alFailure.delay(4000).fadeOut(2000, function() { alFailure.hide(); });
            }
            else
            {
                alSuccess.show();
                alSuccess.delay(1000).fadeOut(2000, function() { alSuccess.hide(); });
            }
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
                alList.html("");
                alDomain.html("");
            });
        },
        error: function(jqXHR, exception) {
            alFailure.show();
            err.html("");
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
                alList.html("");
                alDomain.html("");
            });
        }
    });
}
function handleAjaxError( xhr, textStatus, error ) {
    if ( textStatus === "timeout" )
    {
        alert( "The server took too long to send the data." );
    }
    else if(xhr.responseText.indexOf("Connection refused") >= 0)
    {
        alert( "An error occured while loading the data: Connection refused. Is FTL running?" );
    }
    else
    {
        alert( "An unknown error occured while loading the data.\n"+xhr.responseText );
    }
    $("#all-queries_processing").hide();
    tableApi.clear();
    tableApi.draw();
}

$(document).ready(function() {
    var status;

    // Do we want to filter queries?
    var GETDict = {};
    location.search.substr(1).split("&").forEach(function(item) {GETDict[item.split("=")[0]] = item.split("=")[1];});

    var APIstring = "api.php?getAllQueries";

    if("from" in GETDict && "until" in GETDict)
    {
        APIstring += "&from="+GETDict["from"];
        APIstring += "&until="+GETDict["until"];
    }
    else if("client" in GETDict)
    {
        APIstring += "&client="+GETDict["client"];
    }
    else if("domain" in GETDict)
    {
        APIstring += "&domain="+GETDict["domain"];
    }
    else if(!("all" in GETDict))
    {
        var timestamp = Math.floor(Date.now() / 1000);
        APIstring += "&from="+(timestamp - 600);
        APIstring += "&until="+(timestamp + 100);
    }

    tableApi = $("#all-queries").DataTable( {
        "rowCallback": function( row, data, index ){
            if (data[4] === "1")
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed" );
                $("td:eq(5)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
            }
            else if (data[4] === "2")
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK (forwarded)" );
                $("td:eq(5)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
            }
            else if (data[4] === "3")
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK (cached)" );
                $("td:eq(5)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );

            }
            else if (data[4] === "4")
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed (wildcard)" );
                $("td:eq(5)", row).html( "" );
            }
            else if (data[4] === "5")
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed (blacklist)" );
                $("td:eq(5)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
            }
            else
            {
                $("td:eq(4)", row).html( "Unknown" );
                $("td:eq(5)", row).html( "" );
            }
        },
        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {"url": APIstring, "error": handleAjaxError },
        "autoWidth" : false,
        "processing": true,
        "order" : [[0, "desc"]],
        "columns": [
            { "width" : "20%", "render": function (data, type, full, meta) { if(type === "display"){return moment.unix(data).format("Y-MM-DD HH:mm:ss z");}else{return data;} }},
            { "width" : "10%" },
            { "width" : "40%" },
            { "width" : "10%" },
            { "width" : "10%" },
            { "width" : "10%" },
        ],
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": ""
        } ]
    });
    $("#all-queries tbody").on( "click", "button", function () {
        var data = tableApi.row( $(this).parents("tr") ).data();
        if (data[4] === "1" || data[4] === "5")
        {
          add(data[2],"white");
        }
        else
        {
          add(data[2],"black");
        }
    } );
} );


