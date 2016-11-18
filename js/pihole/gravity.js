function eventsourcetest() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var ta = document.getElementById("output");
    var source = new EventSource("php/gravity.sh.php");

    alInfo.show();
    alSuccess.hide();

    source.addEventListener("message", function(e) {
        if(e.data.indexOf("Pi-hole blocking is Enabled") !== -1)
        {
            alSuccess.show();
            alInfo.delay(1000).fadeOut(2000, function() { alInfo.hide(); });
        }

        ta.innerHTML += e.data;

    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        source.close();
    }, false);
}

$(function(){
   eventsourcetest();
});

// Handle hiding of alerts
$(function(){
    $("[data-hide]").on("click", function(){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });
});
