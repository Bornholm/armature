var _ = require('lodash');

var Hooks = {};

function getHookableFunction(fn) {

  var before = [];
  var after = [];

  var hookable = function hookable() {

    var i, newArgs, newResult;
    var args = _.toArray(arguments);

    for(i = 0; h = before[i]; ++i) {
      newArgs = h.apply(this, args);
      if(typeof newArgs !== 'undefined') {
        args = newArgs;
        newArgs = undefined;
      }
    }

    var result = fn.apply(this, args);

    for(i = 0; h = after[i]; ++i) {
      newResult = h.call(this, result);
      if(typeof newResult !== 'undefined') {
        result = newResult;
        newResult = undefined;
      }
    }

    return result;

  };

  hookable.before = function(hook) {
    if(typeof hook !== 'function') {
      throw new Error('Hook must be a function !');
    }
    before.push(hook);
    return this;
  };

  hookable.after = function(hook) {
    if(typeof hook !== 'function') {
      throw new Error('Hook must be a function !');
    }
    after.push(hook);
    return this;
  };

  hookable.removeAfter = function(hook) {
    var index = after.indexOf(hook);
    if(index !== -1) {
      after.splice(index, 1);
    }
    return this;
  };

  hookable.removeBefore = function(hook) {
    var index = before.indexOf(hook);
    if(index !== -1) {
      before.splice(index, 1);
    }
    return this;
  };

  return hookable;

};

Hooks.wrap = function(fn) {
  return getHookableFunction(fn);
};

module.exports = Hooks;
