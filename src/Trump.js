/******* Notes for Trump *******/
/*
	Currently has SAL.Template baked in.  Needs to be modular and take in any rendering library.
*/
/******* Notes for Trump *******/
(function () {
	var _trump = {};
	var _eventListeners = {};
	var _eventHandlers = {};
	var _delegateEventHandlers = {};
	var LOG_MESSAGE_PREFIX = "Trump Says:";
	var SETTINGS = {
		"eventPrefix": "trump",
		"renderFn": function () {}
	};

	//private functions
	function init(o) {
		log.trace(LOG_MESSAGE_PREFIX, "Initialised");
		o = o || {};

		var errorMessage = null;

		if (!SAL || !SAL.Template) {
			errorMessage = "Did not initialise as we require SAL.Template for now.";
		} else if (!diffDOM) {
			errorMessage = "Did not initialise as DiffDOM did not load.";
		}

		if (errorMessage) {
			log.error(LOG_MESSAGE_PREFIX, errorMessage);
			return false;
		}

		if (o.logLevel !== undefined) {
			log.setLevel(o.logLevel);
		}

		// if (!o.renderFn || typeof (o.renderFn) != "function") {
		// 	consoleError("Did not initialise as an invalid render function was provided.");
		// 	return false;
		// }

		return true;
	}
	function applyToDOM(mountElementID, templateID, templateData) {
		var errorMessage = null;

		if (!mountElementID) {
			errorMessage = "You must provide the element ID of the element you wish to mount the changes to.";
		} else if (!templateID) {
			errorMessage = "You must provide the ID of the template you are wanting to render.";
		} else if (!templateData) {
			templateData = {};
			log.warn(LOG_MESSAGE_PREFIX, "You haven't passed any data through for your template.");
		}

		if (errorMessage) {
			log.error(LOG_MESSAGE_PREFIX, errorMessage);
			return false;
		}

		var el = document.getElementById(mountElementID);
		var renderedTemplate = SAL.Template.render(templateID, templateData.data || {});
		var templateFrag = el.cloneNode();
		var dd = new diffDOM();

		templateFrag.innerHTML = renderedTemplate;
		applyEvents(templateFrag, templateData.eventHandlers, mountElementID);

		var difference = dd.diff(el, templateFrag);

		log.debug(LOG_MESSAGE_PREFIX, "Differences:", difference);
		dd.apply(el, difference);
		log.debug(LOG_MESSAGE_PREFIX, "Differences applied to DOM.");
		return true;
	}
	//event handlers
	function applyEvents(frag, eventHandlers, mountElementID) {
		var eventAttributeName = SETTINGS.eventPrefix + "-event";
		var elsThatNeedEventBinding = frag.querySelectorAll("[" + eventAttributeName + "]");
		var eventAttributeValueRegex = /\w+\:\w+/;

		eventHandlers = eventHandlers || {};
		log.debug(LOG_MESSAGE_PREFIX, "Elements found for event bindings", elsThatNeedEventBinding);

		for (var i = 0, l = elsThatNeedEventBinding.length; i < l; i++) {
			var el = elsThatNeedEventBinding[i];
			var eventAttributeValue = el.attributes[eventAttributeName].value;

			if (eventAttributeValueRegex.test(eventAttributeValue)) {
				var eventAttributeData = getEventAttributeData(eventAttributeValue);
				var foundEventHandler = eventHandlers[eventAttributeData.eventFnName];
				var eventUuid = null;

				if (foundEventHandler && typeof (foundEventHandler) == "function") {
					eventUuid = uuid();
					addEventHandler(eventUuid, eventAttributeData.eventType, foundEventHandler, mountElementID);
					el.setAttribute(eventAttributeName + "-uuid", eventUuid);
				} else {
					log.warn(LOG_MESSAGE_PREFIX, "Could not find event handler", eventAttributeData.eventFnName, "within event handlers that were passed in.");
				}
			} else {
				console.warn(LOG_MESSAGE_PREFIX, "The element doesn't have the correct syntax for event binding.  It must be formatted with the event type, colon, then name of function.  e.g. click:handler_click.", el);
			}

			el.removeAttribute(eventAttributeName);
		}
	}
	function getEventAttributeData(eventAttributeValue) {
		var eventAttributeValueDetails = eventAttributeValue.split(":");
		var eventFnType = eventAttributeValueDetails[0] || "";
		var eventFnName = eventAttributeValueDetails[1] || "";

		return { "eventType": eventFnType.trim().toLowerCase(), "eventFnName": eventFnName.trim() };
	}
	function addEventHandler(eventUuid, eventType, eventHandlerFn, mountElementID) {
		if (_eventHandlers[eventUuid]) {
			log.error(LOG_MESSAGE_PREFIX, "Another event handler with the same UUID was found, fatal failure.  Event did not bind.", eventUuid);
			return false;
		}

		setupDelegateEventHandler(mountElementID, eventType);
		_eventListeners[mountElementID] = _eventListeners[mountElementID] || {};
		_eventListeners[mountElementID][eventType] =  _eventListeners[mountElementID][eventType] || {};
		_eventListeners[mountElementID][eventType][eventUuid] = true;
		_eventHandlers[eventUuid] = eventHandlerFn;
		return true;
	}
	function setupDelegateEventHandler(mountElementID, eventType) {
		_delegateEventHandlers[mountElementID] = _delegateEventHandlers[mountElementID] || {};

		if (!_delegateEventHandlers[mountElementID][eventType]) {
			log.debug(LOG_MESSAGE_PREFIX, "No delegate event handler was found for element with ID", mountElementID, "and of type", eventType, "creating.");
			_delegateEventHandlers[mountElementID][eventType] = createEventListener(mountElementID, eventType);
		}
	}
	function createEventListener(mountElementID, eventType) {
		document.getElementById(mountElementID).addEventListener(eventType, function (e) {
			delegateEventHandler(e, eventType);
		});
		log.debug(LOG_MESSAGE_PREFIX, "Created delegate event handler for element with ID", mountElementID, "and of type", eventType);
		return true;
	}
	function delegateEventHandler(e, eventType) {
		var eventUuidAttributeName = SETTINGS.eventPrefix + "-event-uuid";
		var targetElement = e.target;
		var eventUuidAttribute = e.target.attributes[eventUuidAttributeName];

		log.debug(LOG_MESSAGE_PREFIX, "Delegate handler invoked.  Target:", targetElement, "Event Type:", eventType);

		if (eventUuidAttribute && eventUuidAttribute.value) {
			log.debug(LOG_MESSAGE_PREFIX, "Event handler found and invoked.", "Event Handler:", _eventHandlers[eventUuidAttribute.value]);
			_eventHandlers[eventUuidAttribute.value].call({}, [e]);
		}
	}

	//utility functions
	function overloadMethod(object, name, fn){
		var old = object[name];

		object[name] = function() {
			if (fn.length == arguments.length) {
				return fn.apply( this, arguments );
			} else if (typeof old == "function") {
				return old.apply( this, arguments );
			}
		};
	}
	function uuid() {
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
			var r = Math.random()*16|0, v = c == "x" ? r : (r&0x3|0x8);
			return v.toString(16);
		});
	}

	//public functions
	_trump.init = init;
	_trump.applyToDOM = applyToDOM;

	window.Trump = _trump;
})();