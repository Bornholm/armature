var _ = require('lodash');

function Hookable(fn) {
  this._fn = fn;
  this._beforeHooks = [];
  this._afterHooks = [];
}

var p = Hookable.prototype;

p.before = function(hook) {
  if(typeof hook !== 'function') {
    throw new Error('Hook must be a function !');
  }
  this._beforeHooks.push(hook);
  return this;
};

p.after = function(hook) {
  if(typeof hook !== 'function') {
    throw new Error('Hook must be a function !');
  }
  this._afterHooks.push(hook);
  return this;
};

p.remove = function(phase, hook) {
  var hooks = this['_' + phase + 'Hooks'];
  var index = hooks.indexOf(hook);
  if(index !== -1) {
    hooks.splice(index, 1);
  }
  return this;
};

p.getWrapper = function() {

  var fn = this._fn;
  var before = this._beforeHooks;
  var after = this._afterHooks;

  var wrapper = function() {

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

  wrapper.before = this.before.bind(this);
  wrapper.after = this.after.bind(this);
  wrapper.removeAfter = this.remove.bind(this, 'after');
  wrapper.removeBefore = this.remove.bind(this, 'before');

  return wrapper;
}

module.exports = Hookable;
