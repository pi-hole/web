$(function () {
  $("[data-mask]").inputmask();
});

$(function(){
	$("#custom1val").ipAddress({s:4});
	$("#custom2val").ipAddress({s:4});
	$("#custom3val").ipAddress({v:6});
	$("#custom4val").ipAddress({v:6});

	$("#DHCPfrom").ipAddress({s:4});
	$("#DHCPto").ipAddress({s:4});
	$("#DHCProuter").ipAddress({s:4});
});

$(".confirm-reboot").confirm({
	text: "Are you sure you want to send a reboot command to your Pi-Hole?",
	title: "Confirmation required",
	confirm(button) {
		$("#rebootform").submit();
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
		$("#restartdnsform").submit();
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
		$("#flushlogsform").submit();
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
	$("#dhcpnotice").prop("hidden", !this.checked).addClass("lookatme");
});

var leasetable;
$(document).ready(function() {
	if(document.getElementById("DHCPLeasesTable"))
	{
		leasetable = $("#DHCPLeasesTable").DataTable({
			dom: "<'row'<'col-sm-6'i><'col-sm-6'f>>" +
				"<'row'<'col-sm-12'tr>>",
			"paging": false,
			"scrollCollapse": true,
			"scrollY": "200px",
			"scrollX" : true
		});
	$("#leaseexpand").on( "click", function () {
		setTimeout(function(){leasetable.draw();},100);
		} );
	}
} );

// Handle hiding of alerts
$(function(){
    $("[data-hide]").on("click", function(){
        $(this).closest("." + $(this).attr("data-hide")).hide();
    });
});

// DHCP leases tooltips
$(document).ready(function(){
    $("[data-toggle=\"tooltip\"]").tooltip({"html": true, container : "body"});
});

