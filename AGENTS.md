# AGENTS.md

## Project overview

Pi-hole's web admin interface. Pages are Lua Pages (`.lp` files) rendered server-side by the embedded web server inside FTL (`pihole-FTL`); the frontend logic is plain JavaScript talking to FTL's REST API.

## Repository layout

- `*.lp` - the pages themselves (Lua Pages, rendered by FTL)
- `scripts/js/` - page JavaScript
- `scripts/lua/` - shared Lua code (layout, helpers)
- `style/` - CSS, including `style/themes/` for the selectable themes
- `img/` - images and icons
- `vendor/` - third-party assets; do not hand-edit vendored files

## Dev environment tips

- The interface cannot run standalone: it is served by a running FTL instance. Point a Pi-hole installation (or Docker container) at your checkout to test changes in a browser.
- Run `npm install` once to set up the lint toolchain.
- CSS vendor prefixes are generated with `npm run prefix`; do not add them by hand.
- All data shown in the interface comes from FTL's REST API. Do not invent endpoints; check the API documentation served by FTL (`/api/docs`) or the FTL repository.

## Testing instructions

- Run `npm test` (prettier in check mode plus xo). CI enforces both.
- Auto-fix with `npm run prettier:fix` and `npm run xo:fix`.
- Verify changes in a browser against a running FTL instance.
- Test in both light and dark themes when touching styling.

## PR instructions

- Base all work on the `development` branch; pull requests target `development`.
- Read the [contributors guide](https://docs.pi-hole.net/guides/github/contributing/)
- Every commit must be signed off (DCO): use `git commit -s`.
- Run `npm test` before committing.
- Use Unix line endings (LF).
- Code is licensed under the EUPL 1.2; contributions must be compatible.
- Changes that need new API capabilities require a matching FTL pull request; note the cross-repo dependency in both PRs.
- The correct project spelling is "Pi-hole" (capital P, lowercase h, hyphen).

## Security considerations

- Everything rendered in the interface may contain attacker-influenced data (hostnames, query names, list contents). Escape output; never interpolate API data into HTML or Lua templates unescaped.
- Authentication and session handling are FTL's responsibility; do not add client-side logic that assumes or bypasses it.
- If you believe you have found a vulnerability, do not open a public issue or PR; report it privately per the organisation's security policy (disclosure@pi-hole.net).

## Common pitfalls

- Treating `.lp` files as static HTML; they are Lua-templated and rendered by FTL.
- Editing files under `vendor/` or hand-writing vendor prefixes instead of using the npm scripts.
- Skipping `npm test`; CI will reject prettier/xo failures.
- Forgetting the DCO sign-off on commits.
