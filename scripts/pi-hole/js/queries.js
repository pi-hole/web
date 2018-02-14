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
    tableApi.ajax.url("api.php?getAllQueries").load();
//    updateSessionTimer();
}

function add(domain,list) {
    var token = $("#token").html();
    var alertModal = $("#alertModal");
    var alProcessing = alertModal.find(".alProcessing");
    var alSuccess = alertModal.find(".alSuccess");
    var alFailure = alertModal.find(".alFailure");
    var alNetworkErr = alertModal.find(".alFailure #alNetErr");
    var alCustomErr = alertModal.find(".alFailure #alCustomErr");
    var alList = "#alList";
    var alDomain = "#alDomain";

    // Exit the function here if the Modal is already shown (multiple running interlock)
    if (alertModal.css("display") !== "none") {
        return;
    }

    var listtype;
    if (list === "white") {
        listtype = "Whitelist";
    } else {
        listtype = "Blacklist";
    }
    alProcessing.children(alDomain).html(domain);
    alProcessing.children(alList).html(listtype);
    alertModal.modal("show");

    // add Domain to List after Modal has faded in
    alertModal.one("shown.bs.modal", function() {
        $.ajax({
            url: "scripts/pi-hole/php/add.php",
            method: "post",
            data: {"domain":domain, "list":list, "token":token},
            success: function(response) {
                alProcessing.hide();
                if (response.indexOf("not a valid argument") >= 0 ||
                    response.indexOf("is not a valid domain") >= 0 ||
                    response.indexOf("Wrong token") >= 0)
                {
                    // Failure
                    alNetworkErr.hide();
                    alCustomErr.html(response.replace("[✗]", ""));
                    alFailure.fadeIn(1000);
                    setTimeout(function() { alertModal.modal("hide"); }, 3000);
                }
                else
                {
                    // Success
                    alSuccess.children(alDomain).html(domain);
                    alSuccess.children(alList).html(listtype);
                    alSuccess.fadeIn(1000);
                    setTimeout(function() { alertModal.modal("hide"); }, 2000);
                }
            },
            error: function(jqXHR, exception) {
                // Network Error
                alProcessing.hide();
                alNetworkErr.show();
                alFailure.fadeIn(1000);
                setTimeout(function() { alertModal.modal("hide"); }, 3000);
            }
        });
    });
        
    // Reset Modal after it has faded out
    alertModal.one("hidden.bs.modal", function() {
        alProcessing.show();
        alSuccess.add(alFailure).hide();
        alProcessing.add(alSuccess).children(alDomain).html("").end().children(alList).html("");
        alCustomErr.html("");
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

function autofilter(){
   return document.getElementById("autofilter").checked;
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
                $("td:eq(6)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
            }
            else if (data[4] === "2")
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK <br class='hidden-lg'>(forwarded)" );
                $("td:eq(6)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
            }
            else if (data[4] === "3")
            {
                $(row).css("color","green");
                $("td:eq(4)", row).html( "OK <br class='hidden-lg'>(cached)" );
                $("td:eq(6)", row).html( "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>" );
            }
            else if (data[4] === "4")
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed <br class='hidden-lg'>(wildcard)" );
                $("td:eq(6)", row).html( "" );
            }
            else if (data[4] === "5")
            {
                $(row).css("color","red");
                $("td:eq(4)", row).html( "Pi-holed <br class='hidden-lg'>(blacklist)" );
                $("td:eq(6)", row).html( "<button style=\"color:green; white-space: nowrap;\"><i class=\"fa fa-pencil-square-o\"></i> Whitelist</button>" );
            }
            else
            {
                $("td:eq(4)", row).html( "Unknown" );
                $("td:eq(6)", row).html( "" );
            }
            if (data[5] === "1")
            {
                $("td:eq(5)", row).css("color","green");
                $("td:eq(5)", row).html( "SECURE" );
            }
            else if (data[5] === "2")
            {
                $("td:eq(5)", row).css("color","orange");
                $("td:eq(5)", row).html( "INSECURE" );
            }
            else if (data[5] === "3")
            {
                $("td:eq(5)", row).css("color","red");
                $("td:eq(5)", row).html( "BOGUS" );
            }
            else if (data[5] === "4")
            {
                $("td:eq(5)", row).css("color","red");
                $("td:eq(5)", row).html( "ABANDONED" );
            }
            else if (data[5] === "5")
            {
                $("td:eq(5)", row).css("color","red");
                $("td:eq(5)", row).html( "?" );
            }
            else
            {
                $("td:eq(5)", row).css("color","black");
                $("td:eq(5)", row).html( "-" );
            }
        },
        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {"url": APIstring, "error": handleAjaxError },
        "autoWidth" : false,
        "processing": true,
        "order" : [[0, "desc"]],
        "columns": [
            { "width" : "15%", "render": function (data, type, full, meta) { if(type === "display"){return moment.unix(data).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");}else{return data;} }},
            { "width" : "10%" },
            { "width" : "37%", "render": $.fn.dataTable.render.text() },
            { "width" : "8%", "render": $.fn.dataTable.render.text() },
            { "width" : "10%" },
            { "width" : "5%" },
            { "width" : "10%" }
        ],
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": ""
        } ],
        "initComplete": function () {
            var api = this.api();
            // Query type IPv4 / IPv6
            api.$("td:eq(1)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(1)").hover(
              function () { this.title="Click to show only "+this.innerHTML+" queries"; this.style.color="#72afd2"; },
              function () { this.style.color=""; }
            );
            api.$("td:eq(1)").css("cursor","pointer");
            // Domain
            api.$("td:eq(2)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(2)").hover(
              function () { this.title="Click to show only queries with domain "+this.innerHTML; this.style.color="#72afd2"; },
              function () { this.style.color=""; }
            );
            api.$("td:eq(2)").css("cursor","pointer");
            // Client
            api.$("td:eq(3)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(3)").hover(
              function () { this.title="Click to show only queries made by "+this.innerHTML; this.style.color="#72afd2"; },
              function () { this.style.color=""; }
            );
            api.$("td:eq(3)").css("cursor","pointer");
        }
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

    $("#resetButton").click( function () { tableApi.search("").draw(); $("#resetButton").hide(); } );
} );


