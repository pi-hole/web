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
    tableApi.ajax.url("api.php?getAllSpeedTestData&PHP").load();
//    updateSessionTimer();
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

    var APIstring = "api.php?getAllSpeedTestData&PHP";



    tableApi = $("#all-queries").DataTable( {

        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {"url": APIstring, "error": handleAjaxError },
        "autoWidth" : true,
        "processing": true,
        "order" : [[0, "desc"]],
        "columns": [
            null,
            { "render": function (data, type, full, meta) { if(type === "display"){return moment(data).format("Y-MM-DD HH:mm:ss z");}else{return data;} }},
            { "render": function (data, type, full, meta) { if(type === "display"){return moment(data).format("Y-MM-DD HH:mm:ss z");}else{return data;} }},
            null ,
            null,
            null,
            null,
            null,
            null,
            null,
            {"render" : function (data, type, full, meta) { data = '<a target="_blank" href="' + data + '"> View Result</a>'; return data; }},
        ],

        "columnDefs": [
        {
               "targets": [ 0, 2 ],
               "visible": false
           }
       ]
    });
} );
