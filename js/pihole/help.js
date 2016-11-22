$( "#flush" ).click(function() {
    if (confirm("Are you sure you want to flush the pi-hole log file?")) {
        document.location.href="help.php?flush=true";
    } else {
        // Do nothing!
    }
});
