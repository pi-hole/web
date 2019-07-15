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
    else if("querytype" in GETDict)
    {
        APIstring += "&querytype="+GETDict["querytype"];
    }
    else if("forwarddest" in GETDict)
    {
        APIstring += "&forwarddest="+GETDict["forwarddest"];
    }
    // If we don't ask filtering and also not for all queries, just request the most recent 100 queries
    else if(!("all" in GETDict))
    {
        APIstring += "=100";
    }

    tableApi = $("#all-queries").DataTable( {
        "rowCallback": function( row, data, index ){
            // DNSSEC status
            var dnssec_status;
            switch (data[5])
            {
            case "1":
                dnssec_status = "<br><span style=\"color:green\">SECURE</span>";
                break;
            case "2":
                dnssec_status = "<br><span style=\"color:orange\">INSECURE</span>";
                break;
            case "3":
                dnssec_status = "<br><span style=\"color:red\">BOGUS</span>";
                break;
            case "4":
                dnssec_status = "<br><span style=\"color:red\">ABANDONED</span>";
                break;
            case "5":
                dnssec_status = "<br><span style=\"color:orange\">UNKNOWN</span>";
                break;
            default: // No DNSSEC
                dnssec_status = "";
            }

            // Query status
            var blocked, fieldtext, buttontext, color;
            switch (data[4])
            {
            case "1":
                blocked = true;
                color = "red";
                fieldtext = "Blocked (gravity)";
                buttontext = "<button style=\"color:green; white-space: nowrap;\"><i class=\"fas fa-check\"></i> Whitelist</button>";
                break;
            case "2":
                blocked = false;
                color = "green";
                fieldtext = "OK <br class='hidden-lg'>(forwarded)"+dnssec_status;
                buttontext = "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>";
                break;
            case "3":
                blocked = false;
                color = "green";
                fieldtext = "OK <br class='hidden-lg'>(cached)"+dnssec_status;
                buttontext = "<button style=\"color:red; white-space: nowrap;\"><i class=\"fa fa-ban\"></i> Blacklist</button>";
                break;
            case "4":
                blocked = true;
                color = "red";
                fieldtext = "Blocked <br class='hidden-lg'>(regex/wildcard)";
                buttontext = "<button style=\"color:green; white-space: nowrap;\"><i class=\"fas fa-check\"></i> Whitelist</button>" ;
                break;
            case "5":
                blocked = true;
                color = "red";
                fieldtext = "Blocked <br class='hidden-lg'>(blacklist)";
                buttontext = "<button style=\"color:green; white-space: nowrap;\"><i class=\"fas fa-check\"></i> Whitelist</button>" ;
                break;
            case "6":
                blocked = true;
                color = "red";
                fieldtext = "Blocked <br class='hidden-lg'>(external, IP)";
                buttontext = "" ;
                break;
            case "7":
                blocked = true;
                color = "red";
                fieldtext = "Blocked <br class='hidden-lg'>(external, NULL)";
                buttontext = "" ;
                break;
            case "8":
                blocked = true;
                color = "red";
                fieldtext = "Blocked <br class='hidden-lg'>(external, NXRA)";
                buttontext = "" ;
                break;
            default:
                blocked = false;
                color = "black";
                fieldtext = "Unknown ("+parseInt(data[4])+")";
                buttontext = "";
            }
            $(row).css("color", color);
            $("td:eq(4)", row).html(fieldtext);
            $("td:eq(6)", row).html(buttontext);

            // Check for existence of sixth column and display only if not Pi-holed
            var replytext;
            if(data.length > 6 && !blocked)
            {
                switch(data[6])
                {
                case "0":
                    replytext = "N/A";
                    break;
                case "1":
                    replytext = "NODATA";
                    break;
                case "2":
                    replytext = "NXDOMAIN";
                    break;
                case "3":
                    replytext = "CNAME";
                    break;
                case "4":
                    replytext = "IP";
                    break;
                case "5":
                    replytext = "DOMAIN";
                    break;
                case "6":
                    replytext = "RRNAME";
                    break;
                case "7":
                    replytext = "SERVFAIL";
                    break;
                case "8":
                    replytext = "REFUSED";
                    break;
                case "9":
                    replytext = "NOTIMP";
                    break;
                case "10":
                    replytext = "upstream error";
                    break;
                default:
                    replytext = "? ("+parseInt(data[6])+")";
                }
            }
            else
            {
                replytext = "-";
            }
            $("td:eq(5)", row).css("color","black");
            $("td:eq(5)", row).html(replytext);

            if(data.length > 7 && data[7] > 0)
            {
                var content = $("td:eq(5)", row).html();
                $("td:eq(5)", row).html(content + " (" + (0.1*data[7]).toFixed(1)+"ms)");
            }

        },
        dom: "<'row'<'col-sm-12'f>>" +
             "<'row'<'col-sm-4'l><'col-sm-8'p>>" +
             "<'row'<'col-sm-12'<'table-responsive'tr>>>" +
             "<'row'<'col-sm-5'i><'col-sm-7'p>>",
        "ajax": {
            "url": APIstring,
            "error": handleAjaxError,
            "dataSrc": function(data){
                var dataIndex = 0;
                return data.data.map(function(x){
                    x[0] = x[0] * 1e6 + (dataIndex++);
                    return x;
                });
            }
        },
        "autoWidth" : false,
        "processing": true,
        "order" : [[0, "desc"]],
        "columns": [
            { "width" : "15%", "render": function (data, type, full, meta) { if(type === "display"){return moment.unix(Math.floor(data/1e6)).format("Y-MM-DD [<br class='hidden-lg'>]HH:mm:ss z");}else{return data;} }},
            { "width" : "4%" },
            { "width" : "36%", "render": $.fn.dataTable.render.text() },
            { "width" : "8%", "render": $.fn.dataTable.render.text() },
            { "width" : "14%", "orderData": 4 },
            { "width" : "8%", "orderData": 6 },
            { "width" : "10%", "orderData": 4 }
        ],
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "stateSave": true,
        stateSaveCallback: function(settings, data) {
            // Store current state in client's local storage area
            localStorage.setItem("query_log_table", JSON.stringify(data));
        },
        stateLoadCallback: function(settings) {
            // Receive previous state from client's local storage area
            var data = localStorage.getItem("query_log_table");
            // Return if not available
            if(data === null){ return null; }
            data = JSON.parse(data);
            // Always start on the first page to show most recent queries
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
        } ],
        "initComplete": function () {
            var api = this.api();
            // Query type IPv4 / IPv6
            api.$("td:eq(1)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(1)").hover(
              function () {
                  if(autofilter()) {
                      this.title = "Click to show only " + this.innerHTML + " queries";
                      this.style.color = "#72afd2";
                  } else {
                      this.title = "";
                      this.style.color = "";
                  }
              },
              function () { this.style.color=""; }
            );
            api.$("td:eq(1)").css("cursor","pointer");
            // Domain
            api.$("td:eq(2)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(2)").hover(
              function () {
                  if(autofilter()) {
                      this.title = "Click to show only queries with domain " + this.innerHTML;
                      this.style.color = "#72afd2";
                  } else {
                      this.title = "";
                      this.style.color = "";
                  }
              },
              function () { this.style.color=""; }
            );
            api.$("td:eq(2)").css("cursor","pointer");
            // Client
            api.$("td:eq(3)").click( function () { if(autofilter()){ api.search( this.innerHTML ).draw(); $("#resetButton").show(); }});
            api.$("td:eq(3)").hover(
              function () {
                  if(autofilter()) {
                      this.title = "Click to show only queries made by " + this.innerHTML;
                      this.style.color = "#72afd2";
                  } else {
                      this.title = "";
                      this.style.color = "";
                  }
              },
              function () { this.style.color=""; }
            );
            api.$("td:eq(3)").css("cursor","pointer");
        }
    });

    $("#all-queries tbody").on( "click", "button", function () {
        var data = tableApi.row( $(this).parents("tr") ).data();
        if (data[4] === "1" || data[4] === "4" || data[4] === "5")
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
