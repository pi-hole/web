<? --[[
*  Pi-hole: A black hole for Internet advertisements
*  (c) 2026 Pi-hole, LLC (https://pi-hole.net)
*  Network-wide ad blocking via your own hardware.
*
*  This file is copyright under the latest version of the EUPL.
*  Please see LICENSE file for your rights under this license.
--]]

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title/Header -->
<div class="app-content-header">
    <div class="container-fluid">
        <div class="row">
            <div class="col-12 d-flex flex-wrap align-items-baseline gap-2">
                <h1 class="mb-0">HA cluster</h1>
                <span id="cluster-name" class="text-body-secondary"></span>
                <span class="ms-auto text-body-secondary small" id="cluster-lastround"></span>
            </div>
        </div>
    </div>
</div>

<div class="app-content">
    <div class="container-fluid">

        <!-- Clustering switched off: everything below is meaningless, so say so
             once instead of drawing an empty cluster -->
        <div class="row" id="cluster-disabled" hidden>
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">This Pi-hole is <span class="text-danger">not</span> part of a cluster</h3>
                    </div>
                    <div class="card-body">
                        <p class="mb-0">
                            Clustering keeps the configuration and the lists of several Pi-holes in
                            step, hands DHCP over when one of them fails, and moves a virtual IP
                            address to whichever node the clients should be talking to. Join one
                            below, or create the first one. See the
                            <a href="https://docs.pi-hole.net/ftldns/cluster/" rel="noopener" target="_blank">documentation</a>
                            for how the nodes authenticate to each other.
                        </p>
                    </div>
                </div>

                <!-- ...or let this Pi-hole find one and join it. Everything a node
                     needs is behind the password of a node that is already in the
                     cluster: the shared secret and the member list come with it -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Join an existing cluster</h3>
                        <div class="card-tools">
                            <button type="button" class="btn btn-sm btn-secondary" id="join-scan">
                                <i class="fa-solid fa-magnifying-glass"></i> Scan the network
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div id="join-insecure" class="alert alert-warning" hidden>
                            This page is not served over an encrypted connection. The password of
                            the other Pi-hole would cross the network in the clear, so joining is
                            refused - open this page over <code>https://</code> and try again.
                        </div>
                        <p class="text-body-secondary">
                            Pick one and enter <em>its</em> password. This Pi-hole then takes that
                            cluster's settings and lists, replacing its own.
                        </p>
                        <div id="join-found" class="list-group mb-3"></div>
                        <div class="row g-2 align-items-end">
                            <div class="col-md-6">
                                <label class="form-label mb-1" for="join-url">Pi-hole to join</label>
                                <input type="text" class="form-control" id="join-url"
                                       placeholder="https://192.168.0.5">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label mb-1" for="join-password">Its password</label>
                                <input type="password" class="form-control" id="join-password"
                                       autocomplete="off">
                            </div>
                            <div class="col-md-2 d-grid">
                                <button type="button" class="btn btn-primary" id="join-go">Join</button>
                            </div>
                            <div class="col-12">
                                <label class="form-label mb-1" for="join-pin">
                                    Fingerprint of that Pi-hole <span class="text-body-secondary">- optional</span>
                                </label>
                                <input type="text" class="form-control font-monospace" id="join-pin"
                                       autocomplete="off" placeholder="leave empty unless you want it checked">
                                <div class="form-text">
                                    Every Pi-hole shows its own fingerprint on this page. Leave this
                                    empty and joining works as it always does. Fill it in and this
                                    Pi-hole refuses to join through anything that does not present
                                    exactly that certificate - which protects the one connection a
                                    cluster cannot check for itself, the one carrying the other
                                    node's password.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- The other half: there has to be a first node, and nothing else
                     can make one. Deliberately below joining and deliberately loud -
                     a second cluster on one network is two clusters that ignore each
                     other, and the mistake is only visible much later -->
                <div class="card" id="create-card" hidden>
                    <div class="card-header">
                        <h3 class="card-title">Create a new cluster</h3>
                    </div>
                    <div class="card-body">
                        <p class="text-body-secondary">
                            <strong>Only for the first Pi-hole.</strong> This makes a cluster of one:
                            it generates the shared secret the other nodes will need and starts
                            answering the scan above, so they can find this node and join it.
                            It is offered because the scan found nothing to join - a Pi-hole only
                            answers that scan once it is in a cluster, so there is none here yet.
                        </p>
                        <div class="input-group" style="max-width:30rem">
                            <span class="input-group-text">This node's address</span>
                            <input type="text" class="form-control" id="create-self">
                            <button class="btn btn-warning" type="button" id="create-go">
                                Create a cluster
                            </button>
                        </div>
                        <div id="create-insecure" class="alert alert-warning mt-2 mb-0" hidden>
                            This page is open over <code>http</code>, so the address above is an
                            <code>http</code> one. The member list is shared, so every node that
                            joins later inherits it - and passwords never travel between nodes
                            while any member is reached without encryption. Write it as
                            <code>https://</code> if this Pi-hole serves it.
                        </div>
                        <p class="text-body-secondary small mt-2 mb-0">
                            The address is how the other nodes will reach this one - a loopback
                            address only works if they are containers on this host. FTL restarts
                            afterwards.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <div id="cluster-body" hidden>

            <!-- What the cluster is doing right now -->
            <div class="row" id="cluster-nodes"></div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Topology</h3>
                            <div class="card-tools" id="topology-legend"></div>
                        </div>
                        <div class="card-body">
                            <!-- Drawn as inline SVG rather than with a graph library: it is a
                                 handful of nodes, it has to follow the selected theme, and it
                                 costs no new dependency -->
                            <svg id="cluster-topology" viewBox="0 0 920 380" role="img"
                                 aria-label="Cluster topology" class="w-100"></svg>
                            <p class="text-body-secondary small mb-0" id="topology-note"></p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Who holds what. This is the part a cluster overview usually cannot show:
                 every node publishes a fingerprint of its configuration and of its lists,
                 so agreement is a fact rather than an assumption -->
            <div class="row">
                <div class="col-12">
                    <div class="card" id="pin-card" hidden>
                        <div class="card-body py-2 d-flex flex-wrap align-items-center gap-2">
                            <span><i class="fa-solid fa-fingerprint"></i>
                                <strong>This node's fingerprint</strong></span>
                            <code id="node-pin" class="user-select-all"></code>
                            <span class="text-body-secondary small ms-auto">Optional. Read it out to
                                somebody joining through this node and it goes in their
                                <em>Fingerprint</em> field - carried by hand, because over the
                                network it would prove nothing</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Peer status</h3>
                            <div class="card-tools" id="peer-summary"></div>
                        </div>
                        <div class="card-body p-0">
                            <div class="table-responsive">
                                <table class="table table-striped mb-0" id="peer-table">
                                    <thead>
                                        <tr>
                                            <th>Node</th>
                                            <th>Identity</th>
                                            <th>Configuration</th>
                                            <th>Changed</th>
                                            <th>Lists</th>
                                            <th>Changed</th>
                                            <th>Clock</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                        <div class="card-footer text-body-secondary small">
                            A cluster holds at most eight nodes: every node polls every other one,
                            so what a round costs grows with the square of the size. Identities are
                            drawn once per node and never collide - the reachable node with the
                            lowest one serves DHCP and anchors the virtual IP address, so every node
                            reaches the same answer without asking anybody. The clock column is how
                            far each peer is from this one - a node further than +/- 2 s away is not
                            synchronized with until it agrees again.
                        </div>
                    </div>
                </div>
            </div>

            <!-- The settings that steer all of this. Everything here is an ordinary
                 configuration item, so it is changed through PATCH /api/config like any
                 other, and the cluster carries the change to the other nodes itself -->
            <div class="row">
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header"><h3 class="card-title">Failover</h3></div>
                        <div class="card-body">
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch"
                                       id="toggle-failover" data-key="cluster.dhcp.failover">
                                <label class="form-check-label" for="toggle-failover">
                                    <strong>Hand DHCP over when a node fails</strong><br>
                                    <span class="text-body-secondary small">The reachable node with
                                    the lowest identity serves DHCP, and the others keep theirs off
                                    until they are needed</span>
                                </label>
                            </div>
                            <p class="text-body-secondary small mb-0">
                                The configuration and the lists are kept synced for as long as this
                                Pi-hole is part of a cluster - there is nothing to switch on for that.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- One address the clients keep, wherever DHCP happens to be.
                     The address is the same everywhere so it travels with the
                     rest of the configuration; the interface it goes on does
                     not, since it is called something else on the next node -->
                <div class="col-lg-4">
                    <div class="card h-100">
                        <div class="card-header"><h3 class="card-title">Virtual IP address</h3></div>
                        <div class="card-body">
                            <label class="form-label mb-1" for="vip-address">Address</label>
                            <div class="input-group mb-2">
                                <input type="text" class="form-control" id="vip-address"
                                       data-key="cluster.vip.address" placeholder="none">
                                <button class="btn btn-outline-secondary" type="button" id="vip-suggest">
                                    Suggest
                                </button>
                            </div>
                            <label class="form-label mb-1" for="vip-interface">Interface</label>
                            <input type="text" class="form-control mb-2" id="vip-interface"
                                   data-key="cluster.vip.interface"
                                   placeholder="automatic - the one with the default route">
                            <p class="text-body-secondary small mb-0" id="vip-note">
                                Whichever node is handing out leases holds this address, so the
                                clients only ever need to know it. The address is shared by the
                                whole cluster and travels to every node; the interface is this
                                node's own, and empty means the one holding the default route.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- The way out. Deliberately plain: the other nodes are told
                     first, so leaving does not leave an entry behind on every
                     one of them -->
                <div class="col-lg-4">
                    <div class="card border-danger h-100">
                        <div class="card-header"><h3 class="card-title">Leave the cluster</h3></div>
                        <div class="card-body d-flex flex-column">
                            <p class="text-body-secondary small">The other nodes are told to drop
                                this one, then clustering stops here and FTL restarts. The
                                configuration and the lists this node holds stay as they are, and
                                the shared secret is kept so it can be taken back in later.
                            </p>
                            <button class="btn btn-outline-danger mt-auto align-self-start"
                                    type="button" id="leave-go">
                                Leave the cluster
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    </div><!-- /.container-fluid -->
</div><!-- /.app-content -->

<script src="<?=pihole.fileversion('scripts/js/cluster.js')?>"></script>
<? mg.include('scripts/lua/footer.lp','r')?>
