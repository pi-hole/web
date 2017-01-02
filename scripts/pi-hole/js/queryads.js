var exact = "";
function eventsource() {
    var ta = $("#output");
    var domain = $("#domain");
    var q = $("#quiet");
    if(domain.val().length === 0)
    {
        return;
    }

    var quiet = false;
    if(q.val() === "yes")
    {
        quiet = true;
        exact = "exact";
    }

    var host = window.location.host;
    var source = new EventSource("http://"+host+"/admin/scripts/pi-hole/php/queryads.php?domain="+domain.val().toLowerCase()+"&"+exact);

    // Reset and show field
    ta.empty();
    ta.show();

    source.addEventListener("message", function(e) {
        if(!quiet)
        {
            ta.append(e.data);
        }
        else
        {
            var lines = e.data.split("\n");
            for(var i = 0;i<lines.length;i++)
            {
                if(lines[i].indexOf("results") !== -1 && lines[i].indexOf("0 results") === -1)
                {
                    var shortstring = lines[i].replace("::: /etc/pihole/","");
                    // Remove "(x results)"
                    shortstring = shortstring.replace(/\(.*/,"");
                    ta.append(shortstring+"\n");
                }
            }
        }
    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);

    // Reset exact variable
    exact = "";
}

// Handle enter button
$(document).keypress(function(e) {
    if(e.which === 13 && $("#domain").is(":focus")) {
        // Enter was pressed, and the input has focus
        exact = "";
        eventsource();
    }
});
// Handle button
$("#btnSearch").on("click", function() {
    exact = "";
    eventsource();
});
// Handle exact button
$("#btnSearchExact").on("click", function() {
    exact = "exact";
    eventsource();
});
