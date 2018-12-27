/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.  */
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
    tableApi.ajax.url("api_db.php?network").load();
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
    $("#network-entries_processing").hide();
    tableApi.clear();
    tableApi.draw();
}

function autofilter(){
   return document.getElementById("autofilter").checked;
}

function getTimestamp(){
  if (!Date.now)
  {
    Date.now = function() { return new Date().getTime(); }
  }
  return Math.floor(Date.now() / 1000);
}

function valueToHex(c) {
    var hex = Math.round(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(values) {
    return "#" + valueToHex(values[0])
               + valueToHex(values[1])
               + valueToHex(values[2]);
}

function mixColors(ratio, rgb1, rgb2)
{
    return [(1.0-ratio)*rgb1[0]+ratio*rgb2[0],
            (1.0-ratio)*rgb1[1]+ratio*rgb2[1],
            (1.0-ratio)*rgb1[2]+ratio*rgb2[2]];
}

$(document).ready(function() {
    var APIstring = "api_db.php?network";
    tableApi = $("#network-entries").DataTable( {
        "rowCallback": function( row, data, index )
        {
             var color, lastQuery = parseInt(data["lastQuery"]);
             if(lastQuery > 0)
             {
                 var diff = getTimestamp()-lastQuery;
                 if(diff <= 86400)
                 {
                     // Last query came in within the last 24 hours (24*60*60 = 86400)
                     // Color: light-green to light-yellow
                     var ratio = 1e0*diff/86400;
                     var lightgreen = [0xE7, 0xFF, 0xDE];
                     var lightyellow = [0xFF, 0xFF, 0xDF];
                     color = rgbToHex(mixColors(ratio, lightgreen, lightyellow));
                 }
                 else
                 {
                     // Last query was longer than 24 hours ago
                     // Color: light-orange
                     color = "#FFEDD9";
                 }
             }
             else
             {
                 // This client has never sent a query to Pi-hole, color light-red
                 color = "#FFBFAA";
             }
             $(row).css("background-color", color);

             if(data["lastQuery"] === 0)
             {
                 $("td:eq(5)", row).html("Never");
             }

             if(data["name"].length < 1)
             {
                 $("td:eq(3)", row).html("N/A");
             }
        },
        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {"url": APIstring, "error": handleAjaxError, "dataSrc": "network" },
        "autoWidth" : false,
        "processing": true,
        "order" : [[5, "desc"]],
        "columns": [
            {data: "ip", "width" : "10%", "render": $.fn.dataTable.render.text() },
            {data: "hwaddr",  "width" : "10%", "render": $.fn.dataTable.render.text() },
            {data: "interface",  "width" : "10%", "render": $.fn.dataTable.render.text() },
            {data: "name",  "width" : "10%", "render": $.fn.dataTable.render.text() },
            {data: "firstSeen",  "width" : "10%", "render": function (data, type, full, meta) { if(type === "display"){return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");}else{return data;} }},
            {data: "lastQuery",  "width" : "10%", "render": function (data, type, full, meta) { if(type === "display"){return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");}else{return data;} }},
            {data: "numQueries",  "width" : "10%", "render": $.fn.dataTable.render.text() }
        ],
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "stateSave": true,
        stateSaveCallback: function(settings, data) {
            // Store current state in client's local storage area
            localStorage.setItem("network_table", JSON.stringify(data));
        },
        stateLoadCallback: function(settings) {
            // Receive previous state from client's local storage area
            var data = localStorage.getItem("network_table");
            // Return if not available
            if(data === null){ return null; }
            data = JSON.parse(data);
            // Always start on the first page
            data["start"] = 0;
            // Always start with empty search field
            data["search"]["search"] = "";
            // Apply loaded state to table
            return data;
        },
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": ""
        } ]
    });
} );


