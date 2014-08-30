# Armature

Plugin container system for NodeJS

**Warning** This module is under active development. Don't use in production yet.

# Documentation

- [PluginContainer](#armatureplugincontainer)
- [PluginLoader](#armaturepluginloader)
- [DependencyGraph](#armaturedependencygraph)
- [Plugins](#plugins)

## Armature.PluginContainer

### Example ###
```
var PluginContainer = require('armature').PluginContainer;

var container = new PluginContainer('myContainer');

container.use('my-plugin', { 'foo': 'bar' }); // -> Use my-plugin module
container.use(__dirname + '/plugins/my-other-plugin'); // -> Use ./plugins/my-other-plugin

// Load all registered plugins
container.loadPlugins(function(err) {

  if(err) {
    console.log(err.stack);
    return;
  }

  var pluginsContext = container.getContext();

});

```

### pluginContainer.use( _pluginPath_, _pluginOpts_ )

Register a new plugin into the container

#### Parameters

- **pluginPath**  _String_  Path to access the plugin. See [plugin loaders](#armaturepluginloader)
- **pluginOpts**  _Object_  Options to pass to the plugin

### app.loadPlugins( _cb_ )

Load all registered plugins, ordered by dependencies.

See [Plugins](#plugins)

#### Parameters

- **cb(err)**  _Function_

### app.unloadPlugins( _cb_ )

Unload all registered plugins, reverse ordered by dependencies.

See [Plugins](#plugins)

#### Parameters

- **cb(err)**  _Function_

## Armature.DependencyGraph

TODO

## Plugins

### Loaders

TODO

### NPM Plugin Loader

NPM module-based plugin loader

#### Example

```
// my-app/app.js

var PluginContainer = require('armature').PluginContainer;

var container = new PluginContainer('myApp');

container.use('my-plugin', { foo: 'bar' }); // -> Use my-plugin module

// Load all registered plugins
container.loadPlugins(function(err) {

  if(err) {
    console.log(err, err.stack);
    return;
  }

  var pluginsContext = container.getContext();

});

```

```
// my-app/node_modules/my-plugin/package.json

{
  "name": "my-plugin",
  "version": "v0.0.1",
  "myAppPlugin": {
    "my-other-plugin": "v0.0.1"
  }
}

```

```
// my-app/node_modules/my-plugin/index.js

module.exports = {

  // If defined, invoked when pluginContainer.loadPlugins() is called
  load: function(pluginOpts, next) {
    // pluginOpts == {foo: 'bar'}
    // this == pluginContainer.getContext()
    return next();
  },

  // If defined, invoked when pluginContainer.unloadPlugins() is called
  unload: function(pluginOpts, next) {
    // pluginOpts == {foo: 'bar'}
    // this == pluginContainer.getContext()
    return next();
  }

};

```
