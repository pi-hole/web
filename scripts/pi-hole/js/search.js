/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false */

function eventsource(partial) {
  const ta = $("#output");
  // process with the current visible domain input field
  const q = $("input[id^='domain']:visible").val().trim().toLowerCase();
  const N = $("#number").val();

  if (q.length === 0) {
    return;
  }

  var verb = partial ? "partially" : "exactly";

  $.ajax({
    method: "GET",
    url: "/api/search/" + encodeURIComponent(q),
    async: false,
    data: {
      partial: partial,
      N: N,
    },
  })
    .done(function (data) {
      ta.empty();
      ta.show();

      const res = data.search;
      var result = "";
      const numDomains = res.domains.length;
      result =
        "Found " +
        numDomains +
        " domain" +
        (numDomains !== 1 ? "s" : "") +
        " <em>" +
        verb +
        "</em> matching '<strong class='text-blue'>" +
        utils.escapeHtml(q) +
        "</strong>'" +
        (numDomains > 0 ? ":" : ".") +
        "<br><br>";
      for (const domain of res.domains) {
        result +=
          "  - <a href='groups-domains.lp?domainid=" +
          domain.id +
          "' target='_blank'><strong class='text-green'>" +
          utils.escapeHtml(domain.domain) +
          "</strong></a><br>    " +
          domain.kind +
          " " +
          domain.type +
          " domain<br>    added:         " +
          utils.renderTimestamp(domain.date_added, "display") +
          "<br>    last modified: " +
          utils.renderTimestamp(domain.date_modified, "display") +
          "<br>    " +
          (domain.enabled ? "enabled" : "disabled") +
          ", used in " +
          domain.groups.length +
          " group" +
          (domain.groups.length === 1 ? "" : "s") +
          (domain.comment !== null && domain.comment.length > 0
            ? '<br>    comment: "' + utils.escapeHtml(domain.comment) + '"'
            : "<br>    no comment") +
          "<br><br>";
      }

      // Group results in res.gravity by res.gravity[].address
      var grouped = {};
      for (const adlist of res.gravity) {
        if (grouped[adlist.address] === undefined) {
          grouped[adlist.address] = [];
        }

        grouped[adlist.address].push(adlist);
      }

      const numAdlists = Object.keys(grouped).length;

      result +=
        "Found " +
        numAdlists +
        " adlist" +
        (numAdlists !== 1 ? "s" : "") +
        " <em>" +
        verb +
        "</em> matching '<strong class='text-blue'>" +
        utils.escapeHtml(q) +
        "</strong>'" +
        (numAdlists > 0 ? ":" : ".") +
        "<br><br>";
      for (const address of Object.keys(grouped)) {
        const adlist = grouped[address][0];
        result +=
          "  - <a href='groups-adlists.lp?adlistid=" +
          adlist.id +
          "' target='_blank'>" +
          utils.escapeHtml(address) +
          "</a><br>    added:         " +
          utils.renderTimestamp(adlist.date_added, "display") +
          "<br>    last modified: " +
          utils.renderTimestamp(adlist.date_modified, "display") +
          "<br>    last updated:  " +
          utils.renderTimestamp(adlist.date_updated, "display") +
          " (" +
          adlist.number.toLocaleString() +
          " domains)" +
          "<br>    " +
          (adlist.enabled ? "enabled" : "disabled") +
          ", used in " +
          adlist.groups.length +
          " group" +
          (adlist.groups.length === 1 ? "" : "s") +
          (adlist.comment !== null && adlist.comment.length > 0
            ? '<br>    comment: "' + utils.escapeHtml(adlist.comment) + '"'
            : "<br>    no comment") +
          "<br>";
        for (const adlists of grouped[address]) {
          result +=
            "    - <strong class='text-green'>" +
            utils.escapeHtml(adlists.domain) +
            "</strong><br>";
        }

        result += "<br>";
      }

      result += "Search took " + (1000 * data.took).toFixed(1) + " ms";

      ta.append(result);
    })
    .fail(function (data) {
      apiFailure(data);
    });
}

// Handle enter key
$("#domain").on("keypress", function (e) {
  if (e.which === 13) {
    // Enter was pressed, and the input has focus
    eventsource(false);
  }
});

// Handle search buttons
$("button[id^='btnSearch']").on("click", function () {
  var partial = false;

  if (!this.id.match("^btnSearchExact")) {
    partial = true;
  }

  eventsource(partial);
});
