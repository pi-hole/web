/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

// eslint-disable-next-line no-unused-vars
var groups = [];

// eslint-disable-next-line no-unused-vars
function getGroups() {
  $.ajax({
    url: "/api/groups",
    type: "GET",
    dataType: "json",
    success: function (data) {
      groups = data.groups;
    },
  });
}
