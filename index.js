module.exports = exports = {
  PluginContainer: require('./lib/plugin-container'),
  DependencyGraph: require('./lib/dependency-graph'),
  Loaders: {
    NpmPluginLoader: require('./lib/loaders/npm-plugin-loader')
  },
  Hooks: require('./lib/hooks')
};
