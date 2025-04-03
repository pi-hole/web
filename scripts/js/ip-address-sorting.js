/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2019 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license.  */

"use strict";

// This code has been taken from
// https://datatables.net/plug-ins/sorting/ip-address
// and was modified by the Pi-hole team to support
// CIDR notation and be more robust against invalid
// input data (like empty IP addresses)
$.extend($.fn.dataTableExt.oSort, {
  "ip-address-pre"(a) {
    // Skip empty fields (IP address might have expired or
    // reassigned to a different device)
    if (!a || a.length === 0) {
      return Infinity;
    }

    let i;
    let item;
    // Use the first IP in case there is a list of IPs
    // for a given device
    if (Array.isArray(a)) {
      a = a[0];
    }

    let m = a.split(".");
    let n = a.split(":");
    let x = "";
    let xa = "";
    let cidr = [];
    if (m.length === 4) {
      // IPV4 (possibly with CIDR)
      cidr = m[3].split("/");
      if (cidr.length === 2) {
        m.pop();
        // eslint-disable-next-line unicorn/prefer-spread
        m = m.concat(cidr);
      }

      for (i = 0; i < m.length; i++) {
        item = m[i];

        if (item.length === 1) {
          x += `00${item}`;
        } else if (item.length === 2) {
          x += `0${item}`;
        } else {
          x += item;
        }
      }
    } else if (n.length > 0) {
      // IPV6 (possibly with CIDR)
      let count = 0;
      for (i = 0; i < n.length; i++) {
        item = n[i];

        if (i > 0) {
          xa += ":";
        }

        switch (item.length) {
          case 0: {
            count += 0;

            break;
          }

          case 1: {
            xa += `000${item}`;
            count += 4;

            break;
          }

          case 2: {
            xa += `00${item}`;
            count += 4;

            break;
          }

          case 3: {
            xa += `0${item}`;
            count += 4;

            break;
          }

          default: {
            xa += item;
            count += 4;
          }
        }
      }

      // Padding the ::
      n = xa.split(":");
      let paddDone = 0;

      for (i = 0; i < n.length; i++) {
        item = n[i];
        if (item.length === 0 && paddDone === 0) {
          for (let padding = 0; padding < 32 - count; padding++) {
            x += "0";
            paddDone = 1;
          }
        } else {
          x += item;
        }
      }

      cidr = x.split("/");
      x = cidr[0];
      if (cidr.length === 2) {
        item = cidr[1];
        if (item.length === 1) {
          x += `00${item}`;
        } else if (item.length === 2) {
          x += `0${item}`;
        } else {
          x += item;
        }
      }
    }

    return x;
  },

  "ip-address-asc"(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  },

  "ip-address-desc"(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  },
});
