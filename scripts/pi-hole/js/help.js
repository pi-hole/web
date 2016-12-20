$( "#flush" ).click(function() {
    if (confirm("Are you sure you want to flush the Pi-hole log file?")) {
        document.location.href="../../help.php";
    } else {
        // Do nothing!
    }
});
