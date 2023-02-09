/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* exported fillDNSupstreams */

// Remove an element from an array (inline)
function removeFromArray(arr, what) {
  var found = arr.indexOf(what);

  while (found !== -1) {
    arr.splice(found, 1);
    found = arr.indexOf(what);
  }
}

function fillDNSupstreams(value, servers) {
  var i = 0;
  var customServers = value.value.length;
  servers.forEach(element => {
    var row = "<tr>";
    // Build checkboxes for IPv4 and IPv6
    const addresses = [element.v4, element.v6];
    for (let v = 0; v < 2; v++) {
      const address = addresses[v];
      for (let index = 0; index < 2; index++) {
        if (address.length > index) {
          row +=
            '<td title="' +
            address[index] +
            '"><div><input type="checkbox" id="DNSupstreams-' +
            i +
            '"';
          if (address[index] in value.value || address[index] + "#53" in value.value) {
            row += " checked";
            customServers--;
          }

          row += '><label for="DNSupstreams-' + i++ + '"></label></div></td>';
        } else {
          row += "<td></td>";
        }
      }
    }

    // Add server name
    row += "<td>" + element.name + "</td>";

    // Close table row
    row += "</tr>";

    // Add row to table
    $("#DNSupstreamsTable").append(row);
  });

  // Add event listener to checkboxes
  $("input[id^='DNSupstreams-']").on("change", function () {
    var upstreams = $("#DNSupstreamsTextfield").val().split("\n");
    var customServers = 0;
    $("#DNSupstreamsTable input").each(function () {
      var title = $(this).closest("td").attr("title");
      if (this.checked && !upstreams.includes(title)) {
        // Add server to array
        upstreams.push(title);
      } else if (!this.checked && upstreams.includes(title)) {
        // Remove server from array
        removeFromArray(upstreams, title);
      }

      if (upstreams.includes(title)) customServers--;
    });
    // The variable will contain a negative value, we need to add the length to
    // get the correct number of custom servers
    customServers += upstreams.length;
    updateDNSserversTextfield(upstreams, customServers);
  });

  // Initialize textfield
  updateDNSserversTextfield(value.value, customServers);
}

function updateDNSserversTextfield(upstreams, customServers) {
  $("#DNSupstreamsTextfield").val(upstreams.join("\n"));
  $("#custom-servers-title").text(
    "(" + customServers + " custom server" + (customServers === 1 ? "" : "s") + " enabled)"
  );
}
