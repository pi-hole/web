/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

"use strict";

// Force AdminLTE to use light/dark theme based on the current selected Pi-hole theme
localStorage.setItem("lte-theme", document.documentElement.dataset.bsTheme);
