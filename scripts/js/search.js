/* Pi-hole: A black hole for Internet advertisements
 *  (c) 2017 Pi-hole, LLC (https://pi-hole.net)
 *  Network-wide ad blocking via your own hardware.
 *
 *  This file is copyright under the latest version of the EUPL.
 *  Please see LICENSE file for your rights under this license. */

/* global utils */

"use strict";

const domainInputField = document.getElementById("domain");
const maxResultsInputField = document.getElementById("number");
const searchButton = document.getElementById("btnSearch");

document.addEventListener("DOMContentLoaded", () => {
  const queryParams = utils.parseQueryString();

  if (Object.hasOwn(queryParams, "domain") && queryParams.domain !== undefined) {
    domainInputField.value = queryParams.domain;
  }

  if (Object.hasOwn(queryParams, "N") && queryParams.N !== undefined) {
    maxResultsInputField.value = queryParams.N;
  }

  utils.disableAutocorrect();
});

function doSearch() {
  const searchQuery = domainInputField.value.trim().toLowerCase();
  if (searchQuery.length === 0) return;

  const partialMatchCheckbox = document.getElementById("partialMatch");
  const isPartialMatch = partialMatchCheckbox.checked;
  const maxResults = utils.escapeHtml(maxResultsInputField.value);
  const outputElement = document.getElementById("output");

  if (outputElement.innerHTML.length > 0) {
    outputElement.innerHTML = "";
  }

  if (!outputElement.classList.contains("d-none")) {
    outputElement.classList.add("d-none");
  }

  const url = `${document.body.dataset.apiurl}/search/${encodeURIComponent(searchQuery)}?partial=${isPartialMatch}&N=${maxResults}`;
  utils.fetchFactory(url).then(({ search }) => {
    const domains = search.domains;
    const totalDomains = domains.length;
    const matchType = isPartialMatch ? "partially" : "exactly";

    const groupedGravityResults = groupGravityResults(search.gravity);
    const totalLists = Object.keys(groupedGravityResults).length;

    let resultHtml = generateDomainResults(domains, searchQuery, totalDomains, matchType);
    resultHtml += generateListResults(groupedGravityResults, searchQuery, totalLists, matchType);
    resultHtml += generateSummary(search);
    resultHtml += generateNoteMessage(search, maxResults);

    outputElement.innerHTML = resultHtml;
    outputElement.classList.remove("d-none");
  });
}

function generateDomainResults(domains, searchQuery, totalDomains, matchType) {
  let resultHtml =
    `Found ${totalDomains} ${utils.pluralize(totalDomains, "domain")} <em>${matchType}</em> matching ` +
    `'<strong class="text-blue">${utils.escapeHtml(searchQuery)}</strong>'${totalDomains > 0 ? ":" : "."}<br><br>`;

  for (const domain of domains) {
    const domainClass = domain.type === "deny" ? "text-red" : "text-green";
    const addedDate = utils.renderTimestamp(domain.date_added, "display");
    const modifiedDate = utils.renderTimestamp(domain.date_modified, "display");
    const domainStatus = domain.enabled ? "enabled" : "disabled";
    const totalGroups = domain.groups.length;
    const groupLabel = utils.pluralize(totalGroups, "group");
    const commentHtml =
      domain.comment?.length > 0 ? `<br>  comment: ${utils.escapeHtml(domain.comment)}` : "";

    resultHtml +=
      `- <a href="groups-domains?domainid=${domain.id}" target="_blank">` +
      `<strong class="text-blue">${utils.escapeHtml(domain.domain)}</strong></a><br>` +
      `  <strong class="${domainClass}">${domain.kind} ${domain.type} domain</strong><br>` +
      `  added:         ${addedDate}<br>` +
      `  last modified: ${modifiedDate}<br>` +
      `  ${domainStatus}, used in ${totalGroups} ${groupLabel}${commentHtml}<br><br>`;
  }

  return resultHtml;
}

function groupGravityResults(gravityResults) {
  const groupedResults = {};
  for (const list of gravityResults) {
    const groupKey = `${list.address}_${list.type}`;
    groupedResults[groupKey] ||= [];
    groupedResults[groupKey].push(list);
  }

  return groupedResults;
}

function generateListResults(groupedResults, searchQuery, totalLists, matchType) {
  let resultHtml =
    `Found ${totalLists} ${utils.pluralize(totalLists, "list")} <em>${matchType}</em> matching ` +
    `'<strong class="text-blue">${utils.escapeHtml(searchQuery)}</strong>'${totalLists > 0 ? ":" : "."}<br><br>`;

  for (const group of Object.values(groupedResults)) {
    const list = group[0];
    const listClass = list.type === "block" ? "text-red" : "text-green";
    const addedDate = utils.renderTimestamp(list.date_added, "display");
    const modifiedDate = utils.renderTimestamp(list.date_modified, "display");
    const updatedDate = utils.renderTimestamp(list.date_updated, "display");
    const listStatus = list.enabled ? "enabled" : "disabled";
    const totalGroups = list.groups.length;
    const groupLabel = utils.pluralize(totalGroups, "group");
    const commentHtml =
      list.comment?.length > 0 ? `<br>  comment: ${utils.escapeHtml(list.comment)}` : "";

    resultHtml +=
      `- <a href="groups-lists?listid=${list.id}" target="_blank">` +
      `${utils.escapeHtml(list.address)}</a><br>` +
      `  <strong class="${listClass}">${list.type} list</strong><br>` +
      `  added:         ${addedDate}<br>` +
      `  last modified: ${modifiedDate}<br>` +
      `  last updated:  ${updatedDate} (${utils.formatNumber(list.number)} domains)<br>` +
      `  ${listStatus}, used in ${totalGroups} ${groupLabel}${commentHtml}<br>` +
      `  matching entries:<br>`;

    for (const { domain } of group) {
      resultHtml += `    - <strong class="text-blue">${utils.escapeHtml(domain)}</strong><br>`;
    }

    resultHtml += "<br>";
  }

  return resultHtml;
}

function generateSummary({ results }) {
  const {
    gravity: { allow, block },
    domains: { exact, regex },
  } = results;

  return (
    "Number of results per type:<br>" +
    `  - <strong class="text-blue">${exact}</strong> exact domain matches<br>` +
    `  - <strong class="text-blue">${regex}</strong> regex domain matches<br>` +
    `  - <strong class="text-blue">${allow}</strong> allowlist (antigravity) matches<br>` +
    `  - <strong class="text-blue">${block}</strong> blocklist (gravity) matches<br>`
  );
}

function generateNoteMessage({ results }, maxResults) {
  const {
    gravity: { allow, block },
    domains: { exact, regex },
  } = results;

  const shouldShowNoteMessage = [allow, block, exact, regex].some(count => count > maxResults);
  if (!shouldShowNoteMessage) return "";

  return (
    '<br><br><strong class="text-green">Note:</strong> ' +
    `The number of results to return per type is limited to ${maxResults} entries.<br>` +
    `There are ${results.total} matching entries in total.<br>` +
    "Consider using a more specific search term or increase N.<br>"
  );
}

// Handle enter key
domainInputField.addEventListener("keypress", event => {
  if (event.key === "Enter") {
    doSearch();
  }
});

// Handle search button click
searchButton.addEventListener("click", () => {
  doSearch();
});
