/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2026 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false, moment:false */

"use strict";

// The nodes decide whose change is the newer one by the clock, and FTL refuses
// to synchronize with a node further away than this
const CLOCK_TOLERANCE = 2;

const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
const apiUrl = document.body.dataset.apiurl;

let refreshTimer = null;
let scanned = false;

// action names what the user pressed, and is what the toast says when the
// answer is not one showAlert() can make sense of; it picks the API's own
// message and hint out of the body when it can. Without an action the failure
// is silent, which is what the poll running every few seconds wants - a cluster
// that is down should not raise the same toast twelve times a minute
function api(path, options = {}, action = null) {
  return fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { "X-CSRF-TOKEN": csrfToken, ...options.headers },
  }).then(response => {
    if (response.ok) {
      return response.json();
    }

    // A session that expired under us sends the page back to the login form
    apiFailure(response);

    if (action === null || response.status === 401) {
      return null;
    }

    return response.text().then(body => {
      utils.showAlert("error", "", action, body);
      return null;
    });
  });
}

// A node is "us" either because the member list entry says so or because it is
// the node object this answer came from
function members(data) {
  const list = [];
  const seen = new Set();

  for (const peer of data.cluster.peers ?? []) {
    seen.add(peer.id);
    list.push({
      id: peer.id,
      name: peer.name || peer.url,
      url: peer.url,
      address: peer.address,
      self: peer.self === true,
      knowsUs: peer.knows_us !== false,
      reachable: peer.reachable === true,
      version: peer.version,
      branch: peer.branch,
      sees: peer.sees,
      clockOffset: peer.self ? 0 : peer.clock.offset,
      clockAgrees: peer.self ? true : peer.clock.agrees,
      lastSeen: peer.last_seen,
      error: peer.error,
      dhcp: peer.dhcp,
      vipHeld: peer.vip.held,
      sync: peer.sync,
    });
  }

  // A node polls its own entry too, but before the first round has finished it
  // does not know which entry that is - so the local node is added on its own
  // when the list does not name it yet
  const node = data.cluster.node;
  if (!seen.has(node.id) && list.every(entry => !entry.self)) {
    list.unshift({
      id: node.id,
      name: node.name,
      url: null,
      address: null,
      self: true,
      knowsUs: true,
      reachable: true,
      version: node.version,
      branch: node.branch,
      sees: [],
      clockOffset: 0,
      clockAgrees: true,
      lastSeen: null,
      error: null,
      dhcp: node.dhcp,
      vipHeld: node.vip.held,
      sync: node.sync,
    });
  }

  return list;
}

function roleBadges(entry, vipAddress) {
  const badges = [];
  if (entry.self) {
    badges.push('<span class="badge text-bg-primary">this node</span>');
  }

  if (entry.dhcp.active) {
    badges.push('<span class="badge text-bg-secondary">DHCP</span>');
  }

  if (entry.vipHeld) {
    badges.push(
      `<span class="badge text-bg-info">VIP${
        vipAddress ? " " + utils.escapeHtml(vipAddress) : ""
      }</span>`
    );
  }

  // Only where the node answered: an unreachable one reports no capability at
  // all, and "cannot serve DHCP" is not the news about it.
  //
  // `configured` is the permanent half and `capable` the momentary one - a node
  // rebuilding its lists, or backing off after a failed takeover, is fully able
  // to serve and simply not right now. Saying it cannot sends somebody looking
  // for a DHCP fault that is not there, and it can land on the very node that
  // is handing out the addresses
  if (entry.reachable && entry.dhcp.failover && entry.dhcp.configured === false) {
    badges.push('<span class="badge text-bg-warning">cannot serve DHCP</span>');
  } else if (entry.reachable && entry.dhcp.failover && !entry.dhcp.capable) {
    badges.push(
      '<span class="badge text-bg-secondary" title="Rebuilding its lists, or waiting after a failed takeover. It can serve, just not at this moment">not ready to take DHCP</span>'
    );
  }

  // Answers every poll, sends nothing back - the one failure that looks like
  // health from here
  if (entry.reachable && !entry.self && !entry.knowsUs) {
    badges.push('<span class="badge text-bg-warning">does not list this node</span>');
  }

  return badges.join(" ");
}

function renderNodes(list, data) {
  const vipAddress = data.cluster.node.vip.address;
  const container = document.querySelector("#cluster-nodes");
  container.replaceChildren();

  // Widest card that still fits the number of nodes on one row
  const width = list.length >= 4 ? "col-xl-3 col-md-6" : "col-lg-4 col-md-6";

  for (const entry of list) {
    const state = entry.reachable ? "success" : "danger";
    const detail = entry.reachable
      ? "in the cluster"
      : utils.escapeHtml(entry.error ?? "unreachable");

    const card = document.createElement("div");
    card.className = width;
    card.innerHTML = `
      <div class="card border-${state}">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h3 class="mb-0">${utils.escapeHtml(entry.name)}</h3>
              <span class="text-body-secondary small">${
                entry.url ? utils.escapeHtml(entry.url) : "&nbsp;"
              }${
                entry.address && entry.url && !entry.url.includes(entry.address)
                  ? ` (${utils.escapeHtml(entry.address)})`
                  : ""
              }</span>
            </div>
          </div>
          <div class="mt-2">${roleBadges(entry, vipAddress)}</div>
          <hr class="my-2">
          <div class="small text-body-secondary">
            <div>${detail}</div>
            <div>${
              entry.version
                ? "FTL " +
                  utils.escapeHtml(entry.version) +
                  (entry.branch ? ` (${utils.escapeHtml(entry.branch)})` : "")
                : "&nbsp;"
            }</div>
          </div>
        </div>
      </div>`;
    container.append(card);
  }
}

// Every node polls every other one, so this is a mesh and not a star. What is
// drawn for a pair is what both of them say about it: this node knows its own
// links first hand and the others publish theirs
function renderTopology(list, data) {
  const svg = document.querySelector("#cluster-topology");
  const style = getComputedStyle(document.body);
  const colour = name => style.getPropertyValue(name).trim() || "#888";
  const ok = colour("--bs-success");
  const bad = colour("--bs-danger");
  const oneway = colour("--bs-warning");
  const unknown = colour("--bs-secondary-color");
  const ink = colour("--bs-body-color");

  const width = 920;
  const height = list.length > 6 ? 480 : 400;
  const cx = width / 2;
  const cy = height / 2;
  const rx = cx - 200;
  const ry = cy - 100;
  const r = 34;

  // This node first and then the rest, so the picture keeps its shape while
  // members come and go
  const ordered = list.toSorted((a, b) => (a.self ? -1 : b.self ? 1 : 0));
  const step = (2 * Math.PI) / Math.max(ordered.length, 1);
  const points = ordered.map((entry, index) => {
    const angle = -Math.PI / 2 + step * index;
    return { entry, x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle), angle };
  });

  // What a says about b: first hand for this node, published for the others,
  // and nothing at all for a node that did not answer
  const view = (a, b) => {
    if (a.entry.self) {
      return b.entry.reachable;
    }

    if (!a.entry.reachable || !Array.isArray(a.entry.sees)) {
      return null;
    }

    return a.entry.sees.includes(b.entry.id);
  };

  const at = value => value.toFixed(1);
  const parts = [];

  let asymmetric = false;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const there = view(points[i], points[j]);
      const back = view(points[j], points[i]);
      const both = [there, back].filter(v => v !== null);
      let stroke = unknown;
      let dash = ' stroke-dasharray="2 5"';
      let opacity = 0.35;

      if (both.length > 0 && both.every(Boolean)) {
        stroke = ok;
        dash = "";
        opacity = 0.65;
      } else if (both.length > 0 && both.every(v => !v)) {
        stroke = bad;
        dash = ' stroke-dasharray="5 5"';
        opacity = 0.5;
      } else if (both.length === 2) {
        stroke = oneway;
        dash = ' stroke-dasharray="8 4"';
        opacity = 0.9;
        asymmetric = true;
      }

      parts.push(
        `<line x1="${at(points[i].x)}" y1="${at(points[i].y)}" x2="${at(points[j].x)}" y2="${at(
          points[j].y
        )}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" opacity="${opacity}"${dash} />`
      );
    }
  }

  // What a node is doing goes inside its circle: colour is reserved for
  // whether it can be reached, so roles have to be readable rather than green
  // Whoever serves DHCP, or would if it were switched on: the node with the
  // lowest identity among those answering. Naming it is the only thing the
  // "leader" ever meant, so it is said where it applies instead of in a header
  const roles = entry => {
    const marks = [];
    // Only where leases are actually being handed out. Which node would take
    // it over is not a state worth drawing - it changes with every node that
    // comes or goes, and nothing is happening on account of it
    if (entry.dhcp.active) {
      marks.push({ text: "DHCP", colour: unknown });
    }

    if (entry.vipHeld) {
      marks.push({ text: "VIP", colour: ok });
    }

    return marks;
  };

  for (const point of points) {
    const entry = point.entry;
    const edge = entry.reachable ? ok : bad;
    parts.push(
      `<circle cx="${at(point.x)}" cy="${at(point.y)}" r="${r + 7}" fill="none" stroke="${edge}" stroke-width="${
        entry.self ? 2 : 1
      }" opacity="${entry.self ? 0.35 : 0.15}" />`,
      `<circle cx="${at(point.x)}" cy="${at(point.y)}" r="${r}" fill="${colour(
        "--bs-body-bg"
      )}" stroke="${edge}" stroke-width="${entry.self ? 3 : 2}"${
        entry.reachable ? "" : ' stroke-dasharray="4 4"'
      } />`
    );

    const marks = roles(entry);
    for (const [index, mark] of marks.entries()) {
      const dy = marks.length === 1 ? 4 : index === 0 ? -2 : 12;
      parts.push(
        `<text x="${at(point.x)}" y="${at(point.y + dy)}" text-anchor="middle" font-size="11"
               font-weight="600" letter-spacing="0.5" fill="${mark.colour}">${mark.text}</text>`
      );
    }
  }

  // Under the name goes where the node is, short enough not to run off the
  // drawing: the scheme is the same for every node and the port is usually 443
  const where = url => (url ?? "").replace(/^https?:\/\//u, "").replace(/:443$/u, "");

  // Names are as long as their owner made them, and the drawing is only so
  // wide, so what does not fit is cut rather than left hanging over the edge
  const fit = (text, size, x, anchor) => {
    const room = anchor === "start" ? width - x : anchor === "end" ? x : 2 * Math.min(x, width - x);
    const max = Math.floor((room - 8) / (0.58 * size));
    return text.length > max ? `${text.slice(0, Math.max(1, max - 3))}...` : text;
  };

  // Labels last, pushed away from the ring: a name that runs outwards can only
  // ever collide with the edge of the drawing, never with another node
  for (const point of points) {
    const entry = point.entry;
    const out = Math.cos(point.angle);
    const anchor = out > 0.25 ? "start" : out < -0.25 ? "end" : "middle";
    const push = r + 14;
    const x = point.x + (anchor === "middle" ? 0 : Math.sign(out) * push);
    const y =
      point.y +
      (anchor === "middle" ? Math.sin(point.angle) * push : 0) +
      (anchor === "middle" && point.y < cy ? -14 : 5);
    const under = entry.reachable ? where(entry.url) : entry.error || "unreachable";
    parts.push(
      `<text x="${at(x)}" y="${at(y)}" text-anchor="${anchor}" font-size="13" font-weight="${
        entry.self ? 700 : 500
      }" fill="${ink}">${utils.escapeHtml(fit(entry.name, 13, x, anchor))}</text>`,
      `<text x="${at(x)}" y="${at(y + 15)}" text-anchor="${anchor}" font-size="11" fill="${colour(
        "--bs-secondary-color"
      )}">${utils.escapeHtml(fit(under, 11, x, anchor))}</text>`
    );
  }

  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = parts.join("\n");

  const owner = data.cluster.dhcp_owner;
  const notes = [
    "Every node polls every other one - a line is what <strong>both</strong> ends say about it.",
  ];
  if (asymmetric) {
    notes.push("An amber line is reached from one side only.");
  }

  if (owner) {
    notes.push(`DHCP is served by <strong>${utils.escapeHtml(owner)}</strong>.`);
  }

  // Only worth saying where DHCP is actually moving between nodes: without a
  // floating address, every client keeps the address of the node that gave it
  // its lease, and that node is the one that just stopped answering
  const vip = data.cluster.node.vip.address;
  const held = list.some(entry => entry.vipHeld);
  if (owner && !vip) {
    notes.push(
      '<span class="text-warning"><i class="fa-solid fa-triangle-exclamation"></i> ' +
        "DHCP moves between nodes but no virtual IP address is set, so clients keep " +
        "pointing at whichever node gave them their lease.</span>"
    );
  } else if (owner && vip && !held) {
    notes.push(
      `<span class="text-warning"><i class="fa-solid fa-triangle-exclamation"></i> <strong>${utils.escapeHtml(
        vip
      )}</strong> is on no node - check <code>cluster.vip.interface</code> where it should be.</span>`
    );
  }

  document.querySelector("#topology-note").innerHTML = notes.join(" ");

  document.querySelector("#topology-legend").innerHTML =
    '<span class="badge text-bg-success">reachable</span> ' +
    '<span class="badge text-bg-warning">one-way</span> ' +
    '<span class="badge text-bg-danger">unreachable</span> ' +
    '<span class="badge text-bg-secondary">not known</span>';
}

function renderPeers(list) {
  const body = document.querySelector("#peer-table tbody");
  const ours = list.find(entry => entry.self);
  body.replaceChildren();

  let agreeing = 0;
  let comparable = 0;

  for (const entry of list) {
    const sameConfig = ours && entry.sync.config.hash === ours.sync.config.hash;
    // The fingerprint names the tables on disk, and a node that took them
    // from a peer and then failed to rebuild has exactly the peer's - so the
    // hashes match while its blocking database is stale. It says so itself
    // An item pinned through the environment is hashed but no push can move
    // it, so two nodes differing only there differ for good. The badge alone
    // would leave that looking like a synchronization that never catches up
    const pinnedHere = ours?.sync.config.pinned || "";
    const pinnedThere = entry.sync.config.pinned || "";
    const credsPinnedHere = ours?.sync.config.pinned_credentials || "";
    const credsPinnedThere = entry.sync.config.pinned_credentials || "";
    // Both ends can pin the same item, and naming it twice reads as two
    // separate problems
    const pinned = [
      ...new Set(
        (entry.self ? [pinnedHere] : [pinnedHere, pinnedThere])
          .filter(Boolean)
          .flatMap(s => s.split(",").map(t => t.trim()))
          .filter(Boolean)
      ),
    ].join(", ");
    // Two FTL versions define different sets of settings, and the fingerprint
    // covers the item names as well as their values - so nodes on different
    // versions differ whatever they hold, and no push closes it
    const versionsApart =
      Boolean(ours?.version) && Boolean(entry.version) && ours.version !== entry.version;

    const why = [
      versionsApart ? `different FTL versions (${utils.escapeHtml(entry.version)})` : "",
      pinned ? `pinned to the environment: ${utils.escapeHtml(pinned)}` : "",
    ].filter(Boolean);
    const pinnedNote =
      !sameConfig && why.length > 0
        ? `<br><small class="text-body-secondary">${why.join("; ")}</small>`
        : "";

    // The credentials are fingerprinted apart from the rest and compared apart
    // from it, so an item pinned there explains that difference and not the
    // other one
    const credsPinned = [
      ...new Set(
        (entry.self ? [credsPinnedHere] : [credsPinnedHere, credsPinnedThere])
          .filter(Boolean)
          .flatMap(t => t.split(",").map(x => x.trim()))
          .filter(Boolean)
      ),
    ].join(", ");
    const credsPinnedNote = credsPinned
      ? `<br><small class="text-body-secondary">pinned to the environment: ${utils.escapeHtml(
          credsPinned
        )}</small>`
      : "";

    const listsOwed = entry.sync.gravity.owed === true;
    const sameLists = ours && entry.sync.gravity.hash === ours.sync.gravity.hash && !listsOwed;
    // A fingerprint we do not have is not a fingerprint that matches: two
    // nodes that both failed to read their own would otherwise be counted as
    // agreeing, and the summary would say synced over a table of "unknown"
    const known =
      Boolean(ours?.sync.config.hash) &&
      Boolean(entry.sync.config.hash) &&
      Boolean(ours?.sync.gravity.hash) &&
      Boolean(entry.sync.gravity.hash);

    // The credentials travel only between two nodes that both accept them, so
    // they are fingerprinted apart from the rest and only compared where that
    // comparison can mean anything
    const bothAccept =
      ours?.sync.config.accepts_credentials === true &&
      entry.sync.config.accepts_credentials === true;
    const bothKnown = Boolean(ours?.sync.config.credentials && entry.sync.config.credentials);
    const credsDiffer =
      bothAccept && bothKnown && entry.sync.config.credentials !== ours.sync.config.credentials;

    if (entry.reachable && !entry.self) {
      comparable++;
      if (known && sameConfig && sameLists && !credsDiffer) {
        agreeing++;
      }
    }

    const mark = (same, hash, differs = "differs") =>
      hash
        ? `<span class="badge text-bg-${same ? "success" : "warning"}">${
            same ? "synced" : differs
          }</span>`
        : '<span class="text-body-secondary">unknown</span>';

    // Relative, with the exact moment in the tooltip: "3 days ago" is what
    // somebody reads a table like this for. Shown to the microsecond, because
    // the timestamp travels with the document rather than being taken on
    // arrival - nodes holding the same configuration really do report the same
    // instant, and seconds alone would leave that looking like a rounding
    // A node that declared its own version as the cluster's starting point
    // stamps something below every real timestamp on purpose, so that any real
    // change outranks it. Rendering that as a moment would put it in 1970
    const BASELINE_MAX = 1000000000;

    const when = value => {
      if (!value || value <= 0) {
        return '<span class="text-body-secondary">never</span>';
      }

      if (value < BASELINE_MAX) {
        return '<span class="text-body-secondary" title="This node offered what it holds as the cluster\'s starting point. Any real change, on any node, replaces it">nothing changed yet</span>';
      }

      const micro = String(Math.round((value % 1) * 1e6) % 1e6).padStart(6, "0");
      const exact = `${moment.unix(Math.floor(value)).format("Y-MM-DD HH:mm:ss")}.${micro}`;
      return `<span title="${exact}">${utils.datetimeRelative(value)}</span>`;
    };

    // The number the chart used to draw. A node whose clock is too far from
    // ours is not synchronized with, so it is worth seeing next to the rest
    const clock = () => {
      if (entry.self) {
        return '<span class="text-body-secondary">this node</span>';
      }

      if (!entry.reachable) {
        return '<span class="text-body-secondary">-</span>';
      }

      // Nodes on one network are milliseconds apart, and a column of "0.0 s"
      // says nothing - so the unit follows the size of what is being shown
      const offset = entry.clockOffset;
      const sign = offset < 0 ? "-" : "+";
      const size = Math.abs(offset);
      const seconds =
        size < 1 ? `${sign}${(size * 1000).toFixed(1)} ms` : `${sign}${size.toFixed(1)} s`;
      return entry.clockAgrees
        ? seconds
        : `<span class="badge text-bg-danger" title="tolerance +/- ${CLOCK_TOLERANCE} s">${seconds}</span>`;
    };

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${
        entry.reachable ? "" : '<i class="fa-solid fa-plug-circle-xmark text-danger me-1"></i>'
      }${utils.escapeHtml(entry.name)}${
        entry.self ? ' <span class="badge text-bg-primary">this node</span>' : ""
      }</td>
      <td><span class="badge text-bg-secondary font-monospace">${utils.escapeHtml(
        entry.id
      )}</span></td>
      <td>${
        sameConfig && credsDiffer
          ? '<span class="badge text-bg-warning">credentials differ</span>' + credsPinnedNote
          : mark(sameConfig, entry.sync.config.hash) + pinnedNote
      }</td>
      <td>${when(entry.sync.config.changed)}</td>
      <td>${mark(sameLists, entry.sync.gravity.hash, listsOwed ? "not rebuilt" : "differs")}</td>
      <td>${when(entry.sync.gravity.changed)}</td>
      <td>${clock()}</td>`;
    body.append(row);
  }

  // Asked for and not happening, which is what an http:// member does to it.
  // Worth its own line: the table would otherwise show the passwords quietly
  // staying apart with nothing saying why
  const credsAsked = ours?.sync.config.wants_credentials === true;
  const credsHappening = ours?.sync.config.accepts_credentials === true;
  const credsBlocked =
    credsAsked && !credsHappening
      ? ' <span class="badge text-bg-warning" title="Every member has to be reached over https before a password travels">credentials not travelling</span>'
      : "";

  const summary = document.querySelector("#peer-summary");
  summary.innerHTML =
    (comparable === 0
      ? '<span class="badge text-bg-secondary">no peers to compare with</span>'
      : agreeing === comparable
        ? `<span class="badge text-bg-success">all ${comparable} peers synced</span>`
        : `<span class="badge text-bg-warning">${
            comparable - agreeing
          } of ${comparable} peers differ</span>`) + credsBlocked;
}

// The request the web interface makes anywhere else, which is also the one the
// nodes make to each other
function patchConfig(body, action) {
  return api(
    "/config",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: body }),
    },
    action
  );
}

// ...addressed by a dotted key, for the switches
function patchSetting(key, value, done) {
  const body = {};
  let cursor = body;
  const parts = key.split(".");
  for (const [index, part] of parts.entries()) {
    if (index === parts.length - 1) {
      cursor[part] = value;
    } else {
      cursor[part] = {};
      cursor = cursor[part];
    }
  }

  patchConfig(body, `Error while saving ${key}`).then(answer => {
    if (!answer) {
      return;
    }

    // Both switches on this page carry FLAG_RESTART_FTL, so saving one takes
    // this node's DNS down for a moment. Saying so is the difference between
    // a page that has gone quiet and a page that is broken
    const restarts = key === "cluster.dhcp.failover" || key === "cluster.vip.address";
    utils.showAlert(
      "success",
      "",
      "Saved",
      `${key} is now ${value}${restarts ? " - FTL is restarting to apply it" : ""}`
    );
    if (done) {
      done();
    }
  });
}

// Every round redraws the page, so the switch is only read here - listening
// from here as well would add a handler per round, and one click would then
// save the same value as often as the page had been refreshed
function renderControls(config) {
  document.querySelector("#toggle-failover").checked = config.cluster.dhcp.failover;

  // The page redraws every few seconds, and an edit somebody has not saved yet
  // must survive that - whether they typed it or the Suggest button put it
  // there. Marked rather than guessed from the value: saving clears the mark,
  // so the field follows the cluster again afterwards
  for (const [id, value] of [
    ["#vip-address", config.cluster.vip.address],
    ["#vip-interface", config.cluster.vip.interface],
  ]) {
    const field = document.querySelector(id);
    // What the cluster holds, remembered so that an edit typed and then undone
    // counts as no edit at all rather than freezing the field for good
    field.dataset.saved = value;
    if (field !== document.activeElement && field.dataset.edited !== "1") {
      field.value = value;
    }
  }
}

// Everything FTL has seen or is using on this segment. A device that has never
// spoken is not in here, which is why what comes out of it is a suggestion and
// not a promise
async function takenAddresses() {
  const [devices, gateway, interfaces] = await Promise.all([
    api("/network/devices?max_devices=999&max_addresses=999"),
    api("/network/gateway"),
    api("/network/interfaces"),
  ]);

  const taken = new Set();
  for (const device of devices?.devices ?? []) {
    for (const ip of device.ips ?? []) {
      taken.add(ip.ip);
    }
  }

  // The subnet to suggest within is the one holding the default route, which
  // is also the interface FTL puts the address on when none is configured
  const route = (gateway?.gateway ?? []).find(entry => entry.family === "inet");
  if (!route) {
    return null;
  }

  taken.add(route.address);
  let subnet = null;
  for (const iface of interfaces?.interfaces ?? []) {
    for (const address of iface.addresses ?? []) {
      if (address.family === "inet" && address.scope === "universe") {
        taken.add(address.address);
        if (iface.name === route.interface && !subnet) {
          subnet = { address: address.address, prefixlen: address.prefixlen };
        }
      }
    }
  }

  return subnet ? { subnet, taken } : null;
}

const toNumber = address =>
  address.split(".").reduce((total, part) => total * 256 + Number(part), 0);
const toAddress = value =>
  [16_777_216, 65_536, 256, 1].map(unit => Math.floor(value / unit) % 256).join(".");

// The highest address in the subnet that nothing is known to use and the DHCP
// server would not hand out. Counting down rather than up because routers and
// fixed hosts sit at the bottom of a subnet far more often than at the top
function freeAddress(subnet, taken, dhcp) {
  const bits = subnet.prefixlen;
  if (bits < 8 || bits > 30) {
    return null;
  }

  const size = 2 ** (32 - bits);
  const network = Math.floor(toNumber(subnet.address) / size) * size;
  const first = dhcp?.active ? toNumber(dhcp.start) : 0;
  const last = dhcp?.active ? toNumber(dhcp.end) : 0;

  for (let value = network + size - 2; value > network; value--) {
    const address = toAddress(value);
    if (taken.has(address) || (dhcp?.active && value >= first && value <= last)) {
      continue;
    }

    return address;
  }

  return null;
}

function setupControls() {
  const failover = document.querySelector("#toggle-failover");
  failover.addEventListener("change", () =>
    patchSetting(failover.dataset.key, failover.checked, refresh)
  );

  for (const id of ["#vip-address", "#vip-interface"]) {
    const field = document.querySelector(id);
    const save = () => {
      // Enter and the change event both land here - Enter first, and the change
      // event follows when the field is left afterwards - so a value that is
      // already saved is not saved again
      if (field.dataset.edited !== "1") {
        return;
      }

      // Saved, so the cluster owns this field again
      field.dataset.edited = "0";
      patchSetting(field.dataset.key, field.value.trim(), refresh);
    };

    field.addEventListener("input", () => {
      field.dataset.edited = field.value === (field.dataset.saved ?? "") ? "0" : "1";
    });
    field.addEventListener("change", save);
    // A value the page put there - a suggested address - fires no change event
    // however the field is left, so there has to be a way to say "keep it"
    field.addEventListener("keydown", event => {
      if (event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      save();
    });
  }

  const suggest = document.querySelector("#vip-suggest");
  suggest.addEventListener("click", async () => {
    suggest.disabled = true;
    try {
      const [known, config] = await Promise.all([takenAddresses(), api("/config")]);
      const address = known && freeAddress(known.subnet, known.taken, config?.config?.dhcp);
      if (!address) {
        utils.showAlert(
          "warning",
          "",
          "Nothing to suggest",
          "No IPv4 subnet with a free address was found - fill the address in yourself"
        );
        return;
      }

      const field = document.querySelector("#vip-address");
      field.value = address;
      // Nothing is saved yet, and the poll must not wipe the suggestion in the
      // meantime. The field is focused so that pressing Enter keeps it
      field.dataset.edited = "1";
      field.focus();
      utils.showAlert(
        "info",
        "",
        "Suggestion only",
        `${address} is not used by anything Pi-hole has seen on this network - but a device switched off since Pi-hole started is not in that list, so check it really is free. Press Enter in the field to keep it.`
      );
    } finally {
      suggest.disabled = false;
    }
  });
}

// The nodes on the segment that answered, drawn as something to click rather
// than an address to copy out
// Only a Pi-hole that is already in a cluster answers the scan, so anything
// joinable out there means this node should join rather than start a second
// cluster - and the way to say that is to not offer the button at all. It stays
// available from the command line for somebody who really does want two
function offerCreating(nodes) {
  // Anything that answered at all is a cluster on this segment, whether or not
  // this Pi-hole can join it from here - a node with no encrypted port answers
  // the scan and comes back without a URL. Offering to create a second cluster
  // because the first one cannot be joined is the mistake this card exists to
  // prevent; the list above says why the node cannot be joined instead
  document.querySelector("#create-card").hidden = nodes.length > 0;
}

function renderFound(nodes) {
  const box = document.querySelector("#join-found");
  if (nodes.length === 0) {
    box.innerHTML =
      '<div class="list-group-item text-body-secondary">No other Pi-hole answered. Only nodes that are already in a cluster do, so there is none on this network yet - create one below.</div>';
    return;
  }

  box.innerHTML = nodes
    .map(node => {
      const reachable = typeof node.url === "string";
      return `<button type="button" class="list-group-item list-group-item-action${
        reachable ? "" : " disabled"
      }" data-url="${utils.escapeHtml(node.url ?? "")}">
          <i class="fa-solid fa-server"></i> ${utils.escapeHtml(node.address)}
          <span class="text-body-secondary">(${
            reachable
              ? utils.escapeHtml(node.url)
              : "no encrypted port, so this one cannot be joined"
          })</span>
        </button>`;
    })
    .join("");

  for (const button of box.querySelectorAll("button[data-url]")) {
    button.addEventListener("click", () => {
      document.querySelector("#join-url").value = button.dataset.url;
      document.querySelector("#join-password").focus();
    });
  }
}

function setupJoin() {
  const scan = document.querySelector("#join-scan");
  const go = document.querySelector("#join-go");

  // FTL refuses both of these unless the connection is encrypted: the password
  // of the other node crosses this one
  if (location.protocol !== "https:") {
    document.querySelector("#join-insecure").hidden = false;
    go.disabled = true;

    // Creating is allowed over http - a cluster without encryption is a
    // supported thing - but the address seeded here becomes a member entry
    // that every later node inherits, and one http member stops credentials
    // travelling anywhere in the cluster for as long as it is there
    document.querySelector("#create-insecure").hidden = false;
  }

  scan.addEventListener("click", () => {
    scan.disabled = true;
    document.querySelector("#join-found").innerHTML =
      '<div class="list-group-item text-body-secondary">Asking the network...</div>';
    api("/cluster/discover", {}, "Error while scanning the network")
      .then(answer => {
        // A scan that failed answers null, and it is not the same answer as a
        // scan that found nothing: offering to create a second cluster on a
        // network that already has one is the mistake this page exists to
        // prevent, so a failure offers nothing
        if (!answer) {
          document.querySelector("#join-found").innerHTML =
            '<div class="list-group-item text-body-secondary">The scan failed, so nothing is ruled out - enter a node below, or scan again</div>';
          return;
        }

        const nodes = answer.nodes ?? [];
        renderFound(nodes);
        offerCreating(nodes);
      })
      .catch(() => {
        document.querySelector("#join-found").innerHTML =
          '<div class="list-group-item text-body-secondary">The scan failed, so nothing is ruled out - enter a node below, or scan again</div>';
      })
      .finally(() => {
        scan.disabled = false;
      });
  });

  const create = document.querySelector("#create-go");
  const createSelf = document.querySelector("#create-self");

  // Whatever this browser used. pi.hole is the exception: every Pi-hole answers
  // it for whoever asks, so it is the one address that names no particular node
  const ownName = /^pi\.hole$/iu.test(location.hostname);
  createSelf.value = ownName ? "" : location.origin;
  createSelf.placeholder = ownName
    ? "https://192.168.0.5 - the address the other nodes will use"
    : "";

  create.addEventListener("click", () => {
    const url = createSelf.value.trim();
    if (url === "") {
      utils.showAlert(
        "warning",
        "",
        "Nothing to create",
        "Enter the address the other nodes reach this one at"
      );
      return;
    }

    create.disabled = true;
    patchConfig({ cluster: { enabled: true, members: [url] } }, "Error while creating the cluster")
      .then(answer => {
        if (!answer) {
          return;
        }

        utils.showAlert(
          "success",
          "",
          "Cluster created",
          "This Pi-hole is restarting as a cluster of one. The shared secret the other nodes need is in /etc/pihole/cluster_secret"
        );
      })
      .catch(() =>
        utils.showAlert(
          "error",
          "",
          "Error while creating the cluster",
          "This Pi-hole could not be reached"
        )
      )
      .finally(() => {
        create.disabled = false;
      });
  });

  go.addEventListener("click", () => {
    // No address of our own and no certificate pin: the node being joined sees
    // where the request comes from, and the API takes both for anybody who has
    // a reason to override them
    const body = {
      url: document.querySelector("#join-url").value.trim(),
      password: document.querySelector("#join-password").value,
    };

    // Optional, and the only thing that can vouch for this one connection:
    // everything afterwards is signed with the shared secret, which is itself
    // handed over here
    const pin = document.querySelector("#join-pin").value.trim();
    if (pin !== "") {
      body.pin = pin;
    }

    if (body.url === "") {
      utils.showAlert("warning", "", "Nothing to join", "Pick a Pi-hole from the list above");
      return;
    }

    go.disabled = true;
    api(
      "/cluster/join",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      "Error while joining the cluster"
    )
      .then(answer => {
        if (answer?.joined !== true) {
          return;
        }

        document.querySelector("#join-password").value = "";
        utils.showAlert(
          "success",
          "",
          "Joined",
          "This Pi-hole is restarting and will come back as a member of that cluster"
        );
      })
      .catch(() =>
        utils.showAlert(
          "error",
          "",
          "Error while joining the cluster",
          "This Pi-hole could not be reached"
        )
      )
      .finally(() => {
        go.disabled = false;
      });
  });
}

function refresh() {
  return Promise.all([api("/cluster/status"), api("/config")]).then(([status, config]) => {
    if (!status || !config) {
      return;
    }

    const enabled = status.cluster.enabled === true;
    document.querySelector("#cluster-disabled").hidden = enabled;
    document.querySelector("#cluster-body").hidden = !enabled;
    if (!enabled) {
      // The heading is outside the part that gets hidden, so what it said
      // while this node was in a cluster would otherwise stand there
      document.querySelector("#cluster-name").textContent = "";
      document.querySelector("#cluster-lastround").textContent = "";

      // Asked once, unprompted, and only where the answer is shown: whether
      // this node should join or start a cluster is worth knowing before
      // somebody presses anything
      if (!scanned) {
        scanned = true;
        document.querySelector("#join-scan").click();
      }

      return;
    }

    const list = members(status);
    document.querySelector("#cluster-name").textContent = `${list.length} ${
      list.length === 1 ? "node" : "nodes"
    }`;
    document.querySelector("#cluster-lastround").innerHTML = status.cluster.last_round
      ? `last round ${utils.datetimeRelative(status.cluster.last_round)}`
      : "no round has finished yet";

    const pin = status.cluster.node.pin;
    document.querySelector("#pin-card").hidden = !pin;
    if (pin) {
      document.querySelector("#node-pin").textContent = pin;
    }

    renderNodes(list, status);
    renderTopology(list, status);
    renderPeers(list);
    renderControls(config.config);
  });
}

// Leaving is asked for once and then takes a moment: FTL tells the other nodes
// before it switches clustering off here, and restarts at the end of it
function setupLeave() {
  const go = document.querySelector("#leave-go");
  go.addEventListener("click", () => {
    if (!confirm("Take this Pi-hole out of the cluster?")) {
      return;
    }

    go.disabled = true;
    api("/cluster/leave", { method: "POST" }, "Error while leaving the cluster")
      .then(answer => {
        if (answer?.leaving !== true) {
          return;
        }

        utils.showAlert(
          "info",
          "",
          "Leaving the cluster",
          "The other nodes are being told, then FTL restarts here"
        );
      })
      .catch(() =>
        utils.showAlert(
          "error",
          "",
          "Error while leaving the cluster",
          "This Pi-hole could not be reached"
        )
      )
      .finally(() => {
        // Given back however it ended: a request that failed leaves this node
        // in the cluster, and the button is how somebody tries again
        go.disabled = false;
      });
  });
}

// A round that could not be fetched leaves the page holding the last one it
// could, which is every node green and "in the cluster" - the exact picture a
// healthy cluster paints. Saving either switch here restarts FTL, so this is
// not an unusual state, and it must not look like the usual one
function noteUnreachable() {
  const marker = document.querySelector("#cluster-lastround");
  if (marker) {
    marker.textContent = "not answering";
    marker.classList.add("text-warning");
  }
}

function refreshOnce() {
  const marker = document.querySelector("#cluster-lastround");
  return refresh()
    .then(() => marker && marker.classList.remove("text-warning"))
    .catch(noteUnreachable);
}

document.addEventListener("DOMContentLoaded", () => {
  setupJoin();
  setupLeave();
  setupControls();
  refreshOnce();
  refreshTimer = setInterval(refreshOnce, 5000);
  addEventListener("beforeunload", () => clearInterval(refreshTimer));
});
