$(function () {
  $("[data-mask]").inputmask();
});

$(".confirm-reboot").confirm({
	text: "Are you sure you want to send a reboot command to your Pi-Hole?",
	title: "Confirmation required",
	confirm: function(button) {
		$.post( "php/savesettings.php", { "field": "reboot" } );
	},
	cancel: function(button) {
		// nothing to do
	},
	confirmButton: "Yes, reboot",
	cancelButton: "No, go back",
	post: true,
	confirmButtonClass: "btn-danger",
	cancelButtonClass: "btn-success",
	dialogClass: "modal-dialog modal-lg" // Bootstrap classes for large modal
});
