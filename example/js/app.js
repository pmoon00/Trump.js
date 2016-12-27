(function () {
	var _app = window.app = {};
	var _counterValue = 0;
	var _isLargeCounter = false;
	var _objContext = null;

	//private functions
	function init() {
		console.log("App has initialised");
		Trump.init({ "logLevel": log.levels.TRACE });
		loadTemplates(mountToDom);
	}
	function loadTemplates(whenFinishedLoadingTemplates) {
		SAL.Template.load([
			{ "id": "testing", "url": "templates/testing.tmpl" },
			{ "id": "testing1", "url": "templates/testing.1.tmpl" }
		], whenFinishedLoadingTemplates);
	}
	function mountToDom(err) {
		if (err) {
			alert("Oh no the template(s) didn't load!");
			return false;
		}

		_objectContext = Trump.applyToDOM("mainBody", "testing", {
			"data": {
				"counterValue": _counterValue
			},
			"eventHandlers": { 
				"wrapper_click": wrapper_click,
				"incrementMe_click": incrementMe_click,
				"incrementMe_mouseup": incrementMe_mouseup,
				"test_mouseover": test_mouseover,
				"incrementMe_usingEventContext_click": incrementMe_usingEventContext_click,
				"changeTemplate_click": changeTemplate_click
			}
		});
	}
	//event handlers
	function wrapper_click(e) {
		console.log("wrapper clicked", arguments, this);
	}
	function incrementMe_click(e) {
		_isLargeCounter = !_isLargeCounter;
		_objectContext.update({ "data": { "counterValue": ++_counterValue, "isLargeCounter": _isLargeCounter } });
	}
	function incrementMe_mouseup(e) {
		console.log("increment me mouseup", arguments, this);
	}
	function test_mouseover(e) {
		console.log("test mouse over", arguments, this);
	}
	function incrementMe_usingEventContext_click(e) {
		_isLargeCounter = !_isLargeCounter;
		this.update({ "data": { "counterValue": ++_counterValue, "isLargeCounter": _isLargeCounter } });
		console.log("incrementMe_usingEventContext_click", arguments, this);
	}
	function changeTemplate_click(e) {
		_objectContext = Trump.applyToDOM("mainBody", "testing1", {
			"data": {
				"counterValue": ++_counterValue
			},
			"eventHandlers": { 
				"wrapper_click": wrapper_click,
				"incrementMe_click": incrementMe_click,
				"test_mouseover": test_mouseover
			}
		});
		console.log("changeTemplate_click clicked", arguments, this);
		return false; //stop propagation
	}

	//public functions
	_app.init = init;
})();