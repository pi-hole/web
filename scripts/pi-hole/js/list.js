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
                $("h3").show();
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
                data.forEach(function (entry, index)
                {
                    addListEntry(entry, index, list, "#list", "exact");
                });

                // Add regex domains if present in returned list data
                data2.forEach(function (entry, index)
                {
                    addListEntry(entry, index, listw, "#list-regex", listType+"_regex");
                });
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

function sub(index, entry, arg) {
    var domain = $("#list #"+index);
    var locallistType = listType;
    if(arg === "black_regex" || arg === "white_regex")
    {
        locallistType = arg;
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

function add(arg) {
    var locallistType = listType;
    var domain = $("#domain");
    if(domain.val().length === 0){
        return;
    }
    if(arg === "wild")
    {
        locallistType = listType+"_wild";
    }

    var alInfo = $("#alInfo");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");
    var alWarning = $("#alWarning");
    var err = $("#err");
    var warn = $("#warn");
    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    alWarning.hide();
    $.ajax({
        url: "scripts/pi-hole/php/add.php",
        method: "post",
        data: {"domain":domain.val().trim(), "list":locallistType, "token":token},
        success: function(response) {
          if (response.indexOf(" already exists in ") !== -1) {
            alWarning.show();
            warn.html(response);
            alWarning.delay(8000).fadeOut(2000, function() {
                alWarning.hide();
            });
            alInfo.delay(8000).fadeOut(2000, function() {
                alInfo.hide();
            });
          } else if (response.indexOf("DONE") === -1) {
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
