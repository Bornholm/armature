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

function requireAsync(modulePath, cb) {

	function moduleLoadedHandler() {
		try {
			var module = require(modulePath);
			return cb(null, module);
		} catch(err) {
			return cb(err);
		}
	}

	setImmediate(moduleLoadedHandler);

}

function NpmPluginLoader() {}

var p = NpmPluginLoader.prototype;

p.getManifest = function(pluginPath, cb) {
	pluginPath = getRealModulePath(pluginPath);
	var manifestPath = path.resolve(pluginPath, 'package.json');
	return requireAsync(manifestPath, cb);
};

p.getPlugin = function(pluginPath, cb) {
	pluginPath = getRealModulePath(pluginPath);
	return requireAsync(pluginPath, cb);
};

module.exports = NpmPluginLoader;
