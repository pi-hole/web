"use strict";

const globals = require("globals");
const { defineConfig } = require("eslint/config");
const compatPlugin = require("eslint-plugin-compat");

module.exports = defineConfig([
  {
    extends: [compatPlugin.configs["flat/recommended"]],
    languageOptions: {
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.jquery,
      },
    },
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
      "prefer-template": "error",
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
    },
  },
]);
