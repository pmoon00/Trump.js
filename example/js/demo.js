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
				"textInput_focus": textInput_focus,
				"textInput_click": textInput_click,
				"textInput_keyup": textInput_keyup,
				"textInput_mouseover": textInput_mouseover,
				"label_click": label_click
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
	function textInput_click(e) {
		console.log("textInput_click fired", e);
		return false;
	}
	function textInput_keyup(e) {
		console.log("textInput_keyup fired", e);
		this.update({ "data": { "textInputValue": document.getElementById("txtInput").value } });
		return false;
	}
	function textInput_mouseover(e) {
		console.log("textInput_mouseover fired", e);
	}
	function label_click(e) {
		console.log("label_click fired", e);
	}

	//public functions
	_app.init = init;
})();