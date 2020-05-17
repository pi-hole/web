/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

// Timezone per browser
var timeZone = localStorage.getItem("timeZone") || "";

!function()
{
  if (typeof moment == "undefined" || !moment.tz)
    return;

  let _unix = moment.unix;
  //a hack that hijacks moment.unix() function
  moment.unix = function(f)
  {
    let t = _unix.apply(_unix, arguments),
        r = t.tz(timeZone);

    return r || t;
  }
}();
