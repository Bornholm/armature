var assert = require('assert');

describe('NpmPluginLoader', function() {

  var NpmPluginLoader = require('../lib/loaders/npm-plugin-loader');

  it('should instanciate a NpmPluginLoader', function() {

    assert.doesNotThrow(function() {
      var pluginLoader = new NpmPluginLoader();
    });

  });

  it('should get a plugin informations', function(done) {

    var pluginLoader = new NpmPluginLoader();
    var pluginPath = __dirname + '/fixtures/plugins/plugin-A-no-dep';

    pluginLoader.getPluginInfos(pluginPath, function(err, pluginName, version, dependencies) {
      assert.ifError(err);
      assert.equal(pluginName, 'plugin-A-no-dep');
      assert.equal(version, 'v0.0.0');
      assert.equal(dependencies, undefined);
      return done();
    });

  });

  it('should get a plugin', function(done) {

    var pluginLoader = new NpmPluginLoader();
    var pluginPath = __dirname + '/fixtures/plugins/plugin-A-no-dep';

    pluginLoader.getPlugin(pluginPath, function(err, plugin) {
      assert.ifError(err);
      assert.ok(plugin);
      assert.equal(typeof plugin.load, 'function');
      return done();
    });

  });

});
