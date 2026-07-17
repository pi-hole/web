/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

"use strict";

const currentBsTheme = document.documentElement.dataset.bsTheme;
let lockedTheme = currentBsTheme;

const setAutoTheme = () => {
  lockedTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.dataset.bsTheme = lockedTheme;
  localStorage.setItem("theme", lockedTheme);
};

if (currentBsTheme === "auto") {
  setAutoTheme();
  // Listen for OS theme changes
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    setAutoTheme();
  });
} else {
  // Sync Pi-hole's explicitly configured theme to localStorage
  localStorage.setItem("theme", lockedTheme);
}

// Lock the theme aggressively so AdminLTE cannot override it based on OS preferences
const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (
      mutation.attributeName === "data-bs-theme" &&
      document.documentElement.dataset.bsTheme !== lockedTheme
    ) {
      document.documentElement.dataset.bsTheme = lockedTheme;
    }
  }
});
observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-bs-theme"],
});
