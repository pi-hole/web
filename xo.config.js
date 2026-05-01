"use strict";

module.exports = {
  prettier: true,
  space: 2,
  ignores: ["**/vendor/**"],
  rules: {
    "@stylistic/spaced-comment": "off",
    camelcase: [
      "error",
      {
        properties: "never",
      },
    ],
    "capitalized-comments": "off",
    "new-cap": [
      "error",
      {
        properties: false,
      },
    ],
    "no-alert": "off",
    "no-console": "error",
    // This should be removed later
    "no-implicit-globals": "off",
    "no-negated-condition": "off",
    "promise/prefer-await-to-then": "off",
    "prefer-arrow-callback": "error",
    "prefer-destructuring": [
      // This should be enabled later
      "off",
      {
        object: true,
        array: false,
      },
    ],
    // This should be reverted to "error" later
    strict: ["error", "global"],
    "unicorn/no-anonymous-default-export": "off",
    "unicorn/no-document-cookie": "off",
    "unicorn/no-negated-condition": "off",
    "unicorn/prefer-module": "off",
    "unicorn/prefer-query-selector": "off",
    "unicorn/prefer-string-slice": "off",
    "unicorn/prefer-string-raw": "off",
    "unicorn/prevent-abbreviations": "off",
    "unicorn/switch-case-braces": "off",
    // Disable require-unicode-regexp rule because v flag breaks WebKit browsers (Safari/DuckDuckGo)
    "require-unicode-regexp": "off",
  },
};
