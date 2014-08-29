var assert = require('assert');
var PluginContainer = require('../lib/plugin-container');

describe('PluginContainer', function() {

	it('should instanciate an PluginContainer', function() {

		var container = new PluginContainer('Test');

		assert.ok(container instanceof PluginContainer);

	});

	it('should use a plugin', function() {

			var container = new PluginContainer('Test');

			container.use('./fixtures/plugin-A-no-dep');

	});

	it('should use multiples plugins', function() {

		var container = new PluginContainer('Test');

		container.use(
			{ path: __dirname + '/fixtures/plugin-A-no-dep' },
			{ path: __dirname + '/fixtures/plugin-B-dep-A' }
		);

	});

	it('should not accept an invalid plugin', function() {

		var container = new PluginContainer('Test');

		assert.throws(function() {
			container.use();
		});

	});

	describe('NpmPluginLoader', function() {

		it('should load a npm plugin', function(done) {

			var container = new PluginContainer('Test');

			container.use( __dirname + '/fixtures/plugins/plugin-A-no-dep');

			container.loadPlugins(function(err) {
				assert.ifError(err);
				assert.ok(container.getContext().pluginANoDep);
				return done();
			});

		});

		it('should load multiples npm plugins with dependencies', function(done) {

			var container = new PluginContainer('Test');

			container.use( __dirname + '/fixtures/plugins/plugin-A-no-dep');
			container.use( __dirname + '/fixtures/plugins/plugin-B-dep-A');

			container.loadPlugins(function(err) {
				assert.ifError(err);
				assert.ok(container.getContext().pluginANoDep);
				assert.ok(container.getContext().pluginBDepA);
				return done();
			});

		});

	});

});
