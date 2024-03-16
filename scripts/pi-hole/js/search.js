/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils:false, apiFailure:false */
var GETDict = {};

$(function () {
  GETDict = utils.parseQueryString();
  if (GETDict.domain !== undefined) {
    $("input[id^='domain']").val(GETDict.domain);
  }

  if (GETDict.N !== undefined) {
    $("#number").val(GETDict.number);
  }
});

function doSearch() {
  const ta = $("#output");
  // process with the current visible domain input field
  const q = $("input[id^='domain']:visible").val().trim().toLowerCase();
  const N = $("#number").val();
  // Partial matching?
  const partial = $("#partialMatch").is(":checked");

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
        const color = domain.type === "deny" ? "red" : "green";
        result +=
          "  - <a href='groups-domains.lp?domainid=" +
          domain.id +
          "' target='_blank'><strong>" +
          utils.escapeHtml(domain.domain) +
          "</strong></a><br>    <strong class='text-" +
          color +
          "'>" +
          domain.kind +
          " " +
          domain.type +
          " domain</strong><br>    added:         " +
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
      for (const list of res.gravity) {
        if (grouped[list.address + "_" + list.type] === undefined) {
          grouped[list.address + "_" + list.type] = [];
        }

        grouped[list.address + "_" + list.type].push(list);
      }

      const numLists = Object.keys(grouped).length;

      result +=
        "Found " +
        numLists +
        " list" +
        (numLists !== 1 ? "s" : "") +
        " <em>" +
        verb +
        "</em> matching '<strong class='text-blue'>" +
        utils.escapeHtml(q) +
        "</strong>'" +
        (numLists > 0 ? ":" : ".") +
        "<br><br>";
      for (const listId of Object.keys(grouped)) {
        const list = grouped[listId][0];
        const color = list.type === "block" ? "red" : "green";
        result +=
          "  - <a href='groups-lists.lp?listid=" +
          list.id +
          "' target='_blank'>" +
          utils.escapeHtml(list.address) +
          "</a><br>    <strong class='text-" +
          color +
          "'>" +
          list.type +
          " list</strong>" +
          "<br>    added:         " +
          utils.renderTimestamp(list.date_added, "display") +
          "<br>    last modified: " +
          utils.renderTimestamp(list.date_modified, "display") +
          "<br>    last updated:  " +
          utils.renderTimestamp(list.date_updated, "display") +
          " (" +
          list.number.toLocaleString() +
          " domains)" +
          "<br>    " +
          (list.enabled ? "enabled" : "disabled") +
          ", used in " +
          list.groups.length +
          " group" +
          (list.groups.length === 1 ? "" : "s") +
          (list.comment !== null && list.comment.length > 0
            ? '<br>    comment: "' + utils.escapeHtml(list.comment) + '"'
            : "<br>    no comment") +
          "<br>    matching entries:<br>";
        for (const lists of grouped[listId]) {
          result +=
            "    - <strong class='text-blue'>" + utils.escapeHtml(lists.domain) + "</strong><br>";
        }

        result += "<br>";
      }

      result += "Number of results per type:<br>";
      result +=
        "  - <strong class='text-blue'>" +
        data.search.results.domains.exact +
        "</strong> exact domain matches<br>";
      result +=
        "  - <strong class='text-blue'>" +
        data.search.results.domains.regex +
        "</strong> regex domain matches<br>";
      result +=
        "  - <strong class='text-blue'>" +
        data.search.results.gravity.allow +
        "</strong> allowlist (antigravity) matches<br>";
      result +=
        "  - <strong class='text-blue'>" +
        data.search.results.gravity.block +
        "</strong> blocklist (gravity) matches<br>";

      if (
        data.search.results.gravity.allow > data.search.parameters.N ||
        data.search.results.gravity.block > data.search.parameters.N ||
        data.search.results.domains.exact > data.search.parameters.N ||
        data.search.results.domains.regex > data.search.parameters.N
      ) {
        result +=
          "<br><br><strong class='text-green'>Note:</strong> " +
          "The number of results to return per type is limited to " +
          data.search.parameters.N +
          " entries.<br>      There are " +
          data.search.results.total +
          " matching entries in total.<br>      Consider " +
          "using a more specific search term or increase N.<br>";
      }

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
    doSearch();
  }
});

// Handle search buttons
$("button[id='btnSearch']").on("click", function () {
  doSearch();
});
