function eventsource() {
    var ta = $("#output");
    var alInfo = $("#alInfo");
    var source = new EventSource("php/webupdater.php");

    // Reset and show field
    ta.empty();

    source.addEventListener("message", function(e) {
        ta.append(e.data);
    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        alInfo.show();
        source.close();
    }, false);
}

$(function(){
   eventsource();
});
