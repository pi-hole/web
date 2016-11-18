function eventsourcetest() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var ta = document.getElementById("output");
    var source = new EventSource("php/gravity.sh.php");

    alInfo.hide();
    alSuccess.hide();

    source.addEventListener("message", function(e) {
        if(e.data === "***START***"){
           alInfo.show();
        }
        else if(e.data === "***END***"){
           alInfo.delay(1000).fadeOut(2000, function() { alInfo.hide(); });
        }
        else if (e.data !== "")
        {
            ta.innerHTML += e.data;
        }

        if(e.data.indexOf("Pi-hole blocking is Enabled") !== -1)
        {
            alSuccess.show();
        }
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
