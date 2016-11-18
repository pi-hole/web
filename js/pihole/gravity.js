function eventsourcetest() {
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var ta = document.getElementById('output');
    var source = new EventSource('php/gravity.sh.php');

    alInfo.show();
    alSuccess.hide();
    alFailure.hide();

    source.addEventListener('message', function(e) {
        if(e.data == "START"){
           alInfo.show();
        }
        else if(e.data == "SUCCESS"){
           alSuccess.show();
           alInfo.delay(5000).fadeOut(2000, function() { alInfo.hide(); });
        }
        else if (e.data !== '')
        {
            ta.innerHTML += e.data;
        }
    }, false);

    source.addEventListener('error', function(e) {
        source.close();
        alFailure.show();
        alInfo.delay(5000).fadeOut(2000, function() { alInfo.hide(); });
    }, false);
}
$(function(){
   eventsourcetest();
});
