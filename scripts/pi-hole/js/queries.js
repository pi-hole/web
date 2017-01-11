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
    if ( textStatus === "timeout" ) {
        alert( "The server took too long to send the data." );
    }
    else {
        alert( "An error occured while loading the data. Presumably your log is too large to be processed." );
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

    if("from" in GETDict)
    {
        APIstring += "&from="+GETDict["from"];
    }

    if("until" in GETDict)
    {
        APIstring += "&until="+GETDict["until"];
    }

    tableApi = $("#all-queries").DataTable( {
        "rowCallback": function( row, data, index ){
            status = data[4];
            if (status === "Pi-holed (exact)") {
                $(row).css("color","red");
                $("td:eq(5)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
            }
            else if (status === "Pi-holed (wildcard)") {
                $(row).css("color","red");
                $("td:eq(5)", row).html( "" );
            }
            else{
                $(row).css("color","green");
                $("td:eq(5)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
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
            { "width" : "20%", "type": "date" },
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
        status = data[4];
        if (status.substr(0,2) === "Pi")
        {
          add(data[2],"white");
        }
        else
        {
          add(data[2],"black");
        }
    } );

    if("client" in GETDict)
    {
        // Search in third column (zero indexed)
        // Use regular expression to only show exact matches, i.e.
        // don't show 192.168.0.100 when searching for 192.168.0.1
        // true = use regex, false = don't use smart search
        tableApi.column(3).search("^"+escapeRegex(GETDict["client"])+"$",true,false);
    }
    if("domain" in GETDict)
    {
        // Search in second column (zero indexed)
        tableApi.column(2).search("^"+escapeRegex(GETDict["domain"])+"$",true,false);
    }
} );


