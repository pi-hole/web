var table;

function showAlert(type, message)
{
    var alertElement = null;
    var messageElement = null;

    switch (type)
    {
        case 'info':    alertElement = $('#alInfo');                                    break;
        case 'success': alertElement = $('#alSuccess');                                 break;
        case 'warning': alertElement = $('#alWarning'); messageElement = $('#warn');    break;
        case 'error':   alertElement = $('#alFailure'); messageElement = $('#err');     break;
        default: return;
    }

    if (messageElement != null)
        messageElement.html(message);

    alertElement.fadeIn(200);
    alertElement.delay(8000).fadeOut(2000);
}

$(document).ready(function() {

    $('#btnAdd').on('click', addGroup);

    table = $("#groupsTable").DataTable( {
        "ajax": "scripts/pi-hole/php/groups.php?action=get_groups",
        order: [[ 1, 'asc' ]],
        columns: [
            { data: "id", width: "10px" },
            { data: "enabled" },
            { data: "name" },
            { data: "description" },
            { data: null, width: "20px" }
        ],
        "drawCallback": function( settings ) {
            $('.deleteGroup').on('click', deleteGroup);
            $('.editGroup').on('click', editGroup);
        },
        "rowCallback": function( row, data ) {
            const disabled = data["enabled"] === 0;
            $('td:eq(1)', row).html( '<select id="status">'+
                                     '<option value="0"'+(disabled?' selected':'')+'>Disabled</option>'+
                                     '<option value="1"'+(disabled?'':' selected')+'>Enabled</option>'+
                                     '</select>' );

            $('td:eq(2)', row).html( '<input id="name">' );
            $('#name', row).val( data["name"] );

            $('td:eq(3)', row).html( '<input id="desc">' );
            const desc = data["description"] !== null ? data["description"] : '';
            $('#desc', row).val( desc );


            let button = "<button class=\"btn btn-success btn-xs editGroup\" type=\"button\" data-id='"+data["id"]+"'>" +
                         "<span class=\"glyphicon glyphicon-pencil\"></span>" +
                         "</button>";
            if(data["id"] !== 0)
            {
                button +=
                         " &nbsp;" +
                         "<button class=\"btn btn-danger btn-xs deleteGroup\" type=\"button\" data-id='"+data["id"]+"'>" +
                         "<span class=\"glyphicon glyphicon-trash\"></span>" +
                         "</button>";
            }
            $('td:eq(4)', row).html( button );
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "stateSave": true,
        stateSaveCallback: function(settings, data) {
            // Store current state in client's local storage area
            localStorage.setItem("groups-table", JSON.stringify(data));
        },
        stateLoadCallback: function(settings) {
            // Receive previous state from client's local storage area
            var data = localStorage.getItem("groups-table");
            // Return if not available
            if(data === null){ return null; }
            data = JSON.parse(data);
            // Always start on the first page to show most recent queries
            data["start"] = 0;
            // Always start with empty search field
            data["search"]["search"] = "";
            // Apply loaded state to table
            return data;
        },
    });
});

function addGroup()
{
    var name = $("#name").val();
    var desc = $("#desc").val();

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "add_group", "name": name, "desc": desc},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while adding new group");
            console.log(exception);
        }
    });
}

function editGroup()
{
    var tr = $(this).closest("tr");
    var id = tr.find("td:eq(0)").html();
    var name = tr.find("#name").val();
    var status = tr.find("#status").val();
    var desc = tr.find("#desc").val();

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "edit_group", "id": id, "name": name, "desc": desc, "status": status},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while editing group with ID "+id);
            console.log(exception);
        }
    });
}

function deleteGroup()
{
    var id = $(this).attr("data-id");

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "delete_group", "id": id},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while deleting group with ID "+id);
            console.log(exception);
        }
    });
}
