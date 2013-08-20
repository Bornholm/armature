module.exports = exports = {

  unload: function(next) {
    console.log('Plugin one unloaded !');
    next();
  }

}