var table;

$(document).ready(function() {

    $('#btnAdd').on('click', addCustomDNS);

    table = $("#customDNSTable").DataTable( {
        "ajax": "scripts/pi-hole/php/customdns.php?action=get",
        "columnDefs": [ {
            "targets": 2,
            "render": function ( data, type, row ) {
                return "<button id=\"" + row[0] + "\" class=\"btn btn-danger btn-xs deleteCustomDNS\" type=\"button\">" +
                           "<span class=\"glyphicon glyphicon-trash\"></span>" +
                       "</button>";
            }
        } ],
        "drawCallback": function( settings ) {
            $('.deleteCustomDNS').on('click', deleteCustomDNS);
        }
    });
});

function addCustomDNS()
{
    var ip = $('#ip').val();
    var domain = $('#domain').val();

    $.ajax({
        url: "scripts/pi-hole/php/customdns.php",
        method: "post",
        dataType: 'json',
        data: {"action":"add", "ip" : ip, "domain": domain},
        success: function(response) {
            if (response.success)
                table.ajax.reload();
            else
                alert(response.message);
        },
        error: function(jqXHR, exception) {
            alert("Error while adding this custom DNS entry")
        }
    });
}

function deleteCustomDNS()
{
    $.ajax({
        url: "scripts/pi-hole/php/customdns.php",
        method: "post",
        dataType: 'json',
        data: {"action":"delete", "domain": $(this).prop('id')},
        success: function(response) {
            if (response.success)
                table.ajax.reload();
            else
                alert(response.message);
        },
        error: function(jqXHR, exception) {
            alert("Error while deleting this custom DNS entry");
            console.log(exception);
        }
    });
}
