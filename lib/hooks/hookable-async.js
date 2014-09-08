var _ = require('lodash');
var async = require('async');

function HookableAsync(fn) {
  this._fn = fn;
  this._beforeHooks = [];
  this._afterHooks = [];
}

var p = HookableAsync.prototype;

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

    var results;
    var args = _.toArray(arguments);
    var cb = args[args.length-1];
    args = args.slice(0, -1);

    async.forEachSeries(
      before,
      beforeHooksIterator.bind(this),
      beforeHandler.bind(this)
    );

    return this;

    function beforeHooksIterator(hook, next) {
      hook.apply(this, args.concat(function(err) {
        var newArgs = _.toArray(arguments).slice(1);
        if(newArgs.length > 0) {
          args = newArgs;
        }
      }));
    }

    function beforeHandler(err) {
      if(err) {
        return cb(err);
      }
      fn.apply(this, args.concat(function(err) {
        if(err) {
          return cb(err);
        }
        results = _.toArray(arguments).slice(1);
        return async.forEachSeries(
          after,
          afterIterator.bind(this),
          afterHandler
        );
      }));
    }

    function afterIterator(hook, next) {
      hook.apply(this, results.concat(function(err) {
        var newResults = _.toArray(arguments).slice(1);
        if(newResults.length > 0) {
          results = newResults;
        }
      }));
    }

    function afterHandler(err) {
      return cb.apply(null, [err].concat(results));
    }

  };

  wrapper.before = this.before.bind(this);
  wrapper.after = this.after.bind(this);
  wrapper.removeAfter = this.remove.bind(this, 'after');
  wrapper.removeBefore = this.remove.bind(this, 'before');

  return wrapper;
}

module.exports = HookableAsync;
