// IE likes to cache too much :P
$.ajaxSetup({cache: false});

// Get PHP info
var token = $("#token").html();
var listType = $("#list-type").html();
var fullName = listType === "white" ? "Whitelist" : "Blacklist";

function sub(index, entry) {
    var domain = $("#"+index);
    domain.hide("highlight");
    $.ajax({
        url: "scripts/pi-hole/php/sub.php",
        method: "post",
        data: {"domain":entry, "list":listType, "token":token},
        success: function(response) {
            if(response.length !== 0){
                return;
            }
            domain.remove();
        },
        error: function(jqXHR, exception) {
            alert("Failed to remove the domain!");
        }
    });
}

function refresh(fade) {
    var list = $("#list");
    if(fade) {
        list.fadeOut(100);
    }
    $.ajax({
        url: "scripts/pi-hole/php/get.php",
        method: "get",
        data: {"list":listType},
        success: function(response) {
            list.html("");
            var data = JSON.parse(response);

            if(data.length === 0) {
                list.html("<div class=\"alert alert-info\" role=\"alert\">Your " + fullName + " is empty!</div>");
            }
            else {
                data.forEach(function (entry, index) {
                    list.append(
                        "<li id=\"" + index + "\" class=\"list-group-item clearfix\">" + entry +
                        "<button class=\"btn btn-danger btn-xs pull-right\" type=\"button\">" +
                        "<span class=\"glyphicon glyphicon-trash\"></span></button></li>"
                    );

                    // Handle button
                    $("#list #"+index+"").on("click", "button", function() {
                        sub(index, entry);
                    });
                });
            }
            list.fadeIn("fast");
        },
        error: function(jqXHR, exception) {
            $("#alFailure").show();
        }
    });
}

window.onload = refresh(false);

function add(domain) {
    if(domain.length === 0){
        return;
    }

    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain, "list":listType, "token":token},
        success: function(response) {
          if (response.indexOf("not a valid argument") >= 0 ||
              response.indexOf("is not a valid domain") >= 0) {
            alFailure.show();
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
            });
          } else {
            alSuccess.show();
            alSuccess.delay(1000).fadeOut(2000, function() {
                alSuccess.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
            });
            refresh(true);
          }
        },
        error: function(jqXHR, exception) {
            alFailure.show();
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
            });
        }
    });
    $("#domain").val("");
}

function handleAdd() {
    $("#domain").val().split(/\s+/).forEach(function (domain) {
        add(domain);
    });
}

// Handle enter button for adding domains
$(document).keypress(function(e) {
    if(e.which === 13 && $("#domain").is(":focus")) {
        // Enter was pressed, and the input has focus
        handleAdd();
    }
});

// Handle buttons
$("#btnAdd").on("click", function() {
    handleAdd();
});
$("#btnRefresh").on("click", function() {
    refresh(true);
});

// Handle hiding of alerts
$(function(){
    $("[data-hide]").on("click", function(){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });
});
