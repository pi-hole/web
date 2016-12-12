$(function () {
  $("[data-mask]").inputmask();
});

$(".confirm-reboot").confirm({
	text: "Are you sure you want to send a reboot command to your Pi-Hole?",
	title: "Confirmation required",
	confirm(button) {
		$.post( "php/savesettings.php", { "field": "reboot" } );
	},
	cancel(button) {
		// nothing to do
	},
	confirmButton: "Yes, reboot",
	cancelButton: "No, go back",
	post: true,
	confirmButtonClass: "btn-danger",
	cancelButtonClass: "btn-success",
	dialogClass: "modal-dialog modal-mg" // Bootstrap classes for mid-size modal
});

$(".confirm-restartdns").confirm({
	text: "Are you sure you want to send a restart command to your DNS server?",
	title: "Confirmation required",
	confirm(button) {
		$.post( "php/savesettings.php", { "field": "restartdns" } );
	},
	cancel(button) {
		// nothing to do
	},
	confirmButton: "Yes, restart DNS",
	cancelButton: "No, go back",
	post: true,
	confirmButtonClass: "btn-danger",
	cancelButtonClass: "btn-success",
	dialogClass: "modal-dialog modal-mg"
});

$(".confirm-flushlogs").confirm({
	text: "By default, the log is flushed at the end of the day via cron, but a very large log file can slow down the Web interface, so flushing it can be useful. Note that your statistics will be reset and you lose the statistics up to this point. Are you sure you want to flush your logs?",
	title: "Confirmation required",
	confirm(button) {
		$.post( "php/savesettings.php", { "field": "flushlogs" } );
	},
	cancel(button) {
		// nothing to do
	},
	confirmButton: "Yes, flush logs",
	cancelButton: "No, go back",
	post: true,
	confirmButtonClass: "btn-danger",
	cancelButtonClass: "btn-success",
	dialogClass: "modal-dialog modal-mg"
});

$("#DHCPchk").click(function() {
	$("input.DHCPgroup").prop("disabled", !this.checked);
});

$(document).ready(function() {
	if(!!document.getElementById("DHCPLeasesTable"))
	{
		$('#DHCPLeasesTable').DataTable({
			dom: "<'row'<'col-sm-12'i>>" +
				"<'row'<'col-sm-12'tr>>" +
				"<'row'<'col-sm-5'f><'col-sm-7'p>>",
			"pageLength": 5
		});
	}
} );
