/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false */

"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const logoutButton = document.getElementById("logout-button");
  const logoutUrl = document.body.dataset.webhome + "login";

  logoutButton.addEventListener("click", event => {
    event.preventDefault();
    utils.doLogout(logoutUrl);
  });
});
