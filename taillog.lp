<? --[[
*    Pi-hole: A black hole for Internet advertisements
*    (c) 2017 Pi-hole, LLC (https://pi-hole.net)
*    Network-wide ad blocking via your own hardware.
*
*    This file is copyright under the latest version of the EUPL.
*    Please see LICENSE file for your rights under this license.
*/ ]]--

mg.include('scripts/lua/header_authenticated.lp','r')
?>
<!-- Title/Header -->
<div class="app-content-header">
    <div class="container-fluid">
        <div class="row">
            <div class="col-12">
                <h1 class="mb-0">Tail Log</h1>
            </div>
        </div>
    </div>
</div>

<div class="app-content">
    <div class="container-fluid">

    <div class="row">
        <div class="col-md-12">
            <div class="card card-warning card-outline">
                <div
                    class="card-header"
                    style="display: flex; align-items: center; flex-wrap: nowrap;"
                >
                    <h3
                        class="card-title"
                        style="
                            margin: 0;
                            min-width: 0;
                            flex: 1 1 auto;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        "
                    >
                        <code>tail -F <span id="filename">...</span></code>
                    </h3>

                    <div
                        style="
                            display: flex;
                            align-items: center;
                            flex-wrap: nowrap;
                            flex-shrink: 0;
                            margin-left: auto;
                            white-space: nowrap;
                            gap: 0.5rem;
                        "
                    >
                        <span style="white-space: nowrap;">
                            Autoscroll:&nbsp;<i
                                class="fa fa-fw fa-check"
                                id="autoscrolling"
                            ></i>
                        </span>

                        <button
                            type="button"
                            class="btn btn-success"
                            id="live-feed"
                            style="flex-shrink: 0;"
                        >
                            <span id="title">Live</span>&nbsp;&nbsp;
                            <i
                                id="feed-icon"
                                class="fa-solid fa-fw fa-play fa-fade"
                            ></i>
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary d-none"
                            id="export-queries"
                            style="flex-shrink: 0;"
                        >
                            Export queries
                        </button>
                    </div>
                </div>

                <div class="card-body">
                    <div class="row">
                        <div class="col-md-12">
                            <pre id="output" class="pre pre-scrollable pre-taillog"></pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    </div><!-- /.container-fluid -->
</div><!-- /.app-content -->

<div
    class="modal fade"
    id="export-queries-modal"
    tabindex="-1"
    aria-labelledby="export-queries-modal-label"
    aria-hidden="true"
>
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5
                    class="modal-title"
                    id="export-queries-modal-label"
                >
                    Export queries
                </h5>

                <button
                    type="button"
                    class="btn-close"
                    id="export-modal-close"
                    aria-label="Close"
                ></button>
            </div>

            <div class="modal-body">
                <h6>Date range</h6>

                <div class="row mb-4">
                    <div class="col-md-6">
                        <label
                            for="export-from"
                            class="form-label"
                        >
                            From
                        </label>

                        <input
                            type="datetime-local"
                            class="form-control"
                            id="export-from"
                        >
                    </div>

                    <div class="col-md-6">
                        <label
                            for="export-until"
                            class="form-label"
                        >
                            Until
                        </label>

                        <input
                            type="datetime-local"
                            class="form-control"
                            id="export-until"
                        >
                    </div>
                </div>

                <h6>Columns</h6>

                <div class="row mb-4">
                    <div class="col-md-4">
                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="timestamp"
                                id="export-column-timestamp"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-timestamp"
                            >
                                Timestamp
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="domain"
                                id="export-column-domain"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-domain"
                            >
                                Domain
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="type"
                                id="export-column-type"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-type"
                            >
                                Type
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="status"
                                id="export-column-status"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-status"
                            >
                                Status
                            </label>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="client_ip"
                                id="export-column-client-ip"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-client-ip"
                            >
                                Client IP
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="client_name"
                                id="export-column-client-name"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-client-name"
                            >
                                Client name
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="reply"
                                id="export-column-reply"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-reply"
                            >
                                Reply
                            </label>
                        </div>
                    </div>

                    <div class="col-md-4">
                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="reply_time"
                                id="export-column-reply-time"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-reply-time"
                            >
                                Reply time
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="dnssec"
                                id="export-column-dnssec"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-dnssec"
                            >
                                DNSSEC
                            </label>
                        </div>

                        <div class="form-check">
                            <input
                                class="form-check-input export-column"
                                type="checkbox"
                                value="upstream"
                                id="export-column-upstream"
                                checked
                            >
                            <label
                                class="form-check-label"
                                for="export-column-upstream"
                            >
                                Upstream
                            </label>
                        </div>
                    </div>
                </div>

                <h6>Options</h6>

                <div class="form-check">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        id="export-remove-duplicates"
                    >
                    <label
                        class="form-check-label"
                        for="export-remove-duplicates"
                    >
                        Remove duplicate queries
                    </label>
                </div>

                <div class="form-text">
                    Duplicate queries are identified by domain and query type. The most recent query is kept.
                </div>

                <div
                    class="alert alert-danger mt-3 d-none"
                    id="export-error"
                    role="alert"
                ></div>
            </div>

            <div class="modal-footer">
                <button
                    type="button"
                    class="btn btn-secondary"
                    id="export-modal-cancel"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="btn btn-primary"
                    id="export-confirm"
                >
                    Export
                </button>
            </div>
        </div>
    </div>
</div>

<script src="<?=pihole.fileversion('scripts/js/taillog.js')?>"></script>

<? mg.include('scripts/lua/footer.lp','r')?>
