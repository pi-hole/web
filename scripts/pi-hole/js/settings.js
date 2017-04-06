/* Pi-hole: A black hole for Internet advertisements
*  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license. */
$(function () {
	$("[data-mask]").inputmask();

	$("[data-static]").on("click", function(){
		var row = $(this).closest("tr");
		var mac = row.find("#MAC").text();
		var ip = row.find("#IP").text();
		var host = row.find("#HOST").text();
		$("input[name=\"AddHostname\"]").val(host);
		$("input[name=\"AddIP\"]").val(ip);
		$("input[name=\"AddMAC\"]").val(mac);
	});
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

$(".api-token").confirm({
	text: "Make sure that nobody else can scan this code around you. They will have full access to the API without having to know the password. Note that the generation of the QR code will take some time.",
	title: "Confirmation required",
	confirm(button) {
		window.open("scripts/pi-hole/php/api_token.php");
	},
	cancel(button) {
		// nothing to do
	},
	confirmButton: "Yes, show API token",
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

var leasetable, staticleasetable;
$(document).ready(function() {
	if(document.getElementById("DHCPLeasesTable"))
	{
		leasetable = $("#DHCPLeasesTable").DataTable({
			dom: "<'row'<'col-sm-12'tr>><'row'<'col-sm-6'i><'col-sm-6'f>>",
			"columnDefs": [ { "bSortable": false, "orderable": false, targets: -1} ],
			"paging": false,
			"scrollCollapse": true,
			"scrollY": "200px",
			"scrollX" : true
		});
	$("#leaseexpand").on( "click", function () {
		setTimeout(function(){leasetable.draw();},100);
		} );
	}
	if(document.getElementById("DHCPStaticLeasesTable"))
	{
		staticleasetable = $("#DHCPStaticLeasesTable").DataTable({
			dom: "<'row'<'col-sm-12'tr>><'row'<'col-sm-12'i>>",
			"columnDefs": [ { "bSortable": false, "orderable": false, targets: -1} ],
			"paging": false,
			"scrollCollapse": true,
			"scrollY": "200px",
			"scrollX" : true
		});
	$("#leaseexpand").on( "click", function () {
		setTimeout(function(){staticleasetable.draw();},100);
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

// Handle list deletion
$("button[id^='adlist-btn-']").on("click", function (e) {
	e.preventDefault();

	var status = $(this).siblings("input[name^='adlist-del-']").is(":checked");
	var textType = status ? "none" : "line-through";

    $(this).siblings("input[name^='adlist-del-']").prop("checked", !status);
    $(this).siblings("input[name^='adlist-enable-']").prop("disabled", !status);
	$(this).siblings("a").css("text-decoration", textType);
});
