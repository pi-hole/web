/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
// IE likes to cache too much :P
$.ajaxSetup({cache: false});

// Get PHP info
var token = $("#token").html();
var listType = $("#list-type").html();
var fullName = listType === "white" ? "Whitelist" : "Blacklist";

function sub(index, entry, arg) {
    var domain = $("#list #"+index);
    var locallistType = listType;
    if(arg === "regex")
    {
        locallistType = "regex";
        domain = $("#list-regex #"+index);
    }
    domain.hide("highlight");
    $.ajax({
        url: "scripts/pi-hole/php/sub.php",
        method: "post",
        data: {"domain":entry, "list":locallistType, "token":token},
        success: function(response) {
            if(response.length !== 0){
                return;
            }
            domain.remove();
        },
        error: function(jqXHR, exception) {
            alert("Failed to remove the domain!");
            domain.show({queue:true});
        }
    });
}

function refresh(fade) {
    var listw;
    var list = $("#list");
    if(listType === "black")
    {
        listw = $("#list-regex");
    }
    if(fade) {
        list.fadeOut(100);
        if(listw)
        {
            listw.fadeOut(100);
        }
    }
    $.ajax({
        url: "scripts/pi-hole/php/get.php",
        method: "get",
        data: {"list":listType},
        success: function(response) {
            list.html("");
            if(listw)
            {
                listw.html("");
            }
            var data = JSON.parse(response);

            if(data.length === 0) {
                $("h3").hide();
                if(listw)
                {
                    listw.html("<div class=\"alert alert-info\" role=\"alert\">Your " + fullName + " is empty!</div>");
                }
                else
                {
                    list.html("<div class=\"alert alert-info\" role=\"alert\">Your " + fullName + " is empty!</div>");
                }
            }
            else
            {
                $("h3").show();
                data[0] = data[0].sort();
                data[0].forEach(function (entry, index) {
                    // Whitelist entry or Blacklist (exact entry) are in the zero-th
                    // array returned by get.php
                    list.append(
                    "<li id=\"" + index + "\" class=\"list-group-item clearfix\">" + entry +
                    "<button class=\"btn btn-danger btn-xs pull-right\" type=\"button\">" +
                    "<span class=\"glyphicon glyphicon-trash\"></span></button></li>");
                    // Handle button
                    $("#list #"+index+"").on("click", "button", function() {
                        sub(index, entry, "exact");
                    });
                });

                // Add regex domains if present in returned list data
                if(data.length === 2)
                {
                    data[1] = data[1].sort();
                    data[1].forEach(function (entry, index) {
                        // Whitelist entry or Blacklist (exact entry) are in the zero-th
                        // array returned by get.php
                        listw.append(
                        "<li id=\"" + index + "\" class=\"list-group-item clearfix\">" + entry +
                        "<button class=\"btn btn-danger btn-xs pull-right\" type=\"button\">" +
                        "<span class=\"glyphicon glyphicon-trash\"></span></button></li>");
                        // Handle button
                        $("#list-regex #"+index+"").on("click", "button", function() {
                            sub(index, entry, "regex");
                        });
                    });
                }
            }
            list.fadeIn(100);
            if(listw)
            {
                listw.fadeIn(100);
            }
        },
        error: function(jqXHR, exception) {
            $("#alFailure").show();
        }
    });
}

window.onload = refresh(false);

function add(arg) {
    var locallistType = listType;
    var domain = $("#domain");
    var wild = false;
    if(domain.val().length === 0){
        return;
    }
    if(arg === "wild" || arg === "regex")
    {
        locallistType = arg;
        wild = true;
    }

    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var err = $("#err");
    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain.val().trim(), "list":locallistType, "token":token},
        success: function(response) {
          if (!wild && response.indexOf("] Pi-hole blocking is ") === -1 ||
               wild && response.length > 1) {
            alFailure.show();
            err.html(response);
            alFailure.delay(4000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(4000).fadeOut(2000, function() {
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
            domain.val("");
            refresh(true);
          }
        },
        error: function(jqXHR, exception) {
            alFailure.show();
            err.html("");
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
            });
        }
    });
}



// Handle enter button for adding domains
$(document).keypress(function(e) {
    if(e.which === 13 && $("#domain").is(":focus")) {
        // Enter was pressed, and the input has focus
        add("exact");
    }
});

// Handle buttons
$("#btnAdd").on("click", function() {
    add("exact");
});

$("#btnAddWildcard").on("click", function() {
    add("wild");
});

$("#btnAddRegex").on("click", function() {
    add("regex");
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

// Wrap form-group's buttons to next line when viewed on a small screen
$(window).on("resize",function() {
    if ($(window).width() < 991) {
        $(".form-group.input-group").removeClass("input-group").addClass("input-group-block");
        $(".form-group.input-group-block > input").css("margin-bottom", "5px");
        $(".form-group.input-group-block > .input-group-btn").removeClass("input-group-btn").addClass("btn-block text-center");
    }
    else {
        $(".form-group.input-group-block").removeClass("input-group-block").addClass( "input-group" );
        $(".form-group.input-group > input").css("margin-bottom","");
        $(".form-group.input-group > .btn-block.text-center").removeClass("btn-block text-center").addClass("input-group-btn");
    }
});
$(document).ready(function() {
    $(window).trigger("resize");
});
