/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */

var start__ = moment().subtract(6, "days");
var from = moment(start__).utc().valueOf()/1000;
var end__ = moment();
var until = moment(end__).utc().valueOf()/1000;

$(function () {
    $("#reservationtime").daterangepicker(
    {
      timePicker: true, timePickerIncrement: 15,
      locale: { format: "MMMM Do YYYY, h:mm A" },
      ranges: {
        "Today": [moment(), moment()],
        "Yesterday": [moment().subtract(1, "days"), moment().subtract(1, "days")],
        "Last 7 Days": [moment().subtract(6, "days"), moment()],
        "Last 30 Days": [moment().subtract(29, "days"), moment()],
        "This Month": [moment().startOf("month"), moment().endOf("month")],
        "Last Month": [moment().subtract(1, "month").startOf("month"), moment().subtract(1, "month").endOf("month")]
      },
      startDate: start__, endDate: end__,
      "opens": "center", "showDropdowns": true
    },
    function (startt, endt) {
      from = moment(startt).utc().valueOf()/1000;
      until = moment(endt).utc().valueOf()/1000;
    });
});

var tableApi, statistics;

function escapeRegex(text) {
  var map = {
    "(": "\\(",
    ")": "\\)",
    ".": "\\.",
  };
  return text.replace(/[().]/g, function(m) { return map[m]; });
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

var reloadCallback = function()
{
    statistics = [0,0,0,0];
    var data = tableApi.rows().data();
    for (var i = 0; i < data.length; i++) {
        // console.log(data[i]);
        statistics[0]++;
        if(data[i][4] === 1)
        {
            statistics[2]++;
        }
        else if(data[i][4] === 3)
        {
            statistics[1]++;
        }
        else if(data[i][4] === 4)
        {
            statistics[3]++;
        }
    }
    $("h3#dns_queries").text(statistics[0]);
    $("h3#ads_blocked_exact").text(statistics[2]);
    $("h3#ads_wildcard_blocked").text(statistics[3]);

    var percent = 0.0;
    if(statistics[2] + statistics[3] > 0)
    {
        percent = 100.0*(statistics[2] + statistics[3]) / statistics[0];
    }
    console.log(percent);
    $("h3#ads_percentage_today").text(parseFloat(percent).toFixed(1)+" %");
};

function refreshTableData() {
    var APIstring = "api_db.php?getAllQueries&from="+from+"&until="+until;
    statistics = [0,0,0];
    tableApi.ajax.url(APIstring).load(reloadCallback);
}

$(document).ready(function() {
    var status;

    tableApi = $("#all-queries").DataTable( {
        "rowCallback": function( row, data, index ){
            if (data[4] === 1)
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed" );
                $("td:eq(5)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
                // statistics[2]++;
            }
            else if (data[4] === 2)
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK (forwarded)" );
                $("td:eq(5)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
            }
            else if (data[4] === 3)
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK (cached)" );
                $("td:eq(5)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
                // statistics[1]++;

            }
            else if (data[4] === 4)
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed (wildcard)" );
                $("td:eq(5)", row).html( "" );
                // statistics[3]++;
            }
            else
            {
                $("td:eq(4)", row).html( "Unknown ("+data[4]+")" );
                $("td:eq(5)", row).html( "" );
            }
            // statistics[0]++;
        },
        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {"url": "api_db.php?getAllQueries=empty", "error": handleAjaxError },
        "autoWidth" : false,
        "processing": true,
        "deferRender": true,
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
        if (data[4] === "1")
        {
          add(data[2],"white");
        }
        else
        {
          add(data[2],"black");
        }
    } );
} );

// Handle "Go" Button
$("#btnGo").on("click", function() {
    refreshTableData();
});
