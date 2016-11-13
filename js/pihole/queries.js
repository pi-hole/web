$(document).ready(function() {
    tableApi = $('#all-queries').DataTable( {
        "rowCallback": function( row, data, index ){
            if (data[4] == "Pi-holed") {
                $(row).css('color','red');
                $('td:eq(5)', row).html( '<button style="color:green;"><i class="fa fa-pencil-square-o"></i> Whitelist</button>' );
            }
            else{
                $(row).css('color','green');
                $('td:eq(5)', row).html( '<button style="color:red;"><i class="fa fa-ban"></i> Blacklist</button>' );
            }

        },
        "ajax": "api.php?getAllQueries",
        "autoWidth" : false,
        "order" : [[0, "desc"]],
        "columns": [
            { "width" : "20%", "type": "date" },
            { "width" : "10%" },
            { "width" : "40%" },
            { "width" : "10%" },
            { "width" : "10%" },
            { "width" : "10%" },
        ],
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": ''
        } ]
    });
    $('#all-queries tbody').on( 'click', 'button', function () {
        var data = tableApi.row( $(this).parents('tr') ).data();
        if (data[4] == "Pi-holed")
        {
          add(data[2],"white");
        }
        else
        {
          add(data[2],"black");
        }
    } );
} );

function refreshData() {
    tableApi.ajax.url("api.php?getAllQueries").load();
}

function add(domain,list) {
    var token = $("#token").html();
    var alInfo = $("#alInfo");
    var alList = $("#alList");
    var alSuccess = $("#alSuccess");
    var alFailure = $("#alFailure");

    if(list == "white")
    {
        alList.html("Whitelist");
    }
    else
    {
        alList.html("Blacklist");
    }

    alInfo.show();
    alSuccess.hide();
    alFailure.hide();
    $.ajax({
        url: "php/add.php",
        method: "post",
        data: {"domain":domain, "list":list, "token":token},
        success: function(response) {
          if (response.indexOf("not a valid argument") >= 0 ||
              response.indexOf("is not a valid domain") >= 0) {
            alFailure.show();
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
                alList.html("");
            });
          } else {
            alSuccess.show();
            alSuccess.delay(1000).fadeOut(2000, function() {
                alSuccess.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
                alList.html("");
            });
          }
        },
        error: function(jqXHR, exception) {
            alFailure.show();
            alFailure.delay(1000).fadeOut(2000, function() {
                alFailure.hide();
            });
            alInfo.delay(1000).fadeOut(2000, function() {
                alInfo.hide();
                alList.html("");
            });
        }
    });
}
