var Hookable = require('./hookable');
var HookableAsync = require('./hookable-async');

var Hooks = {};

Hooks.wrap = function(fn) {
  return new Hookable(fn).getWrapper();
};

Hooks.wrapAsync = function(fn) {
  return new HookableAsync(fn).getWrapper();
};

module.exports = Hooks;
