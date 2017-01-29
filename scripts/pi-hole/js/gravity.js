function eventsource() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var ta = $("#output");

    // IE does not support EventSource - exit early
    if (typeof EventSource !== "function") {
        ta.show();
        ta.html("Updating lists of ad-serving domains is not supported with this browser!");
        return;
    }
    var source = new EventSource("scripts/pi-hole/php/gravity.sh.php");

    ta.html("");
    ta.show();
    alInfo.show();
    alSuccess.hide();

    source.addEventListener("message", function(e) {
        if(e.data.indexOf("Pi-hole blocking is") !== -1)
        {
            alSuccess.show();
        }

        ta.append(e.data);

    }, false);

    // Will be called when script has finished
    source.addEventListener("error", function(e) {
        alInfo.delay(1000).fadeOut(2000, function() { alInfo.hide(); });
        source.close();
        $("#gravityBtn").removeAttr("disabled");
    }, false);
}

$("#gravityBtn").on("click", function(){
    $("#gravityBtn").attr("disabled", true);
    eventsource();
});

// Handle hiding of alerts
$(function(){
    $("[data-hide]").on("click", function(){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });
});
