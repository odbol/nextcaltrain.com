"use strict";

var Immutable = require("immutable");
var caltrain = require("nextcaltrain");
var deferredNextTick = require("../lib/deferred-next-tick");
var getStation = require("../get-station");
var mapValues = require("map-values");

function createState() {
  return Immutable.fromJS({
    route: {
      from: null,
      to: null,
    },
    schedule: null,
  });
}

// Apply the action and return new state
function applyAction(state, type, data) {
  if (type === "change-route") {
    return applyRoute(state, data);
  }
  return state;
}

function getSchedule(route) {
  if (route.to && route.from && route.to !== route.from) {
    var getNextStop = caltrain({
      from: route.from,
      to: route.to,
      date: new Date(),
    });
    return [
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
      getNextStop(),
    ];
  }
}

function applyRoute(state, route) {
  route = sanitizeRoute(route);
  route = Immutable.fromJS(route);
  if ( ! route.equals(state.get("route"))) {
    state = state.mergeIn(["route"], Immutable.fromJS(route));
    state = state.set("schedule", getSchedule(state.get("route").toJS()));
  }
  return state;
}

function sanitizeRoute(route) {
  return mapValues(route, function(val) {
    return getStation(val) && val;
  });
}

module.exports = function(onChange) {
  var handleChange = deferredNextTick(function() {
    onChange(state);
  });
  var state = createState();
  handleChange();
  return function apply(action, data) {
    var newState = applyAction(state, action, data);
    if ( ! newState.equals(state)) {
      state = newState;
      handleChange();
    }
  };
};