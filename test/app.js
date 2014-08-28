var assert = require('assert');

describe('App', function() {

	var App = require('../lib/app');
	var NpmPluginLoader = require('../lib/loaders/npm-plugin-loader');

	it('should instanciate an App', function() {
			
		var pluginLoader = new NpmPluginLoader();
		var app = new App(pluginLoader);

		assert.ok(app instanceof App);
		
	});

	it('should use a plugin', function() {
			
			var pluginLoader = new NpmPluginLoader();
			var app = new App(pluginLoader);

			app.use('./fixtures/plugin-A');
			
	});

	it('should use multiples plugins', function() {
		
		var pluginLoader = new NpmPluginLoader();
		var app = new App(pluginLoader);

		app.use(
			{ path: './fixtures/plugin-A' },
			{ path: './fixtures/plugin-B' }
		);
		
	});

	it('should not accept an invalid plugin', function() {
		
		var pluginLoader = new NpmPluginLoader();
		var app = new App(pluginLoader);

		assert.throws(function() {
			app.use();
		});
		
	});

	it('should load a npm plugin', function(done) {
		
		var pluginLoader = new NpmPluginLoader();
		var app = new App(pluginLoader);

		app.use('./fixtures/plugins/plugins-A');

		app.loadPlugins(function(err) {
			assert.ifError(err);
		});
		
	});

});
