/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2022 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

$(".confirm-restartftl").confirm({
  text: "Are you sure you want to send a restart command to your DNS server?",
  title: "Confirmation required",
  confirm: function () {
    $("#restartftlform").submit();
  },
  cancel: function () {
    // nothing to do
  },
  confirmButton: "Yes, restart DNS",
  cancelButton: "No, go back",
  post: true,
  confirmButtonClass: "btn-danger",
  cancelButtonClass: "btn-success",
  dialogClass: "modal-dialog",
});
