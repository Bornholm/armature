var path = require('path');

function getRealModulePath(path) {
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

p.getManifest = function(path, cb) {

	path = getRealModulePath(path);
	var manifestPath = path.resolve(path, 'package.json');

	setImmediate(function manifestHandler() {
		try {
			var manifest = require(manifestPath);
			return cb(null, manifest);
		} catch(err) {
			return cb(err);
		}
	});

};

p.getPlugin = function(path, cb) {

	path = getRealModulePath(path);

	setImmediate(function pluginHandler() {
		try {
			var plugin = require(path);
			return cb(null, plugin);
		} catch(err) {
			return cb(err);
		}
	});

};

module.exports = NpmPluginLoader;
