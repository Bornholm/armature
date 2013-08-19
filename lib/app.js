var _ = require('lodash');
var DependencyGraph = require('./dependency-graph');
var ArmatureError = require('./error');
var async = require('async');

function App() {
  this.imports = {};
  this.plugins = {};
  this.config = {};
  this.init = [];
  this.exit = [];
}

var p = App.prototype;

p.start = function(cb) {
  return this._processSequence(this._initSteps, cb);
};

p.stop = function(cb) {
  return this._processSequence(this._stopSteps, cb);
};

p._processSequence = function(steps, cb) {

  return this;
};

p.addInitStep = function(stepId, fn, cond) {
  return this._removeStep(this._initSteps, stepId, fn, cond);
};

p.removeInitStep = function(stepId) {
  return this._removeStep(this._initSteps, stepId);
};

p.addExitStep = function(stepId, fn, cond) {
  return this._removeStep(this._exitSteps, stepId, fn, cond);
};

p.removeExitStep = function(stepId) {
  return this._removeStep(this._exitSteps, stepId);
};

p._addStep = function(steps, stepId, fn, cond) {
  var i, len, step;
  for(i = 0, len = steps; i < len; ++i) {
    if(steps[i].id == stepId) {
      throw new Error('Step ' + stepId + 'already added !');
    }
  }
  steps.push({
    id: stepId,
    fn: fn,
    cond: cond
  });
  return this;
};

p._removeStep = function(steps, stepId) {
  var i, len, step;
  for(i = 0, len = steps; i < len; ++i) {
    if(steps[i].id == stepId) {
      steps.splice(i, 1);
    }
  }
  return this;
}

p.registerPlugin = function(pluginId, plugin) {
  this.plugins[pluginId] = plugin;
};

p.getPluginsGraph = function() {
  var graph = new DependencyGraph();
  var plugins = this.plugins;
  _.forEach(plugins, function(plugin, pluginId) {
    graph.addNode(pluginId, plugin.version || '0.0.0');
    var dependencies = plugin.dependencies || {};
    _.forEach(dependencies, function(version, depId) {
      graph.addDependency(pluginId, depId, version);
    });
  });
  return graph;
}

p.checkPluginsGraph = function(graph) {

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

function getPluginFunc(funcName, pluginId) {
  var p = this.plugins[pluginId];
  var fn = typeof p[funcName] === 'function' ? p[funcName] : undefined;
  fn = fn.bind(this, this.imports, this.getPluginOpts(pluginId));
  return fn;
}

p.loadPlugins = function(next) {
  try {
    var graph = this.getPluginsGraph();
    this.checkPluginsGraph(graph);
    var ordered = graph.getOrderedNodes();
    ordered = _(ordered)
      .map(getPluginFunc.bind(this, 'load'))
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
    this.checkPluginsGraph(graph);
    var plugins = this.plugins;
    var args = [
      this.imports,
    ];
    async.applyEachSeries()
  } catch(err) {
    return process.nextTick(next.bind(null, err));
  }
};

p.cli = function(cb) {

};

module.exports = exports = App;