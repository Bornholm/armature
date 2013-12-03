var _ = require('lodash');
var DependencyGraph = require('./dependency-graph');
var ArmatureError = require('./error');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var domain = require('domain');

function App() {}

util.inherits(App, EventEmitter);

App.SEQ = {
  INITIALIZE: 'initialize',
  TERMINATE: 'terminate'
};

var p = App.prototype;

p._addSequenceSteps = function(sequenceName, futureSteps) {
  var phases = this._phases = this._phases || {};
  var steps = phases[sequenceName] = phases[sequenceName] || [];
  if(Array.isArray(futureSteps)) {
    steps.push.apply(steps, futureSteps);
  } else {
    steps.push(futureSteps);
  }
  return this;
};

function addSteps(sequenceName) {
  var steps = _.toArray(arguments);
  steps.shift();
  return this._addSequenceSteps(sequenceName, steps);
}

p.addInitSteps = _.partial(addSteps, App.SEQ.INITIALIZE);
p.addTermSteps = _.partial(addSteps, App.SEQ.TERMINATE);

p.getSequenceSteps = function(sequenceName) {
  var phases = this._phases;
  if(phases) {
    return phases[sequenceName];
  }
};

p.getInitSteps = _.partial(p.getSequenceSteps, App.SEQ.INITIALIZE);
p.getTermSteps = _.partial(p.getSequenceSteps, App.SEQ.TERMINATE);

p._execSequence = function(sequenceName, cb) {
  var steps = this.getSequenceSteps(sequenceName);
  steps = _.map(steps || [], this._getWrappedStep.bind(this));
  async.series(steps, cb);
  return this;
};

p.initialize = _.partial(p._execSequence, App.SEQ.INITIALIZE);
p.terminate = _.partial(p._execSequence, App.SEQ.TERMINATE);

p._getWrappedStep = function(step) {
  var app = this;
  return function stepWrapper(next) {
    try {
      step.call(app, next);
    } catch(err) {
      return next(err);
    }
  };
};

p.registerPlugin = function(pluginPath, pluginOpts) {
  var plugins = this.getRegisteredPlugins();
  plugins.push({
    path: pluginPath,
    opts: pluginOpts
  });
  return this;
};

p.registerPlugins = function() {
  var app = this;
  var args = _.toArray(arguments);
  args.forEach(function(p) {
    app.registerPlugin(p.path, p.opts);
  });
  return this;
};

p.getRegisteredPlugins = function() {
  this._plugins = this._plugins || [];
  return this._plugins;
};

p.getPluginsGraph = function() {
  return this._buildPluginsGraph();
}

p._buildPluginsGraph = function() {
  var app = this;
  var plugins = this.getRegisteredPlugins();
  var graph = new DependencyGraph();
  _.forEach(plugins, function(plugin) {
    var manifest = app._loadPluginManifest(plugin.path);
    var pluginId = manifest.name;
    graph.addNode(
      pluginId, 
      manifest.version || '0.0.0', 
      {path: plugin.path}
    );
    var dependencies = manifest[app.name ? app.name + 'Plugin' : 'plugin'];
    _.forEach(dependencies, function(version, depId) {
      graph.addDependency(pluginId, depId, version);
    });
  });
  return graph;
};

p._loadPluginManifest = function(pluginPath) {
  pluginPath = this._getRealPluginPath(pluginPath);
  var pkgPath = path.resolve(pluginPath, 'package.json');
  return require(pkgPath);
};

p._checkPluginsGraph = function(graph) {
  var err;
  var unmetDeps = graph.getUnmetDependencies();
  if(unmetDeps && unmetDeps.length) {
    err = new ArmatureError({
      name: 'PluginDepsError',
      message: 'Plugin unmet dependencies !',
      dependencies: unmetDeps
    });
    throw err;
  }
  var depsCycles = graph.getCycles();
  if(depsCycles && depsCycles.length) {
    err = new ArmatureError({
      name: 'PluginDepsError',
      message: 'Plugin dependencies cycle detected !',
      cycles: depsCycles
    });
    throw err;
  }
  return this;
};

p._getPluginOpts = function(pluginPath) {
  var plugins = this.getRegisteredPlugins();
  var p = _.find(plugins, {path: pluginPath});
  var opts = p ? p.opts : {};
  return opts || {};
};

p._getRealPluginPath = function(pluginPath) {
  try {
    var absPath = require.resolve(pluginPath);
    var ext = path.extname(absPath);
    if(ext) {
      return path.dirname(absPath);
    } else {
      return absPath;
    }
  } catch(err) {
    return path.resolve(pluginPath);
  };
};

function getPluginFunc(graph, fName, pluginId) {
  var pluginPath = graph.getMetadata(pluginId).path;
  var plugin = require(this._getRealPluginPath(pluginPath));
  var fn = plugin[fName];
  var app = this;
  var wrapped;
  if(fn) {
    wrapped = function pluginWrapper(next) {
      app.emit(fName, pluginId);
      var args = _.toArray(arguments);
      var opts = app._getPluginOpts(pluginPath);
      args.unshift(opts);
      fn.apply(app, args);    
    };
  }
  return wrapped;
}

function processPlugins(phase, next) {
  var graph = this.getPluginsGraph();
  this._checkPluginsGraph(graph);
  var ordered = graph.getOrderedNodes();
  ordered = _(ordered)
    .map(getPluginFunc.bind(this, graph, phase))
    .compact();
  if(phase === 'unload') {
    ordered = ordered.reverse();
  }
  ordered = ordered.value();
  async.series(ordered, next);
  return this;
}

p.loadPlugins = _.partial(processPlugins, 'load');
p.unloadPlugins = _.partial(processPlugins, 'unload');

module.exports = exports = App;