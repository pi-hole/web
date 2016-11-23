function startupdate() {
    $.get("php/webupdater.php?startupdate");

    // First wait 0.5 sec so that the update can be started
    // and we can be sure that the log file has been flushed
    // then update the display every 100ms
    window.setTimeout(function(){ getContent(); }, 500);

    return false;
}

$("#btnStart").on("click", function() {
    $("#output").text("");
    startupdate();
});

function getContent() {
    $.ajax({
        url: "php/webupdater.php?getlog",
        success: function(result) { $("#output").text(result); },
        complete : function() { setTimeout( getContent(), 100); }
    });
}
