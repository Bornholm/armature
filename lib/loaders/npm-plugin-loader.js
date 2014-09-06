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
		var module;
		try {
			module = require(modulePath);
		} catch(err) {
			return cb(err);
		}
		return cb(null, module);
	}

	setImmediate(moduleLoadedHandler);

}

function NpmPluginLoader() {}

var p = NpmPluginLoader.prototype;

p.getPluginInfos = function(pluginPath, cb) {

	pluginPath = getRealModulePath(pluginPath);

	var manifestPath = path.resolve(pluginPath, 'package.json');

	return requireAsync(manifestPath, function(err, manifest) {

		if(err) {
			return cb(err);
		}

		if(!manifest || !manifest.name || !manifest.version) {
			return cb(new Error('Invalid manifest format !'));
		}

		var pluginName = manifest.name;
		var version = manifest.version;
		var dependencies = manifest.pluginDependencies;

		return cb(null, pluginName, version, dependencies);

	});

};

p.getPlugin = function(pluginPath, cb) {
	pluginPath = getRealModulePath(pluginPath);
	return requireAsync(pluginPath, cb);
};

module.exports = NpmPluginLoader;
