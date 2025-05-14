/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, setConfigValues:false */

"use strict";

function getConfig() {
  utils.fetchFactory(`${document.body.dataset.apiurl}/config/?detailed=true`).then(data => {
    setConfigValues("", "", data.config);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  getConfig();
});
