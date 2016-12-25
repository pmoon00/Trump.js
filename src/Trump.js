/******* Notes for Trump *******/
/*
	- Currently has SAL.Template baked in.  Needs to be modular and take in any rendering library.
	- Return false from event functions to stop propagation.

	TODO:
	- Maybe only mount delegate event handler to document level instead of mounting element.
*/
/******* Notes for Trump *******/
(function () {
	var _trump = {};
	var _eventHandlers = {};
	var _delegateEventHandlerTypes = {};
	var _mountedElementData = {};
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
		applyEvents(templateFrag, templateData.eventHandlers);

		var difference = dd.diff(el, templateFrag);

		cleanEventsFromDifference(difference);
		log.debug(LOG_MESSAGE_PREFIX, "Differences:", difference);
		dd.apply(el, difference);
		log.debug(LOG_MESSAGE_PREFIX, "Differences applied to DOM.");
		return true;
	}
	function cleanEventsFromDifference(difference) {
		if (!difference) {
			return false;
		}

		var eventUuidAttributeName = SETTINGS.eventPrefix + "-event-uuid";

		for (var i = 0, l = difference.length; i < l; i++) {
			var currentDifference = difference[i];
			
			switch (currentDifference.action) {
				case "removeElement":
					var elementBeingRemoved = currentDifference.element;

					if (elementBeingRemoved && elementBeingRemoved.attributes[eventUuidAttributeName]) {
						removeEvent(elementBeingRemoved.attributes[eventUuidAttributeName]);
					}
					break;
				case "modifyAttribute":
					if (difference.name == eventUuidAttributeName) {
						removeEvent(difference.oldValue);
					}
					break;
			}
		}

		return true;
	}
	//event handlers
	function applyEvents(frag, eventHandlers) {
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
					addEventHandler(eventUuid, eventAttributeData.eventType, foundEventHandler);
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
	function removeEvent(eventUuid) {
		if (_eventHandlers[eventUuid]) {
			log.debug(LOG_MESSAGE_PREFIX, "Removing event with UUID", eventUuid, _eventHandlers[eventUuid]);
			delete _eventHandlers[eventUuid];
		}
	}
	function getEventAttributeData(eventAttributeValue) {
		var eventAttributeValueDetails = eventAttributeValue.split(":");
		var eventFnType = eventAttributeValueDetails[0] || "";
		var eventFnName = eventAttributeValueDetails[1] || "";

		return { "eventType": eventFnType.trim().toLowerCase(), "eventFnName": eventFnName.trim() };
	}
	function addEventHandler(eventUuid, eventType, eventHandlerFn) {
		if (_eventHandlers[eventUuid]) {
			log.error(LOG_MESSAGE_PREFIX, "Another event handler with the same UUID was found, fatal failure.  Event did not bind.", eventUuid);
			return false;
		}

		setupDelegateEventHandler(eventType);
		_eventHandlers[eventUuid] = { "eventType": eventType, "eventHandlerFn": eventHandlerFn };
		return true;
	}
	function setupDelegateEventHandler(eventType) {
		if (!_delegateEventHandlerTypes[eventType]) {
			log.debug(LOG_MESSAGE_PREFIX, "No delegate event handler was found for type", eventType, "creating one now.");
			_delegateEventHandlerTypes[eventType] = createEventListener(eventType);
		}
	}
	function createEventListener(eventType) {
		document.addEventListener(eventType, delegateEventHandler);
		log.debug(LOG_MESSAGE_PREFIX, "Created delegate event handler for type", eventType);
		return true;
	}
	function delegateEventHandler(e) {
		var eventUuidAttributeName = SETTINGS.eventPrefix + "-event-uuid";
		var currentElement = e.target;
		var stopPropagation = false;

		while (currentElement != null && (stopPropagation === false || stopPropagation === undefined)) {
			var eventUuidAttribute = currentElement.attributes[eventUuidAttributeName];

			if (eventUuidAttribute && eventUuidAttribute.value) {
				stopPropagation = findEventHandlerAndExecute(eventUuidAttribute.value, e);
			}

			currentElement = currentElement.parentElement;
		}
	}
	function findEventHandlerAndExecute(eventUuid, eventArgs) {
		var currentEventHandler = _eventHandlers[eventUuid];

		if (!currentEventHandler || currentEventHandler.eventType != eventArgs.type) {
			return false;
		}

		var stopPropagation = !currentEventHandler.eventHandlerFn.call({}, eventArgs);

		log.debug(LOG_MESSAGE_PREFIX, "Event handler found and invoked.", "Event Handler:", currentEventHandler);
		return stopPropagation;
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