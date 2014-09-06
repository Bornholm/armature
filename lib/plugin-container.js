var _ = require('lodash');
var DependencyGraph = require('./dependency-graph');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var NpmPluginLoader = require('./loaders/npm-plugin-loader');

function PluginContainer(name, context, pluginLoader) {
	this._name = name;
	this._context = context || {};
	this._loader = pluginLoader || new NpmPluginLoader();
	this._plugins = [];
};

util.inherits(PluginContainer, EventEmitter);

var p = PluginContainer.prototype;

p.use = function(pluginPath, pluginOpts) {

	if(arguments.length > 2) {

		var args = _.toArray(arguments);
		var self = this;

		args.forEach(function(plugin) {
		  self.use(plugin.path, plugin.opts);
		});

	} else {

		if(!pluginPath) {
			throw new Error('pluginPath must not be defined !');
		}

		var plugins = this._plugins;

		plugins.push({
		  path: pluginPath,
		  opts: pluginOpts
		});

	}

	return this;

};

p.getName = function() {
	return this._name;
};

p.getContext = function() {
	return this._context;
};

p.getLoader = function() {
	return this._loader;
};

p.getPlugins = function() {
	return this._plugins;
};

p._getPluginsGraph = function(cb) {

  var plugins = this.getPlugins();
  var graph = new DependencyGraph();

	return async.forEach(
		plugins,
		pluginsIterator.bind(this),
		graphBuiltHandler
	);

	function pluginsIterator(plugin, next) {

		return this.getLoader()
			.getPluginInfos(plugin.path, manifestHandler.bind(this));

		function manifestHandler(err, pluginName, version, dependencies) {

			if(err) {
				return next(err);
			}

			graph.addNode(
				pluginName,
				version,
				{path: plugin.path}
			);

			_.forEach(dependencies || {}, function(version, depId) {
				graph.addDependency(pluginName, depId, version);
			});

			return next();

		}

	}

	function graphBuiltHandler(err) {

		if(err) {
			return cb(err);
		}

		return cb(null, graph);

	}

};

function unmetDepsToStr(unmetDeps) {
	return unmetDeps.map(function(plugin) {
		return plugin.node + ' -> ' +
			plugin.dependencies.map(function(dep) {
				return dep.n + ' ' +dep.v;
			}).join(',');
	}).join(';')
}

function checkPluginsGraph(graph) {

  var unmetDeps = graph.getUnmetDependencies();

  if(unmetDeps && unmetDeps.length) {
    throw new Error(
			'One or more plugins have unmet dependencies ! '+
			'(' + unmetDepsToStr(unmetDeps) +')'
		);
  }

  var depsCycles = graph.getCycles();

  if(depsCycles && depsCycles.length) {
    throw new Error(
			'One or more plugins have a circular dependency ! '+
			'(' + depsCycles.join('->') + ')'
		);
  }

};

p._getPluginOpts = function(path) {

  var plugins = this._plugins;
  var p = _.find(plugins, {path: path});
  var opts = p ? p.opts : {};

  return opts || {};

};

function getPluginMethodWrapper(fName, pluginInfo, next) {

	return this.getLoader()
		.getPlugin(pluginInfo.path, pluginLoadedHandler.bind(this));

	function pluginLoadedHandler(err, plugin) {

		if(err) {
			debugger;
			return next(err);
		}

		if(!plugin) {
			return next(new Error('The plugin cannot be null !'));
		}

		var fn = plugin[fName];

		if(fn && typeof fn !== 'function') {
			return next(new Error(
				'The plugin "' + pluginInfo.id + '"' +
				' should have a .' + fName + '() method !'
			));
		}

		return next(null, methodWrapper.bind(this, fn, fName, pluginInfo));

	}

	function methodWrapper(fn, fName, pluginInfo, next) {

		if(!fn) {
			return next();
		}

		this.emit(fName, pluginInfo.id);

		var opts = this._getPluginOpts(pluginInfo.path);

		try {
			fn.call(this.getContext(), opts, next);
		} catch(err) {
			return next(err);
		}

	}

}

function getPluginsMethods(methodName, cb) {

	return this._getPluginsGraph(graphHandler.bind(this));

	function graphHandler(err, graph) {

		if(err) {
			return cb(err);
		}

		try {
			checkPluginsGraph(graph);
		} catch(err) {
			return cb(err);
		}

		var orderedPlugins = graph.getOrderedNodes()
			.map(function graphNodeMapper(pluginId) {
				return {
					id: pluginId,
					path: graph.getData(pluginId).path
				}
			});

		var pluginsIterator = getPluginMethodWrapper.bind(this, methodName);

		return async.map(orderedPlugins, pluginsIterator, cb);

	}
}

p.loadPlugins = function(cb) {

	getPluginsMethods.call(this, 'load', pluginMethodsHandler.bind(this));

	function pluginMethodsHandler(err, pluginMethods) {

		if(err) {
			return cb(err);
		}

		pluginMethods = _.compact(pluginMethods);

		return async.series(pluginMethods, cb);

	}

	return this;

};

p.unloadPlugins = function(cb) {

	getPluginsMethods.call(this, 'unload', pluginMethodsHandler.bind(this));

	function pluginMethodsHandler(err, pluginMethods) {

		if(err) {
			return cb(err);
		}

		pluginMethods = _(pluginMethods).compact().reverse().value();

		return async.series(pluginMethods, cb);

	}

	return this;

}

module.exports = exports = PluginContainer;
