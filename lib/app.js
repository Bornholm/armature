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

var p = App.prototype;

p.initialize = function(cb) {
  this._execSequence(this.init, cb);
  return this;
};

p.terminate = function(cb) {
  this._execSequence(this.exit, cb);
  return this;
};

p._execSequence = function(steps, cb) {
  steps = _.map(steps || [], this._getWrappedStep.bind(this));
  async.series(steps, cb);
  return this;
};

p._getWrappedStep = function(step) {
  var app = this;
  return function stepWrapper(next) {
    var d = domain.create();
    var preNext = function() {
      d.dispose();
      return next.apply(null, arguments);
    };
    d.once('error', preNext);
    d.run(function() {
      step.call(app, preNext);
    });
  };
};

p.getPluginsGraph = function() {
  return this._buildPluginsGraph();
}

p._buildPluginsGraph = function() {
  var app = this;
  var plugins = this.plugins || [];
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
  var app = this;
  var wrapped;
  if(fn) {
    wrapped = function pluginWrapper(next) {
      app.emit(fName, pluginId);
      var args = _.toArray(arguments);
      app.getPluginOpts(pluginId, function(err, opts) {
        if(err) {
          return next(err);
        }
        args.unshift(opts);
        fn.apply(app, args);
      });      
    };
  }
  return wrapped;
}

p.loadPlugins = function(next) {
  var graph = this.getPluginsGraph();
  this._checkPluginsGraph(graph);
  var ordered = graph.getOrderedNodes();
  ordered = _(ordered)
    .map(getPluginFunc.bind(this, graph, 'load'))
    .compact()
    .value();
  async.series(ordered, next);
  return this;
};

p.unloadPlugins = function(next) {
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
};

p.getPluginOpts = function(pluginId, cb) {
  process.nextTick(cb.bind(null, null, {}));
};

module.exports = exports = App;