function eventsource() {
    var ta = $("#output");
    var domain = $("#domain");
    if(domain.val().length === 0)
    {
        return;
    }
    var source = new EventSource("php/queryads.php?domain="+domain.val());

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

// $(function(){
//    eventsourcetest();
// });

// Handle enter button for adding domains
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
