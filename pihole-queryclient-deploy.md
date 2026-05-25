# Deploy: "Client description in Query Log" patch (Pi-hole web)

Instructions for a Claude instance running **on the Pi-hole server**. Self-contained — no prior context needed.

## What this is

A **frontend-only** modification to the Pi-hole web admin dashboard (repo `pi-hole/web`).
It makes the **Query Log → Client** column show a client's configured **Description**
(the "comment" set on *Settings → Clients*) as `Description (IP)`, e.g. `Office PC (192.168.1.5)`.
When no description is set it falls back to hostname, then bare IP (the original behavior).

- The entire change lives in one static JS file: `scripts/js/queries.js`.
- It is **not** an official Pi-hole release. It is an unmerged personal branch.
- Upstream PR: https://github.com/pi-hole/web/pull/3785
- Source branch (public fork): `apezio/web` branch `query-log-client-description`
- Raw file URL:
  `https://raw.githubusercontent.com/apezio/web/query-log-client-description/scripts/js/queries.js`

## Prerequisites / compatibility

- This patch matches **Web version v6.5**. Verify before applying:
  ```bash
  pihole -v
  ```
  Proceed only if `Web version is v6.5` (or the queries.js structure still matches a v6.x layout
  that exposes `data.client.ip` / `data.client.name`). Do NOT apply on Pi-hole v5.
- Web root is normally `/var/www/html/admin`. Confirm the target file exists:
  ```bash
  ls -l /var/www/html/admin/scripts/js/queries.js
  ```

## Apply the patch

```bash
# 1. Back up the current file (skip if a .bak already exists you want to keep)
sudo cp /var/www/html/admin/scripts/js/queries.js /var/www/html/admin/scripts/js/queries.js.bak

# 2. Pull the modified file from the public fork and overwrite in place
curl -fsSL https://raw.githubusercontent.com/apezio/web/query-log-client-description/scripts/js/queries.js \
  | sudo tee /var/www/html/admin/scripts/js/queries.js > /dev/null
```

No service restart is required — it is a static JS file served as-is.

## Verify

```bash
# Should print 2 (function definition + its call). 0 means the copy failed.
grep -c getClientComments /var/www/html/admin/scripts/js/queries.js
```

Then **hard-refresh** the admin page in the browser (Ctrl+Shift+R / Ctrl+F5) to drop the cached
old JS. Open **Query Log**: clients with a Description set under *Settings → Clients* now show
`Description (IP)`.

## Revert

```bash
sudo mv /var/www/html/admin/scripts/js/queries.js.bak /var/www/html/admin/scripts/js/queries.js
```
Or run `sudo pihole -r` (repair) / `pihole -up`, which restore the official web files.

## Important caveats

- **`pihole -up` will overwrite this change** when a future Web update lands. Re-apply afterward
  if still wanted (or wait for PR #3785 to be merged, after which it ships normally).
- Known limitation: descriptions only match clients defined by **exact IP or hostname**. Clients
  defined by **MAC address or subnet/CIDR** are not matched and fall back to hostname/IP.
- Client-side display only — no changes to FTL or Core, nothing to restart, no DNS impact.
