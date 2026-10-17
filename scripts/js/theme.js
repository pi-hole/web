/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

"use strict";

const currentBsTheme = document.documentElement.dataset.bsTheme;

const setAutoTheme = () => {
  const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  // Set data-bs-theme attribute for specific theme elements
  document.querySelector(".app-header .user-menu .dropdown-menu").dataset.bsTheme = systemTheme;
};

if (currentBsTheme === "auto") {
  setAutoTheme();
  // Listen for OS theme changes
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    setAutoTheme();
  });
}
