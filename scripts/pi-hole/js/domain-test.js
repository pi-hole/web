"use strict";

var blockedUrls = ['google.com',
	'amazon.com',
	'mobile.pipe.aria.microsoft.com',
	'app-measurement.com',
	'googleads.g.doubleclick.net',
	'telemetry.sdk.inmobi.com',
	'www.googletagmanager.com',
	'www.google-analytics.com'
];

/**
 *
 *
 * @param {string} url
 * @return {results} 
 */
const testUrl = async (url) => {
	return new Promise(async (resolve, reject) => {

		var testResults = {
			blocked: false,
			resultText: "allowed"
		};
		/*
		set mode no-cors because fetch fails only on the following occasions
		1. Network failure ex. dns responded ip is 0.0.0.0 / empty or no internet access
		2. Because of cors
		this way we ensure that we will only catch net exceptions. 
		there is no native way for js to perform dns lookup from a browser window
		*/
		await fetch(url, { mode: 'no-cors' })
			.catch(e => {
				testResults.blocked = true;
				testResults.resultText = "blocked";
				resolve(testResults);
			})
		resolve(testResults);
	});
}

const startDomainTest = async () => {
	const tableId = 'test-domains-results';
	clearTable(tableId);
	var overlay = document.getElementById('overlay');
	overlay.className = 'overlay';
	evenRow = true;
	//show hidden table
	var resultsRow = document.getElementById('results-table');
	resultsRow.className = "row";
	for (const blockedUrl of blockedUrls) {

		var url = `https://${blockedUrl}`;
		var results = await testUrl(url);

		//returns class text for blocked allowed and odd even row.
		var setClass = classSelector(evenRow, results.blocked);
		//create table rows and insert results. 
		let tableRef = document.getElementById('test-domains-results');
		let newRow = tableRef.insertRow(-1);
		let newCell = newRow.insertCell(0);
		/*
		Set class as odd or even and blocked or allowed for consistent look with the rest of the admin pages. 
		Add 'results-row' class for easy deletion of results if test button is used again
		*/
		newRow.className = `${setClass} +  results-row`
		let newText = document.createTextNode(blockedUrl);
		newCell.appendChild(newText);
		newCell = newRow.insertCell(1);
		newText = document.createTextNode(results.resultText);
		newCell.appendChild(newText);
		//flip evenRow for next iteration
		evenRow = !evenRow
	}
	overlay.className = 'overlay hidden';
}


const clearTable = () => {
	//Convert htmlCollection to array so we iterate with forEach. 
	var resultsRowArray = Array.from(document.getElementsByClassName('results-row'));
	if (resultsRowArray.length > 0) {
		resultsRowArray.forEach(element => {
			element.remove()
		});
	}
}

/**
 *
 *
 * @param {boolean} evenRow true if even false if odd
 * @param {boolean} result true if allowed false if blocked
 * @return {string} class name
 */
const classSelector = (evenRow, result) => {
	if (evenRow && result) {
		return "even blocked-row";
	} else if (!evenRow && result) {
		return ("odd blocked-row");
	} else if (evenRow && !result) {
		return ("even allowed-row");
	} else if (!evenRow && !result) {
		return ("odd allowed-row");
	}

}
