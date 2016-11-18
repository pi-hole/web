function eventsourcetest() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var ta = document.getElementById('output');
    var source = new EventSource('php/gravity.sh.php');

    alInfo.show();
    alSuccess.hide();

    source.addEventListener('message', function(e) {
        if(e.data == "START"){
           alInfo.show();
        }
        else if(e.data == "SUCCESS"){
           alSuccess.show();
           alInfo.delay(1000).fadeOut(2000, function() { alInfo.hide(); });
        }
        else if (e.data !== '')
        {
            ta.innerHTML += e.data;
        }
    }, false);

    // Will be called when script has finished
    source.addEventListener('error', function(e) {
        source.close();
    }, false);
}
$(function(){
   eventsourcetest();
});
