$(document).ready(function() {
    tableApi = $('#all-queries').DataTable( {
        "rowCallback": function( row, data, index ){
            if (data[4] == "Pi-holed") {
                $(row).css('color','red')
            }
            else{
                $(row).css('color','green')
            }

        },
        "ajax": "api.php?getAllQueries",
        "autoWidth" : false,
        "order" : [[0, "desc"]],
        "columns": [
            { "width" : "20%", "type": "date" },
            { "width" : "10%" },
            { "width" : "40%" },
            { "width" : "12.5%" },
            { "width" : "12.5%" },
            { "width" : "5%" },
        ],
        "columnDefs": [ {
            "targets": -1,
            "data": null,
            "defaultContent": "<button>Do it!</button>"
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
    $.ajax({
        url: "php/add.php",
        method: "post",
        data: {"domain":domain, "list":list, "token":token}
//        success: function(response) { alert(response); }
    });
}
