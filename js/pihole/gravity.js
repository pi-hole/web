function eventsourcetest() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var ta = document.getElementById("output");
    var hash = document.getElementById("hash").innerHTML;
    var source = new EventSource("php/gravity.sh.php?"+hash);

    alInfo.show();
    alSuccess.hide();

    source.addEventListener("message", function(e) {
        if(e.data.indexOf("Pi-hole blocking is") !== -1)
        {
            alSuccess.show();
        }

        ta.innerHTML += e.data;

    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        alInfo.delay(1000).fadeOut(2000, function() { alInfo.hide(); });
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
