module.exports = exports = {
  
  load: function(next) {
    console.log('Plugin two loaded !')
    next();
  }
  
}