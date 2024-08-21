/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2023 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global trustedTypes:false DOMPurify:false */

// See https://github.com/cure53/DOMPurify?tab=readme-ov-file#what-about-dompurify-and-trusted-types
// on why, counterintuitively, the RETURN_TRUSTED_TYPE property is set to false.
const domPurifyProfile = {
  RETURN_TRUSTED_TYPE: false,
  USE_PROFILES: {
    html: true,
  },
};

// eslint-disable-next-line compat/compat
trustedTypes.createPolicy("default", {
  // eslint-disable-next-line no-unused-vars
  createHTML: (string, type, sink) => {
    // console.warn("Created a '" + type + "' object but please stop using '" + sink + "'.");
    return DOMPurify.sanitize(string, domPurifyProfile);
  },
});
