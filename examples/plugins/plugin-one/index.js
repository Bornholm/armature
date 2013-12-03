module.exports = exports = {

  unload: function(options, next) {
    console.log('Plugin one unloaded !', 'Options:', options);
    next();
  }

}