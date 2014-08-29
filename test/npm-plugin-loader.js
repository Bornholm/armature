var assert = require('assert');

describe('NpmPluginLoader', function() {

  var NpmPluginLoader = require('../lib/loaders/npm-plugin-loader');

  it('should instanciate a NpmPluginLoader', function() {

    assert.doesNotThrow(function() {
      var pluginLoader = new NpmPluginLoader();
    });

  });

  it('should get a plugin manifest', function(done) {

    var pluginLoader = new NpmPluginLoader();
    var pluginPath = __dirname + '/fixtures/plugins/plugin-A-no-dep';

    pluginLoader.getManifest(pluginPath, function(err, manifest) {
      assert.ifError(err);
      assert.ok(manifest);
      assert.equal(manifest.name, 'plugin-A-no-dep');
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
