var source;
function eventsource() {
    var ta = $("#output");
    source = new EventSource("php/taillog.php");

    ta.html("");
    ta.show();

    source.addEventListener("message", function(e) {
        if(e.data.indexOf("Ctrl-C") === -1)
        {
            // Hide the "Press Ctrl-C to exit" message
            ta.append(e.data);
        }

    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);
}

$(function(){
    eventsource();
});

$(window).unload(function(){
  source.close();
});
