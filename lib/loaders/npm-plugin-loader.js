var path = require('path');

function getRealModulePath(pluginPath) {
	try {
    var absPath = require.resolve(pluginPath);
    var ext = path.extname(absPath);
    if(ext) {
      return path.dirname(absPath);
    } else {
      return absPath;
    }
  } catch(err) {
    return path.resolve(pluginPath);
  };
}

function NpmPluginLoader() {}

var p = NpmPluginLoader.prototype;

p.getManifest = function(pluginPath, cb) {

	pluginPath = getRealModulePath(pluginPath);
	var manifestPath = path.resolve(pluginPath, 'package.json');

	setImmediate(function manifestHandler() {
		try {
			var manifest = require(manifestPath);
			return cb(null, manifest);
		} catch(err) {
			return cb(err);
		}
	});

};

p.getPlugin = function(pluginPath, cb) {

	path = getRealModulePath(pluginPath);

	setImmediate(function pluginHandler() {
		try {
			var plugin = require(pluginPath);
			return cb(null, plugin);
		} catch(err) {
			return cb(err);
		}
	});

};

module.exports = NpmPluginLoader;
