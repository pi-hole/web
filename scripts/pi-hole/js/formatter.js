/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2024 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global moment:false */

Number.prototype.toPercent = function (fractionDigits = 0) {
  const userLocale = navigator.language || 'en-US';
  return new Intl.NumberFormat(userLocale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(this / 100);
};
