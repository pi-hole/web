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
