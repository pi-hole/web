/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

// This code has been taken from
// https://datatables.net/plug-ins/sorting/ip-address
jQuery.extend(jQuery.fn.dataTableExt.oSort, {
  "ip-address-pre": function(a) {
    if (!a) {
      return 0;
    }

    var i, item;
    // Use the first IP in case there is a list of IPs
    // for a given device
    if (Array.isArray(a)) {
      a = a[0];
    }

    var m = a.split("."),
      n = a.split(":"),
      x = "",
      xa = "";
    if (m.length === 4) {
      // IPV4
      for (i = 0; i < m.length; i++) {
        item = m[i];

        if (item.length === 1) {
          x += "00" + item;
        } else if (item.length === 2) {
          x += "0" + item;
        } else {
          x += item;
        }
      }
    } else if (n.length > 0) {
      // IPV6
      var count = 0;
      for (i = 0; i < n.length; i++) {
        item = n[i];

        if (i > 0) {
          xa += ":";
        }

        if (item.length === 0) {
          count += 0;
        } else if (item.length === 1) {
          xa += "000" + item;
          count += 4;
        } else if (item.length === 2) {
          xa += "00" + item;
          count += 4;
        } else if (item.length === 3) {
          xa += "0" + item;
          count += 4;
        } else {
          xa += item;
          count += 4;
        }
      }

      // Padding the ::
      n = xa.split(":");
      var paddDone = 0;

      for (i = 0; i < n.length; i++) {
        item = n[i];
        if (item.length === 0 && paddDone === 0) {
          for (var padding = 0; padding < 32 - count; padding++) {
            x += "0";
            paddDone = 1;
          }
        } else {
          x += item;
        }
      }
    }

    return x;
  },

  "ip-address-asc": function(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  },

  "ip-address-desc": function(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  }
});
