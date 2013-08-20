
var util = require('util');
var App = require('../lib/app.js');

var MyApp = function() {

  App.call(this);

  this.name = 'test';

  this.plugins = [
    './plugins/plugin-one',
    './plugins/plugin-two'
  ];

  this.init = [
    this.loadPlugins
  ];

  this.exit = [
    this.unloadPlugins
  ];

  var app = this;
  process.on('SIGINT', function() {
    app.stop(function(err) {
      if(err) {
        console.error(err);
        process.exit(1);
      } else {
        console.log('App stopped !')
        process.exit(0);
      }
    });
  });

};

util.inherits(MyApp, App);

var p = MyApp.prototype;

p.beforeInitStep = function() {
  console.log('Before init step');
};

var app = new MyApp();

app.start(function(err) {
  if(err) {
    console.error(err);
  } else {
    console.log('App started !')
    setInterval(function() {
      console.log('Doing some work...')
    }, 5000);
  }
});