// Written by Phillip Moon
// 1.0.0.3 - PM - Applied apostrophe fix to templating engine

(function () {
	"use strict";
	var salTmpl = {};
	var cache = {};
	var DELIMITER = { "start": "<%", "end": "%>" };
	var _templates = {};

	//private functions
	function tmpl(str, data) {  // Simple JavaScript Templating || John Resig - http://ejohn.org/ - MIT Licensed
		// Figure out if we're getting a template, or if we need to
		// load the template - and be sure to cache the result.
		var fn = !/\W/.test(str) ?
		  cache[str] = cache[str] ||
			tmpl(document.getElementById(str).innerHTML) :

		// Generate a reusable function that will serve as a template
		// generator (and which will be cached).
		new Function("obj",
			"var p=[],print=function(){p.push.apply(p,arguments);};" +
			//PM - Added fix for issue where null obj throws an error
			"obj = obj || {};" +

			// Introduce the data as local variables using with(){}
			"with(obj){p.push('" +

			// Convert the template into pure JavaScript
			// Grabbed apostrophe fix from http://weblog.west-wind.com/posts/2008/Oct/13/Client-Templating-with-jQuery
			str
				.replace(/[\r\t\n]/g, " ")
				.replace(new RegExp("'(?=[^" + DELIMITER.end.substr(0, 1) + "]*" + DELIMITER.end + ")" ,"g"), "\t")
				.split("'").join("\\'")
				.split("\t").join("'")
				.replace(new RegExp(DELIMITER.start + "=(.+?)" + DELIMITER.end, "g"), "',$1,'")
				.split(DELIMITER.start).join("');")
				.split(DELIMITER.end).join("p.push('")
			+ "');}return p.join('');"
		);

		// Provide some basic currying to the user
		return data ? fn(data) : fn;
	}
	function render(str, data) {
		var result = null;

		if (_templates[str]) {
			result = tmpl(_templates[str], data);
		} else {
			result = tmpl(str, data);
		}

		if (typeof result === "function") {
			return result();
		}

		return result;
	}
	function stripHTML(rawHTML) {
		if (!rawHTML) {
			return "";
		}

		var cleanDiv = document.createElement("div");

		cleanDiv.innerHTML = rawHTML;
		return cleanDiv.innerText;
	}
	function escapeHTML(rawHTML) {
		if (!rawHTML) {
			return "";
		}

		return rawHTML
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}
	function setCustomDelimiters(startD, endD) {
		if (!startD || !endD) {
			return false;
		}

		DELIMITER.start = startD;
		DELIMITER.end = endD;
		return true;
	}
	function load(o, callbackFn) {
		var isArray = Object.prototype.toString.call(o) === "[object Array]";
		var loadArr = isArray ? o : [o];
		var loadArrLen = loadArr.length;
		var failArr = [];
		var failCount = 0;
		var ajaxRequests = {};
		var checkIfAllRequestsFinished = function () {
			if (!ajaxRequests) {
				return false;
			}

			for (var key in ajaxRequests) {
				var ajaxRequest = ajaxRequests[key];

				if (!ajaxRequest.success && !ajaxRequest.error) {
					return false;
				}
			}

			callbackFn(failCount, failArr);
			return true;
		};
		var loadFailed = function (failedLoadData) {
			failCount++;

			if (failedLoadData) {
				failArr.push(failedLoadData);
			}
		};

		callbackFn = callbackFn || function () { };

		for (var i = 0; i < loadArrLen; i++) {
			var loadData = loadArr[i];

			if (!loadData || !loadData.url || !loadData.id) {
				loadFailed(loadData);
				continue;
			}

			var ajaxID = guid();

			ajaxRequests[ajaxID] = { "success": false, "fail": false };

			(function (aID, currentLoadData) {
				$.ajax({
					"url": loadData.url,
					"dataType": "text",
					"type": "GET",
					"success": function (data) {
						ajaxRequests[aID].success = true;
						_templates[currentLoadData.id] = data;
					},
					"error": function () {
						ajaxRequests[aID].error = true;
						loadFailed(currentLoadData);
					},
					"complete": checkIfAllRequestsFinished
				});
			})(ajaxID, loadData);
		}

		return true;
	}
	//utility functions
	function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		}
		return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
	}

	//public functions
	salTmpl.render = render;
	salTmpl.load = load;
	salTmpl.escapeHTML = escapeHTML;
	salTmpl.stripHTML = stripHTML;
	salTmpl.setCustomDelimiters = setCustomDelimiters;

	//code
	window.SAL = window.SAL ? window.SAL : {};
	window.SAL.Template = window.SAL.Template ? window.SAL.Template : salTmpl;
})();