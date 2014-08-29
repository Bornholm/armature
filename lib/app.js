var _ = require('lodash');
var DependencyGraph = require('./dependency-graph');
var ArmatureError = require('./error');
var async = require('async');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');

function App(name, pluginLoader) {

	this.name = name;
	
	if(!pluginLoader) {
		throw new ArmatureError({
			name: 'PluginLoaderError',
			message: 'You must provide a plugin loader !'
		});
	}
	
	this._plugins = [];
	this._loader = pluginLoader;
};

util.inherits(App, EventEmitter);

var p = App.prototype;

p.use = function(pluginPath, pluginOpts) {

	if(arguments.length > 2) {

		var args = _.toArray(arguments);
		var self = this;

		args.forEach(function(plugin) {
		  self.use(plugin.path, plugin.opts);
		});

	} else {

		if(!pluginPath) {
			throw new ArmatureError({
				name: 'PluginFormatError',
				message: 'pluginPath must not be defined !'
			});
		}
		
		var plugins = this._plugins;

		plugins.push({
		  path: pluginPath,
		  opts: pluginOpts
		});
		
	}

	return this;

};

p._getPluginsGraph = function(cb) {

  var self = this;
	var loader = this._loader;
  var plugins = this._plugins;
  var graph = new DependencyGraph();

	function pluginsIterator(plugin, next) {

		loader.getManifest(plugin.path, function manifestHandler(err, manifest) {

			if(err) {
				return next(err);
			}

			if(!manifest || !manifest.name || !manifest.version) {
				return next(new ArmatureError({
					name: 'PluginManifestError',
					message: 'Invalid manifest format !'
				}));
			}

			var pluginId = manifest.name;

			graph.addNode(
		    pluginId, 
		    manifest.version, 
		    {path: plugin.path}
		  );

			var dependencies = manifest[self.name + 'Plugin'] || {};

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
    throw new ArmatureError({
      name: 'PluginDependencyError',
      message: 'One or more plugin have unmet dependencies !',
      dependencies: unmetDeps
    });
  }

  var depsCycles = graph.getCycles();

  if(depsCycles && depsCycles.length) {
    throw new ArmatureError({
      name: 'PluginDependencyError',
      message: 'There is one or more circular dependency in the graph !',
      cycles: depsCycles
    });
  }

  return this;

};

p._getPluginOpts = function(path) {

  var plugins = this._plugins;
  var p = _.find(plugins, {path: path});
  var opts = p ? p.opts : {};

  return opts || {};

};

function getPluginFunc(graph, fName, pluginId, next) {
	
  var pluginPath = graph.getData(pluginId).path;

	this._loader.getPlugin(pluginPath, function pluginLoadedHandler(err, plugin) {
		
		if(err) {
			return next(err);
		}

		if(!plugin) {
			return next(new Error('The plugin cannot be null !'));
		}

		if(fn = plugin[fName] && typeof fn !== 'function') {
			return next(new Error('The plugin ' + pluginId + ' should have a .' + fName + '() method !'));
		}
		
		var app = this;

		var wrapped = function PluginWrapper(next) {
			if(!fn) return next();
	    app.emit(fName, pluginId);
	    var args = _.toArray(arguments);
	    var opts = app._getPluginOpts(pluginPath);
	    args.unshift(opts);
	    fn.apply(app, args);    
	  };

		return next(null, wrapped);

	}.bind(this));
  
}

function processPlugins(method, next) {

	this._getPluginsGraph(function handleGraph(err, graph) {

		if(err) {
			return next(err);
		}
		
		try {
			this._checkPluginsGraph(graph);
		} catch(err) {
			return next(err);
		}

		var ordered = graph.getOrderedNodes();

		async.map(
			ordered,
			getPluginFunc.bind(this, graph, method),
			function orderedPluginsHandler(err, wrappeds) {

				if(err) {
					return next(err);
				}

				console.log(arguments);

				wrapped = _.compact(wrappeds);
				
				if(method === 'unload') {
					wrappeds = _.reverse(wrappeds);
				}

				return async.series(wrappeds, next);
				
			}.bind(this)
		);

	}.bind(this));
	
}

p.loadPlugins = _.partial(processPlugins, 'load');
p.unloadPlugins = _.partial(processPlugins, 'unload');

module.exports = exports = App;
