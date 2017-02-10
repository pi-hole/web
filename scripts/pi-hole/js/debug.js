// Credit: http://stackoverflow.com/a/10642418/2087442
function httpGet(ta,quiet,theUrl)
{
    var xmlhttp;
    if (window.XMLHttpRequest)
    {
    // code for IE7+
        xmlhttp = new XMLHttpRequest();
    }
    else
    {
    // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function()
    {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200)
        {
            ta.show();
            ta.empty();
            if(!quiet)
            {
                ta.append(xmlhttp.responseText);
            }
            else
            {
                quietfilter(ta,xmlhttp.responseText);
            }
        }
    };
    xmlhttp.open("GET", theUrl, false);
    xmlhttp.send();
}

function eventsource() {
    var ta = $("#output");

    // IE does not support EventSource - load whole content at once
    if (typeof EventSource !== "function") {
        httpGet(ta,quiet,"/admin/scripts/pi-hole/php/debug.php?IE");
        return;
    }

    var host = window.location.host;
    var source = new EventSource("/admin/scripts/pi-hole/php/debug.php");

    // Reset and show field
    ta.empty();
    ta.show();

    source.addEventListener("message", function(e) {
        ta.append(e.data);
    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);
}

$("#debugBtn").on("click", function(){
    $("#debugBtn").attr("disabled", true);
    eventsource();
});
