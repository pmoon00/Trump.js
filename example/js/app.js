(function () {
	var _app = window.app = {};

	//private functions
	function init() {
		console.log("App has initialised");
		Trump.init({ "logLevel": log.levels.TRACE });
		loadTemplates(mountToDom);
	}
	function loadTemplates(whenFinishedLoadingTemplates) {
		SAL.Template.load([
			{ "id": "testing", "url": "/example/templates/testing.tmpl" },
			{ "id": "testing1", "url": "/example/templates/testing.1.tmpl" }
		], whenFinishedLoadingTemplates);
	}
	function mountToDom(err) {
		if (err) {
			alert("Oh no the template(s) didn't load!");
			return false;
		}

		Trump.applyToDOM("mainBody", "testing", {
			"data": {
				"counterValue": 0
			},
			"eventHandlers": { 
				"wrapper_click": wrapper_click,
				"incrementMe_click": incrementMe_click,
				"incrementMe_mouseup": incrementMe_mouseup,
				"test_mouseover": test_mouseover
			}
		});
	}
	//event handlers
	function wrapper_click(e) {
		console.log("wrapper clicked", arguments, this);
	}
	function incrementMe_click(e) {
		Trump.applyToDOM("mainBody", "testing1", {
			"data": {
				"counterValue": 0
			},
			"eventHandlers": { 
				"wrapper_click": wrapper_click,
				"incrementMe_click": incrementMe_click,
				"test_mouseover": test_mouseover
			}
		});
		console.log("increment me clicked", arguments, this);
		return false; //stop propagation
	}
	function incrementMe_mouseup(e) {
		console.log("increment me mouseup", arguments, this);
	}
	function test_mouseover(e) {
		console.log("test mouse over", arguments, this);
	}

	//public functions
	_app.init = init;
})();