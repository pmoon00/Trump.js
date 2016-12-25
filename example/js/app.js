(function () {
	var _app = window.app = {};

	//private functions
	function init() {
		console.log("App has initialised");
		Trump.init({ "logLevel": log.levels.TRACE });
		loadTemplates(mountToDom);
	}
	function loadTemplates(whenFinishedLoadingTemplates) {
		SAL.Template.load({ "id": "testing", "url": "/example/templates/testing.tmpl" }, whenFinishedLoadingTemplates);
	}
	function mountToDom(err) {
		if (err) {
			alert("Oh no the template(s) didn't load!");
			return false;
		}

		Trump.applyToDOM("mainBody", "testing", {
			"eventHandlers": { 
				"incrementMe_click": incrementMe_click,
				"test_mouseover": test_mouseover
			}
		});
	}
	//event handlers
	function incrementMe_click(e) {
		console.log("increment me clicked", arguments, this);
	}
	function test_mouseover(e) {
		console.log("test mouse over", arguments, this);
	}

	//public functions
	_app.init = init;
})();