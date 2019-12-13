var table;
var groups = [];
const token = $("#token").html();

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

function get_groups()
{
    $.get("scripts/pi-hole/php/groups.php", { 'action': 'get_groups' },
    function(data) {
        groups = data.data;
    }, "json");
}

$.fn.redraw = function(){
    return $(this).each(function(){
        var redraw = this.offsetHeight;
    });
};

function datetime(date)
{
    return moment.unix(Math.floor(date)).format("Y-MM-DD HH:mm:ss z");
}

$(document).ready(function() {

    $('#btnAdd').on('click', addDomain);
    $( function() { $( document ).tooltip(); } );

    get_groups();

    $('#select').on('change', function() {
        $("#ip-custom").val("");
        $("#ip-custom").prop( "disabled" , $( "#select option:selected" ).val() !== "custom");
      });

    table = $("#domainsTable").DataTable( {
        "ajax": {
            "url": "scripts/pi-hole/php/groups.php",
            "data": {"action": "get_domains", "token": token},
            "type": "POST"
        },
        order: [[ 1, 'asc' ]],
        columns: [
            { data: "domain" },
            { data: "type", searchable: false },
            { data: "enabled", searchable: false },
            { data: "comment" },
            { data: "groups", searchable: false },
            { data: null, width: "80px", orderable: false }
        ],
        "drawCallback": function( settings ) {
            $('.editDomain').on('click', editDomain);
            $('.deleteDomain').on('click', deleteDomain);
        },
        "rowCallback": function( row, data ) {
            const tooltip = 'Added: '+datetime(data["date_added"])+'\nLast modified: '+datetime(data["date_modified"]);
            $('td:eq(0)', row).html( '<code title="'+tooltip+'">'+data["domain"]+'</code>' );

            $('td:eq(1)', row).html( '<select id="type" class="form-control">'+
                                     '<option value="0"'+(data["type"]===0?' selected':'')+'>Exact whitelist</option>'+
                                     '<option value="1"'+(data["type"]===1?' selected':'')+'>Exact blacklist</option>'+
                                     '<option value="2"'+(data["type"]===2?' selected':'')+'>Regex whitelist</option>'+
                                     '<option value="3"'+(data["type"]===3?' selected':'')+'>Regex blacklist</option>'+
                                     '</select>' );

            const disabled = data["enabled"] === 0;
            $('td:eq(2)', row).html( '<input type="checkbox" id="status"'+(disabled?'':' checked')+'>');
            $('#status', row).bootstrapToggle({ on: 'Enabled', off: 'Disabled', size: 'small', onstyle: "success", width: "80px" });
            
            $('td:eq(3)', row).html( '<input id="comment" class="form-control"><input id="id" type="hidden" value="'+data["id"]+'">' );
            $('#comment', row).val(data["comment"]);

            $('td:eq(4)', row).empty();
            $('td:eq(4)', row).append( '<select id="multiselect" multiple="multiple"></select>' );
            var sel = $('#multiselect', row);
            // Add all known groups
            for (var i = 0; i < groups.length; i++) {
                var extra = 'ID ' + groups[i].id;
                if(!groups[i].enabled)
                {
                    extra += ', disabled';
                }
                sel.append($('<option />').val(groups[i].id).text(groups[i].name + ' (' + extra + ')'));
                sel.redraw();
            }
            // Select assigned groups
            sel.val(data.groups);
            // Initialize multiselect
            sel.multiselect({ includeSelectAllOption: true });

            let button = "<button class=\"btn btn-success btn-xs editDomain\" type=\"button\" data-id='"+data["id"]+"'>" +
                         "<span class=\"glyphicon glyphicon-pencil\"></span>" +
                         "</button>" +
                         " &nbsp;" +
                         "<button class=\"btn btn-danger btn-xs deleteDomain\" type=\"button\" data-id='"+data["id"]+"'>" +
                         "<span class=\"glyphicon glyphicon-trash\"></span>" +
                         "</button>";
            $('td:eq(5)', row).html( button );
        },
        "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        "stateSave": true,
        stateSaveCallback: function(settings, data) {
            // Store current state in client's local storage area
            localStorage.setItem("groups-domains-table", JSON.stringify(data));
        },
        stateLoadCallback: function(settings) {
            // Receive previous state from client's local storage area
            var data = localStorage.getItem("groups-domains-table");
            // Return if not available
            if(data === null){ return null; }
            data = JSON.parse(data);
            // Always start on the first page to show most recent queries
            data["start"] = 0;
            // Always start with empty search field
            data["search"]["search"] = "";
            // Apply loaded state to table
            return data;
        }
    });
});

function addDomain()
{
    var domain = $("#domain").val();
    var type = $("#type").val();
    var comment = $("#comment").val();

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "add_domain", "domain": domain, "type": type, "comment": comment, "token":token},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                $("#domain").empty();
                $("#comment").empty();
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while adding new domain");
            console.log(exception);
        }
    });
}

function editDomain()
{
    var tr = $(this).closest("tr");
    var id = tr.find("#id").val();
    var type = tr.find("#type").val();
    var status = tr.find("#status").is(":checked") ? 1 : 0;
    var comment = tr.find("#comment").val();
    var groups = tr.find("#multiselect").val();

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "edit_domain", "id": id, "type": type, "comment": comment, "status": status, "groups": groups, "token":token},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while editing domain with ID "+id);
            console.log(exception);
        }
    });
}

function deleteDomain()
{
    var id = $(this).attr("data-id");

    showAlert('info');
    $.ajax({
        url: "scripts/pi-hole/php/groups.php",
        method: "post",
        dataType: 'json',
        data: {"action": "delete_domain", "id": id, "token":token},
        success: function(response) {
            if (response.success) {
                showAlert('success');
                table.ajax.reload();
            }
            else
                showAlert('error', response.message);
        },
        error: function(jqXHR, exception) {
            showAlert('error', "Error while deleting domain with ID "+id);
            console.log(exception);
        }
    });
}
