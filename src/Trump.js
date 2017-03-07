/******* Notes for Trump *******/
/*
	- Currently has SAL.Template baked in.  Needs to be modular and take in any rendering library.
	- Return false from event functions to stop propagation.

	TODO:
	- State for preventing event handling rebinding when it's the same template.  i.e the event uuid shouldn't change if it's already the same.
		- Ran into difficulties as the events are applied before the cleanup from differences.
		- More complicated now as an element can have multiple events bound to it.
	- Make onfocus, and onblur work.
	- Multiple event handling will need same eventUUID
*/
/******* Notes for Trump *******/
(function () {
	"use strict";
	var _trump = {};
	var _eventHandlers = {};
	var _delegateEventHandlerTypes = {};
	var _mountedElementData = {};
	var LOG_MESSAGE_PREFIX = "Trump Says:";
	var SETTINGS = {
		"prefix": "trump",
		"renderFn": function () {}
	};

	//private functions
	function init(o) {
		if (!log) {
			var emptyFn = function () {};

			window.log = {
				"trace": emptyFn,
				"warn": emptyFn,
				"debug": emptyFn,
				"error": emptyFn,
				"setLevel": emptyFn,
				"levels": {}
			};
		}

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

		if (o.prefix && o.prefix.trim()) {
			SETTINGS.prefix = o.prefix;
		}

		// if (!o.renderFn || typeof (o.renderFn) != "function") {
		// 	consoleError("Did not initialise as an invalid render function was provided.");
		// 	return false;
		// }

		SETTINGS.eventAttributeName = SETTINGS.prefix + "-event";
		SETTINGS.eventUuidAttributeName = SETTINGS.eventAttributeName + "-uuid";
		SETTINGS.mountElementUuidAttributeName = SETTINGS.prefix + "-mount-uuid";
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

		var elMount = document.getElementById(mountElementID);

		if (!elMount) {
			log.error(LOG_MESSAGE_PREFIX, "Could not find mount element with ID", mountElementID);
			return false;
		}

		var mountElementUuidAttributeName = SETTINGS.mountElementUuidAttributeName;
		var currentElMountUuid = elMount.attributes[mountElementUuidAttributeName];

		//NOT TOTALLY HAPPY WITH THIS
		if (currentElMountUuid && _mountedElementData[elMountUuid]) {
			delete _mountedElementData[elMountUuid];
		}
		
		var elMountUuid = uuid();
		var mountedElementData = _mountedElementData[elMountUuid] = {
			"mountElementID": mountElementID,
			"templateID": templateID,
			"templateData": templateData
		};
		var eventHandlers = mountedElementData.templateData.eventHandlers;

		//CLEAN EVENT HANDLERS UUIDs
		for (var key in eventHandlers) {
			if (eventHandlers[key].uuid) {
				delete eventHandlers[key].uuid;
			}
		}

		elMount.setAttribute(mountElementUuidAttributeName, elMountUuid);

		var templateFragHTML = SAL.Template.render(templateID, mountedElementData.templateData.data || {});

		applyChangesToDOM(elMount, templateFragHTML, eventHandlers, elMountUuid);
		return { 
			"update": function (newData) {
				updateMountedComponent(elMountUuid, newData);
			}
		};
	}
	function updateMountedComponent(mountedElementUuid, newData) {
		if (!mountedElementUuid) {
			return false;
		}

		var mountedElementData = _mountedElementData[mountedElementUuid];

		if (!mountedElementData) {
			log.debug(LOG_MESSAGE_PREFIX, "No data was found for any element with UUID", mountedElementUuid);
			return false;
		}
		
		var elMount = document.getElementById(mountedElementData.mountElementID);

		if (!elMount) {
			log.error(LOG_MESSAGE_PREFIX, "Could not find mount element with ID", mountedElementData.mountElementID);
			return false;
		}

		newData = newData || {};
		mountedElementData.templateData.data = mergeObjects(mountedElementData.templateData.data, newData.data);
		mountedElementData.templateData.eventHandlers = mergeObjects(mountedElementData.templateData.eventHandlers, newData.eventHandlers);
		
		var templateFragHTML = SAL.Template.render(mountedElementData.templateID, mountedElementData.templateData.data || {});

		applyChangesToDOM(elMount, templateFragHTML, mountedElementData.templateData.eventHandlers, mountedElementUuid);
		return true;
	}
	function cleanUpFromDifferences(difference) {
		if (!difference) {
			return false;
		}

		for (var i = 0, l = difference.length; i < l; i++) {
			var currentDifference = difference[i];
			
			switch (currentDifference.action) {
				case "removeElement":
					cleanEventsFromDifference_removeElement(currentDifference);
					break;
				case "modifyAttribute":
					if (currentDifference.name == SETTINGS.eventUuidAttributeName) {
						removeEvent(currentDifference.oldValue);
					}

					if (currentDifference.name == SETTINGS.mountElementUuidAttributeName && _mountedElementData[currentDifference.oldValue]) {
						delete _mountedElementData[currentMountElementUuid];
					}
					break;
			}
		}

		return true;
	}
	function cleanEventsFromDifference_removeElement(currentDifference) {
		var elementBeingRemoved = currentDifference.element;

		if (elementBeingRemoved) {
			var eventUuidsToRemove = searchThroughChildNodesAndFindOnesWithAttribute([elementBeingRemoved], SETTINGS.eventUuidAttributeName);
			var mountElementUuidsToRemove = searchThroughChildNodesAndFindOnesWithAttribute([elementBeingRemoved], SETTINGS.mountElementUuidAttributeName);

			for (var i = 0, l = eventUuidsToRemove.length; i < l; i++) {
				removeEvent(eventUuidsToRemove[i]);
			}

			for (i = 0, l = mountElementUuidsToRemove.length; i < l; i++) {
				var currentMountElementUuid = mountElementUuidsToRemove[i];

				if (_mountedElementData[currentMountElementUuid]) {
					delete _mountedElementData[currentMountElementUuid];
				}
			}
		}
	}
	function searchThroughChildNodesAndFindOnesWithAttribute(nodes, attributeName) {
		var uuids = [];

		for (var i = 0, l = nodes.length; i < l; i++) {
			var currentNode = nodes[i];

			if (currentNode.attributes && currentNode.attributes[attributeName]) {
				uuids.push(currentNode.attributes[attributeName]);
			}

			if (currentNode.childNodes && currentNode.childNodes.length > 0) {
				uuids = uuids.concat(searchThroughChildNodesAndFindOnesWithAttribute(currentNode.childNodes, attributeName));
			}
		}

		return uuids;
	}
	function applyChangesToDOM(elMount, fragHTML, eventHandlers, elMountUuid) {
		var templateFrag = elMount.cloneNode();
		var dd = new diffDOM();

		templateFrag.innerHTML = fragHTML;
		applyEvents(templateFrag, eventHandlers, elMountUuid);

		var difference = dd.diff(elMount, templateFrag);

		cleanUpFromDifferences(difference);
		log.debug(LOG_MESSAGE_PREFIX, "Differences:", difference);
		dd.apply(elMount, difference);
		log.debug(LOG_MESSAGE_PREFIX, "Differences applied to DOM.");
	}

	//event handlers
	function applyEvents(frag, eventHandlers, elMountUuid) {
		var eventAttributeName = SETTINGS.eventAttributeName;
		var elsThatNeedEventBinding = frag.querySelectorAll("[" + eventAttributeName + "]");
		var singleEventAttributeValueRegex = /^\s*[a-zA-Z]+\s*\:\s*\w+\s*$/;
		var multipleEventAttributeValueRegex = /^\s*[a-zA-Z]+\s*\:\s*\w+\s*(,\s*[a-zA-Z]+\s*\:\s*\w+\s*)+$/;

		eventHandlers = eventHandlers || {};
		log.debug(LOG_MESSAGE_PREFIX, "Elements found for event bindings", elsThatNeedEventBinding);

		for (var i = 0, l = elsThatNeedEventBinding.length; i < l; i++) {
			var el = elsThatNeedEventBinding[i];
			var eventAttributeValue = el.attributes[eventAttributeName].value;
			var eventAttributeData = getEventAttributeData(eventAttributeValue);
			var eventUuid = uuid();

			if (eventAttributeData) {
				for (var j = 0, lj = eventAttributeData.length; j < lj; j++) {
					var currentEventAttributeData = eventAttributeData[j];
					var foundEventHandler = eventHandlers[currentEventAttributeData.eventFnName];

					if (foundEventHandler && typeof (foundEventHandler) == "function") {
						eventUuid = foundEventHandler.uuid || eventUuid;
						addEventHandler(eventUuid, currentEventAttributeData.eventType, foundEventHandler, elMountUuid);
						foundEventHandler.uuid = eventUuid;
						el.setAttribute(SETTINGS.eventUuidAttributeName, eventUuid);
					} else {
						log.warn(LOG_MESSAGE_PREFIX, "Could not find event handler", currentEventAttributeData.eventFnName, "within event handlers that were passed in.");
					}
				}
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
		var singleEventAttributeValueRegex = /^\s*[a-zA-Z]+\s*\:\s*\w+\s*$/;
		var multipleEventAttributeValueRegex = /^\s*[a-zA-Z]+\s*\:\s*\w+\s*(,\s*[a-zA-Z]+\s*\:\s*\w+\s*)+$/;
		var returnData = false;

		if (singleEventAttributeValueRegex.test(eventAttributeValue)) {
			returnData = [getSingleEventAttributeData(eventAttributeValue)];
		} else if (multipleEventAttributeValueRegex.test(eventAttributeValue)) {
			var eventAttributeValues = eventAttributeValue.split(",");

			returnData = [];

			for (var i = 0, l = eventAttributeValues.length; i < l; i++) {
				returnData.push(getSingleEventAttributeData(eventAttributeValues[i]));
			}
		} else {
			log.warn(LOG_MESSAGE_PREFIX, "The element doesn't have the correct syntax for event binding.  It must be formatted with the event type, colon, then name of function.  e.g. click:handler_click.", eventAttributeValue);
		}

		return returnData;
	}
	function getSingleEventAttributeData(eventAttributeValue) {
		var eventAttributeValueDetails = eventAttributeValue.split(":");
		var eventFnType = eventAttributeValueDetails[0] || "";
		var eventFnName = eventAttributeValueDetails[1] || "";

		return { "eventType": eventFnType.trim().toLowerCase(), "eventFnName": eventFnName.trim() };
	}
	function addEventHandler(eventUuid, eventType, eventHandlerFn, elMountUuid) {
		//TODO: Still not quite right.  Can only technically have one event handler per event type.
		if (_eventHandlers[eventUuid] && _eventHandlers[eventUuid].eventType == eventType) {
			log.warn(LOG_MESSAGE_PREFIX, "Another event handler with the same UUID and event type was found.  This event will not be bound...", eventUuid);
			return false;
		}

		setupDelegateEventHandler(eventType);

		var foundEventHandler = _eventHandlers[eventUuid];
		var foundEventHandlerIsArray = Array.isArray(foundEventHandler);
		var eventObject = { "eventType": eventType, "eventHandlerFn": eventHandlerFn, "elMountUuid": elMountUuid };

		if (typeof (foundEventHandler) == "object" && !foundEventHandlerIsArray) {
			_eventHandlers[eventUuid] = [foundEventHandler, eventObject];
		} else if (foundEventHandlerIsArray) {
			_eventHandlers[eventUuid].push(eventObject);
		} else {
			_eventHandlers[eventUuid] = { "eventType": eventType, "eventHandlerFn": eventHandlerFn, "elMountUuid": elMountUuid };
		}

		return true;
	}
	function setupDelegateEventHandler(eventType) {
		if (!_delegateEventHandlerTypes[eventType]) {
			log.debug(LOG_MESSAGE_PREFIX, "No delegate event handler was found for type", eventType, "creating one now.");
			_delegateEventHandlerTypes[eventType] = createEventListener(eventType);
		}
	}
	function createEventListener(eventType) {
		document.addEventListener(eventType, delegateEventHandler, true);
		log.debug(LOG_MESSAGE_PREFIX, "Created delegate event handler for type", eventType);
		return true;
	}
	function delegateEventHandler(e) {
		var currentElement = e.target;
		var stopPropagation = false;

		while (currentElement != null && (stopPropagation === false || stopPropagation === undefined)) {
			var eventUuidAttribute = currentElement.attributes[SETTINGS.eventUuidAttributeName];

			if (eventUuidAttribute && eventUuidAttribute.value) {
				stopPropagation = findEventHandlerAndExecute(eventUuidAttribute.value, e, currentElement);
			}

			currentElement = currentElement.parentElement;
		}
	}
	function findEventHandlerAndExecute(eventUuid, eventArgs, currentTarget) {
		var currentEventHandler = _eventHandlers[eventUuid];
		var currentEventHandlerIsArray = Array.isArray(currentEventHandler);
		var eventType = eventArgs.type;

		if (!currentEventHandler ||
			(typeof(currentEventHandler) == "object" && !currentEventHandlerIsArray && currentEventHandler.eventType != eventType)
 			) {
			return false;
		} else if (currentEventHandlerIsArray) {
			var found = false;

			for (var i = 0, l = currentEventHandler.length; i < l; i++) {
				var newCurrentEventHandler = currentEventHandler[i];

				if (currentEventHandler[i].eventType == eventType) {
					currentEventHandler = currentEventHandler[i];
					found = true;
					break;
				}
			}

			if (!found) {
				return false;
			}
		}

		currentTarget.update = function (newData) {
			updateMountedComponent(currentEventHandler.elMountUuid, newData);
		};

		var stopPropagation = currentEventHandler.eventHandlerFn.call(currentTarget, eventArgs) == false;

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
	function mergeObjects(target, source) {
		if (target && source) {
			for (var key in source) {
				target[key] = source[key];
			}
		}

		return target;
	}

	//public functions
	_trump.init = init;
	_trump.applyToDOM = applyToDOM;

	window.Trump = _trump;
})();