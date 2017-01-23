function getContent() {
    $.ajax({
        url: "scripts/pi-hole/php/webupdater.php?getlog",
        success(result) { $("#output").text(result); }
    });
}

function startupdate() {
    $.get("scripts/pi-hole/php/webupdater.php?startupdate");

    // First wait 0.5 sec so that the update can be started
    // and we can be sure that the log file has been flushed
    // then update the display every 100ms
    setTimeout(function(){ setInterval(function(){ getContent(); }, 100); }, 500);

    return false;
}

$("#btnStart").on("click", function() {
    $("#output").text("");
    startupdate();
});
