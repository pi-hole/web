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
    }

    var host = window.location.host;
    var source = new EventSource("http://"+host+"/admin/php/queryads.php?domain="+domain.val());

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
            if(e.data.indexOf("results") !== -1 && e.data.indexOf("0 results") === -1)
            {
                var shortstring = e.data.replace("::: /etc/pihole/","");
                ta.append(shortstring);
            }
        }
    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);
}

// $(function(){
//    eventsourcetest();
// });

// Handle enter button
$(document).keypress(function(e) {
    if(e.which === 13 && $("#domain").is(":focus")) {
        // Enter was pressed, and the input has focus
        eventsource();
    }
});
// Handle button
$("#btnSearch").on("click", function() {
    eventsource();
});
