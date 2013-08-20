var _ = require('lodash');
var DependencyGraph = require('./dependency-graph');
var ArmatureError = require('./error');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');

function App() {
  this.plugins = this.plugins || [];
  this.init = this.init || [];
  this.exit = this.exit || [];
  this.name = this.name || '';
}

util.inherits(App, EventEmitter);

var p = App.prototype;

p.start = function(cb) {
  return this._processSequence(this.init, true, cb);
};

p.stop = function(cb) {
  return this._processSequence(this.exit, false, cb);
};

p._processSequence = function(steps, stopOnError, cb) {
  steps = steps.map(this._getWrappedStep.bind(this, stopOnError));
  async.series(steps, cb);
  return this;
};

p._getWrappedStep = function(stopOnError, step) {
  var app = this;
  return function stepWrapper(next) {
    try {
      step.call(app, function(err) {
        if(err) {
          app.emit('error', err);
          if(stopOnError) {
            return next(err);
          }
        }
        return next.apply(null, arguments);
      });
    } catch(err) {
      app.emit('error', err);
    }
  };
};

p.getPluginsGraph = function() {
  return this._buildPluginsGraph();
}

p._buildPluginsGraph = function() {
  var app = this;
  var plugins = this.plugins;
  var graph = new DependencyGraph();
  _.forEach(plugins, function(pluginPath) {
    var pInfos = app.loadPluginInfos(pluginPath);
    var pluginId = pInfos.name;
    graph.addNode(
      pluginId, 
      pInfos.version || '0.0.0', 
      {path: pluginPath}
    );
    var dependencies = pInfos[app.name ? app.name + 'Plugin' : 'plugin'];
    _.forEach(dependencies, function(version, depId) {
      graph.addDependency(pluginId, depId, version);
    });
  });
  return graph;
};

p.loadPluginInfos = function(pluginPath) {
  var ext = path.extname(pluginPath);
  if(ext) {
    pluginPath = path.dirname(pluginPath);
  }
  return require(path.resolve(pluginPath, 'package.json'));
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

function getPluginFunc(graph, fName, pluginId) {
  var pluginPath = graph.getMetadata(pluginId).path;
  var plugin = require(path.resolve(pluginPath));
  var fn = plugin[fName];
  if(fn) {
    fn = fn.bind(this);
  }
  return fn;
}

p.loadPlugins = function(next) {
  try {
    var graph = this.getPluginsGraph();
    this._checkPluginsGraph(graph);
    var ordered = graph.getOrderedNodes();
    ordered = _(ordered)
      .map(getPluginFunc.bind(this, graph, 'load'))
      .compact()
      .value();
    async.series(ordered, next);
    return this;
  } catch(err) {
    return process.nextTick(next.bind(null, err));
  }
};

p.unloadPlugins = function(next) {
  try {
    var graph = this.getPluginsGraph();
    this._checkPluginsGraph(graph);
    var ordered = graph.getOrderedNodes();
    ordered = _(ordered)
      .map(getPluginFunc.bind(this, graph, 'unload'))
      .compact()
      .reverse()
      .value();
    async.series(ordered, next);
    return this;
  } catch(err) {
    return process.nextTick(next.bind(null, err));
  }
};

module.exports = exports = App;