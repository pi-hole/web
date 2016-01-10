"use strict";

(function($){

    var PIHOLE = {
        init: function init() {
            PIHOLE.bindNameserverUIEvents();
        },

        bindNameserverUIEvents: function bindNameserverUIEvents() {
            $(document).on('click', '#addNameServerSubmit', PIHOLE.submitAddNameserver);
            $(document).on('click', '#customNameservers button[data-action="remove"]', PIHOLE.removeNameserver);
        },

        submitAddNameserver: function submitAddNameserver() {
            $.ajax({
                url: '/admin/ajax.php',
                type: 'POST',
                cache: false,
                data: $('#addNameServerForm').serialize(),
                crossDomain: true,
                success: function(data) {
                    $('#addCustomNameserverModal').modal('hide')
                    window.location.href = "/admin/customNameserver.php";
                }
            });

        },

        removeNameserver: function removeNameserver(e) {
            var nameserverID = $(e.target).parents('tr').attr('data-nameserverID');

            $.ajax({
                url: '/admin/ajax.php',
                type: 'POST',
                cache: false,
                data: { removeCustomNameserver : true, customNameserverID : nameserverID },
                crossDomain: true,
                success: function(data) {
                    window.location.href = "/admin/customNameserver.php";
                }
            });

        }
    }

    $(document).on('ready', PIHOLE.init);

}(jQuery));