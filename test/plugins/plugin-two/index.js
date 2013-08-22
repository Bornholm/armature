module.exports = exports = {
  
  load: function(options, next) {
    console.log('Plugin two loaded !')
    next();
  }
  
}