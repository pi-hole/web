function eventsource() {
    var ta = $("#output");
    var source = new EventSource("php/webupdater.php");

    // Reset and show field
    ta.empty();

    source.addEventListener("message", function(e) {
        ta.append(e.data);
    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);
}

$(function(){
   eventsource();
});
