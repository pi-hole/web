"use strict";

const globals = require("globals");
const { defineConfig } = require("eslint/config");
const compatPlugin = require("eslint-plugin-compat");

module.exports = defineConfig([
  {
    extends: [compatPlugin.configs["flat/recommended"]],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {},
      },
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.jquery,
      },
    },
    // Disable rules that conflict with Prettier, but do not enforce XO's own
    // built-in Prettier style
    prettier: "compat",
    space: 2,
    ignores: ["**/vendor/**"],
    rules: {
      "@stylistic/spaced-comment": "off",
      "camelcase": [
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
      "strict": ["error", "global"],
      "regexp/sort-character-class-elements": "off",
      "regexp/prefer-d": "off",
      "regexp/prefer-question-quantifier": "off",
      "regexp/no-useless-range": "off",
      "regexp/no-trivially-nested-quantifier": "off",
      // Require u flag instead of v: WebKit (Safari, DuckDuckGo) does not yet
      // support the ES2024 v (Unicode Sets) flag, causing a SyntaxError that
      // prevents all JS from executing. None of our regexes use v-exclusive
      // features, so u is fully equivalent and broadly compatible.
      "require-unicode-regexp": ["error", { requireFlag: "u" }],
      "unicorn/consistent-boolean-name": "off",
      "unicorn/name-replacements": "off",
      "unicorn/max-nested-calls": "off",
      "unicorn/no-anonymous-default-export": "off",
      "unicorn/no-document-cookie": "off",
      "unicorn/no-global-object-property-assignment": "off",
      "unicorn/no-negated-condition": "off",
      "unicorn/prefer-minimal-ternary": "off",
      "unicorn/prefer-module": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/prefer-string-slice": "off",
      "unicorn/prefer-string-raw": "off",
      "unicorn/prefer-ternary": "off",
      "unicorn/prevent-abbreviations": "off",
      "unicorn/switch-case-braces": "off",
    },
  },
  // Must be a separate config item so it lands after the prettier-compat config that XO injects
  //  - enforce double quotes
  //  - disable no-mixed-operators because it conflicts with Prettier's formatting
  {
    files: ["**/*.js"],
    rules: {
      "@stylistic/quotes": ["error", "double", { avoidEscape: true}],
      "@stylistic/no-mixed-operators": "off",
      "jsdoc/require-asterisk-prefix": ["error", "always"],
    },
  },
]);
