(function () {
	var _app = window.app = {};
	var _objContext = null;
	var _state = {
		"disabled": false
	};
	var _currentMouseDownImage = null;

	//private functions
	function init() {
		console.log("App has initialised");
		Trump.init({ "logLevel": log.levels.DEBUG });
		loadTemplates(mountToDom);
	}
	function loadTemplates(whenFinishedLoadingTemplates) {
		SAL.Template.load([
			{ "id": "tmplMain", "url": "templates/main.tmpl" },
			{ "id": "tmplImageControl", "url": "templates/imageControl.tmpl" }
		], whenFinishedLoadingTemplates);
	}
	function mountToDom(err) {
		if (err) {
			alert("Oh no the template(s) didn't load!");
			return false;
		}

		_objectContext = Trump.applyToDOM("mainBody", "tmplMain", {
			"data": _state,
			"eventHandlers": { 
				"btnAddImage_click": btnAddImage_click,
				"txtUrl_keypress": txtUrl_keypress,
				"imageControl_mousedown": imageControl_mousedown,
				"imageControl_mouseup": imageControl_mouseup,
				"imageControl_mousemove": imageControl_mousemove
			}
		});
	}
	//event handlers
	function txtUrl_keypress(e) {
		if (e.keyCode == 13) {
			getUrlAndCheckForValidImage(this.update);
		}
	}
	function btnAddImage_click(e) {
		getUrlAndCheckForValidImage(this.update);
	}
	function imageControl_mousedown(e) {
		var imageID = (this.attributes["image-id"] || {}).value;

		if (!_state.pictures[imageID]) {
			return false;
		}

		var elImageWrapper = document.querySelector(".image-wrapper[image-id='" + imageID + "']");

		_currentMouseDownImage = {
			"imageID": imageID,
			"elImageWrapper": elImageWrapper,
			"origX": e.clientX,
			"origY": e.clientY
		};
		updateImage(imageID, {
			"x": e.clientX - elImageWrapper.offsetLeft,
			"y": e.clientY - elImageWrapper.offsetTop,
			"width": e.clientX - _currentMouseDownImage.origX,
			"height": e.clientY - _currentMouseDownImage.origY
		});
		this.update({ "data": _state });
		e.preventDefault();
	}
	function imageControl_mouseup(e) {
		_currentMouseDownImage = null;
	}
	function imageControl_mousemove(e) {
		if (!_currentMouseDownImage) {
			return;
		}

		updateImage(_currentMouseDownImage.imageID, {
			"width": e.clientX - _currentMouseDownImage.origX,
			"height": e.clientY - _currentMouseDownImage.origY
		});
		this.update({ "data": _state });
	}
	//image functions
	function getUrlAndCheckForValidImage(updateFn) {
		var elImageUrl = document.getElementById("txtUrl");
		var imageUrl = elImageUrl.value.trim();

		console.log(elImageUrl.value);

		if (!imageUrl) {
			return false;
		}

		disableInput();
		isValidImage(imageUrl, null, function (imageUrl, status) {
			console.log(imageUrl, status);
			disableInput(true);

			if (status != "success") {
				return false;
			}

			addImageControl(imageUrl);
		});
	}
	function isValidImage(imageUrl, timeout, callback) {
		timeout = timeout || 5000;

		var timedOut = false, timer;
		var img = new Image();

		img.onerror = img.onabort = function() {
			if (!timedOut) {
				clearTimeout(timer);
				callback(imageUrl, "error");
			}
		};
		img.onload = function() {
			if (!timedOut) {
				clearTimeout(timer);
				callback(imageUrl, "success");
			}
		};
		img.src = imageUrl;
		timer = setTimeout(function() {
			timedOut = true;
			// reset .src to invalid URL so it stops previous
			// loading, but doesn't trigger new load
			img.src = "//!!!!/test.jpg";
			callback(imageUrl, "timeout");
		}, timeout); 
	}
	function addImageControl(imageUrl) {
		_state.pictures = _state.pictures || {};
		
		var imageUrlHash = imageUrl.hashCode();

		if (_state.pictures[imageUrlHash]) {
			return false;
		}

		_state.pictures[imageUrlHash] = {
			"url": imageUrl,
			"name": imageUrl.substr(imageUrl.lastIndexOf("/") + 1),
			"boxMask": {
				"x": 0,
				"y": 0,
				"width": 0,
				"height": 0,
				"startX": 0,
				"startY": 0
			}
		};
		_objectContext.update({ "data": _state });
	}
	function updateImage(imageID, o) {
		if (!_state.pictures[imageID] || !o) {
			return false;
		}

		for (var key in o) {
			switch (key) {
				case "x":
				case "y":
					_state.pictures[imageID].boxMask[key] = o[key];
					break;
				case "width":
					var prop = "x";
					
					if (o[key] < 0) {
						_state.pictures[imageID].boxMask.startX = _state.pictures[imageID].boxMask.x + o[key];
					} else {
						_state.pictures[imageID].boxMask.startX = _state.pictures[imageID].boxMask.x;
					}

					_state.pictures[imageID].boxMask.width = Math.abs(o[key]);
					break;
				case "height":
					if (o[key] < 0) {
						_state.pictures[imageID].boxMask.startY = _state.pictures[imageID].boxMask.y + o[key];
					} else {
						_state.pictures[imageID].boxMask.startY = _state.pictures[imageID].boxMask.y;
					}

					_state.pictures[imageID].boxMask.height = Math.abs(o[key]);
					break;
			}

		}
	}
	//input control
	function disableInput(enable) {
		_state.disabled = !!!enable;
		_objectContext.update({ "data": _state });
	}
	//utility functions
	function uuid() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}
	String.prototype.hashCode = function() {
		var hash = 0, i, chr, len;
		
		if (this.length === 0) return hash;

		for (i = 0, len = this.length; i < len; i++) {
			chr   = this.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32bit integer
		}

		return hash;
	};

	//public functions
	_app.init = init;
})();