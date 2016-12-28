(function () {
	var _app = window.app = {};
	var _objContext = null;

	//private functions
	function init() {
		console.log("App has initialised");
		Trump.init({ "logLevel": log.levels.TRACE });
		loadTemplates(mountToDom);
	}
	function loadTemplates(whenFinishedLoadingTemplates) {
		SAL.Template.load([
			{ "id": "tmplDemo", "url": "templates/demo.tmpl" }
		], whenFinishedLoadingTemplates);
	}
	function mountToDom(err) {
		if (err) {
			alert("Oh no the template(s) didn't load!");
			return false;
		}

		_objectContext = Trump.applyToDOM("mainBody", "tmplDemo", {
			"data": {
			},
			"eventHandlers": {
				"textInput_blur": textInput_blur,
				"textInput_focus": textInput_focus
			}
		});
	}
	//event handlers
	function textInput_blur(e) {
		console.log("textInput_blur fired", e);
		console.log("input value", e.target.value);
	}
	function textInput_focus(e) {
		console.log("textInput_focus fired", e);
	}

	//public functions
	_app.init = init;
})();