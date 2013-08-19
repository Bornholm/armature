
var util = require('util');
var App = require('../lib/app.js');

var MyApp = function() {
  App.call(this);
  this.registerPlugin('plugin-one', require('./plugins/plugin-one'));
  this.registerPlugin('plugin-two', require('./plugins/plugin-two'));
};

util.inherits(MyApp, App);

var app = new MyApp();

app.start(function() {
  console.log('App started !');
});