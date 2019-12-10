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

function addListEntry(entry, index, list, button, type)
{
    var disabled = [];
    if(entry.enabled === "0")
       disabled.push("individual");
    // For entry.group_enabled we either get "0" (= disabled by a group),
    // "1" (= enabled by a group), or "" (= not managed by a group)
    if(entry.group_enabled === "0")
        disabled.push("group");

    var used = disabled.length === 0 ? "used" : "not-used";
    var comment = entry.comment.length > 0 ? "&nbsp;-&nbsp;" + entry.comment : "";
    var disabled_message = disabled.length > 0 ? "&nbsp;-&nbsp;disabled due to " + disabled.join(" + ") + " setting" : "";
    var date_added = new Date(parseInt(entry.date_added)*1000);
    var date_modified = new Date(parseInt(entry.date_modified)*1000);
    var tooltip = "Added: " + date_added.toLocaleString() +
                  "\nModified: " + date_modified.toLocaleString();
    list.append(
        "<li id=\"" + index + "\" class=\"list-group-item " + used + " clearfix\">" +
        "<span title=\"" + tooltip + "\" data-toggle=\"tooltip\" data-placement=\"right\">" +
        entry.domain + comment + disabled_message + "</span>" +
        "<button class=\"btn btn-danger btn-xs pull-right\" type=\"button\">" +
        "<span class=\"glyphicon glyphicon-trash\"></span></button></li>"
    );
    // Handle button
    $(button+" #"+index).on("click", "button", function() {
        sub(index, entry.domain, type);
    });
}

function refresh(fade) {
    var list = $("#list");
    var listw = $("#list-regex");
    if(fade) {
        list.fadeOut(100);
        listw.fadeOut(100);
    }
    $.ajax({
        url: "scripts/pi-hole/php/get.php",
        method: "get",
        data: {"list":listType},
        success: function(response) {
            list.html("");
            listw.html("");

            if((listType === "black" &&
               response.blacklist.length === 0 &&
               response.regex_blacklist.length === 0) ||
               (listType === "white" &&
               response.whitelist.length === 0 &&
               response.regex_whitelist.length === 0))
            {
                $("h3").hide();
                list.html("<div class=\"alert alert-info\" role=\"alert\">Your " + fullName + " is empty!</div>");
            }
            else
            {
                var data, data2;
                if(listType === "white")
                {
                    data = response.whitelist.sort();
                    data2 = response.regex_whitelist.sort();
                }
                else if(listType === "black")
                {
                    data = response.blacklist.sort();
                    data2 = response.regex_blacklist.sort();
                }

                if(data.length > 0)
                {
                    $("#h3-exact").fadeIn(100);
                }
                if(data2.length > 0)
                {
                    $("#h3-regex").fadeIn(100);
                }

                data.forEach(function (entry, index)
                {
                    addListEntry(entry, index, list, "#list", "exact");
                });
                data2.forEach(function (entry, index)
                {
                    addListEntry(entry, index, listw, "#list-regex", listType+"_regex");
                });
            }
            list.fadeIn(100);
            listw.fadeIn(100);
        },
        error: function() {
            $("#alFailure").show();
        }
    });
}

window.addEventListener('load', refresh(false));

function sub(index, entry, arg) {
    var list = "#list";
    var heading = "#h3-exact";
    var locallistType = listType;
    if(arg === "black_regex" || arg === "white_regex")
    {
        list = "#list-regex";
        heading = "#h3-regex";
        locallistType = arg;
    }
    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var err = $("#err");
    var msg = $("#success-message");

    var domain = $(list+" #"+index);
    domain.hide("highlight");
    $.ajax({
        url: "scripts/pi-hole/php/sub.php",
        method: "post",
        data: {"domain":entry, "list":locallistType, "token":token},
        success: function(response) {
            if (response.indexOf("Success") === -1) {
                alFailure.show();
                err.html(response);
                alFailure.delay(8000).fadeOut(2000, function() {
                    alFailure.hide();
                });
                alInfo.delay(8000).fadeOut(2000, function() {
                    alInfo.hide();
                });
            } else {
                alSuccess.show();
                msg.html(response);
                alSuccess.delay(1000).fadeOut(2000, function() {
                    alSuccess.hide();
                });
                alInfo.delay(1000).fadeOut(2000, function() {
                    alInfo.hide();
                });
                domain.remove();
                if($(list+" li").length < 1)
                {
                    $(heading).fadeOut(100);
                }
            }
        },
        error: function() {
            alert("Failed to remove the domain!");
            domain.show({queue:true});
        }
    });
}

function add(type) {
    var domain = $("#domain");
    if(domain.val().length === 0){
        return;
    }

    var comment = $("#comment");

    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var alWarning = $("#alWarning");
    var err = $("#err");
    var msg = $("#success-message");
    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    alWarning.hide();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain.val().trim(),"comment":comment.val(), "list":type, "token":token},
        success: function(response) {
            if (response.indexOf("Success") === -1) {
                alFailure.show();
                err.html(response);
                alFailure.delay(8000).fadeOut(2000, function() {
                    alFailure.hide();
                });
                alInfo.delay(8000).fadeOut(2000, function() {
                    alInfo.hide();
                });
            } else {
                alSuccess.show();
                msg.html(response);
                alSuccess.delay(1000).fadeOut(2000, function() {
                    alSuccess.hide();
                });
                alInfo.delay(1000).fadeOut(2000, function() {
                    alInfo.hide();
                });
                domain.val("");
                comment.val("");
                refresh(true);
            }
        },
        error: function() {
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
    if(e.which === 13 && $("#domain,#comment").is(":focus")) {
        // Enter was pressed, and the input has focus
        add(listType);
    }
});

// Handle buttons
$("#btnAdd").on("click", function() {
    add(listType);
});

$("#btnAddWildcard").on("click", function() {
    add(listType+"_wild");
});

$("#btnAddRegex").on("click", function() {
    add(listType+"_regex");
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
