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

  var self = this;
	var loader = this.getLoader();
  var plugins = this.getPlugins();
  var graph = new DependencyGraph();

	function pluginsIterator(plugin, next) {

		loader.getManifest(plugin.path, function manifestHandler(err, manifest) {

			if(err) {
				return next(err);
			}

			if(!manifest || !manifest.name || !manifest.version) {
				return next(new Error('Invalid manifest format !'));
			}

			var pluginId = manifest.name;

			graph.addNode(
		    pluginId,
		    manifest.version,
		    {path: plugin.path}
		  );

			var dependencies = manifest[self.getName() + 'Plugin'] || {};

		  _.forEach(dependencies, function(version, depId) {
		    graph.addDependency(pluginId, depId, version);
		  });

			return next();

		});

	}

	function graphBuiltHandler(err) {

		if(err) {
			return cb(err);
		}

		return cb(null, graph);

	}

	async.forEach(plugins, pluginsIterator, graphBuiltHandler);

	return this;

};

p._checkPluginsGraph = function(graph) {

  var unmetDeps = graph.getUnmetDependencies();

  if(unmetDeps && unmetDeps.length) {
    throw new Error(
			'One or more plugins have unmet dependencies ! '+
			'(' + unmetDeps +')'
		);
  }

  var depsCycles = graph.getCycles();

  if(depsCycles && depsCycles.length) {
    throw new Error(
			'One or more plugins have a circular dependency ! '+
			'(' + depsCycles.join('->') + ')'
		);
  }

  return this;

};

p._getPluginOpts = function(path) {

  var plugins = this._plugins;
  var p = _.find(plugins, {path: path});
  var opts = p ? p.opts : {};

  return opts || {};

};

function getPluginWrapper(graph, fName, pluginId, next) {

  var pluginPath = graph.getData(pluginId).path;

	return this.getLoader().getPlugin(pluginPath, pluginHandler.bind(this));

	function pluginHandler(err, plugin) {

		if(err) {
			return next(err);
		}

		if(!plugin) {
			return next(new Error('The plugin cannot be null !'));
		}

		if((fn = plugin[fName]) && typeof fn !== 'function') {
			return next(new Error(
				'The plugin "' + pluginId + '"' +
				' should have a .' + fName + '() method !'
			));
		}

		var container = this;

		var pluginWrapper = function(next) {
			if(!fn) return next();
			container.emit(fName, pluginId);
			var args = _.toArray(arguments);
			var opts = container._getPluginOpts(pluginPath);
			args.unshift(opts);
			fn.apply(container.getContext(), args);
		};

		return next(null, pluginWrapper);

	}

}

function processPlugins(method, next) {

	return this._getPluginsGraph(graphHandler.bind(this));

	function graphHandler(err, graph) {

		if(err) {
			return next(err);
		}

		try {
			this._checkPluginsGraph(graph);
		} catch(err) {
			return next(err);
		}

		var ordered = graph.getOrderedNodes();

		return async.map(
			ordered,
			getPluginWrapper.bind(this, graph, method),
			orderedPluginsHandler.bind(this)
		);

		function orderedPluginsHandler(err, wrappeds) {

			if(err) {
				return next(err);
			}

			wrapped = _.compact(wrappeds);

			if(method === 'unload') {
				wrappeds = _.reverse(wrappeds);
			}

			return async.series(wrappeds, next);

		}

	}

}

p.loadPlugins = _.partial(processPlugins, 'load');
p.unloadPlugins = _.partial(processPlugins, 'unload');

module.exports = exports = PluginContainer;
