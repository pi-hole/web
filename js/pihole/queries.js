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
    $.ajax({
        url: "php/add.php",
        method: "post",
        data: {"domain":domain, "list":list, "token":token}
//        success: function(response) { alert(response); }
    });
}
