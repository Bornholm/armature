
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
    this.handleSignals,
    this.loadPlugins,
    function(next) {
      setTimeout(function() {
        throw new Error('Hey :D');
      }, 500);
    }
  ];

  this.exit = [
    this.unloadPlugins
  ];

};

util.inherits(MyApp, App);

var p = MyApp.prototype;

p.handleSignals = function(next) {
  var self = this;

  process.once('SIGINT', function() {
    console.log('SIGINT signal intercepted. Stopping application...');
    app.terminate(function(err) {
      if(err) {
        console.error(err.stack);
        process.exit(1);
      } else {
        process.exit(0);
      }
    });
  });

  process.nextTick(next);

};

var app = new MyApp();

console.error('Starting App...');

app.on('load', function(pluginId) {
  console.log('Loading', pluginId);
});

app.on('unload', function(pluginId) {
  console.log('Unloading', pluginId);
});

app.initialize(function(err) {
  if(err) {
    console.error('Start error !', err.stack);
  } else {
    console.log('App started !')
    setInterval(function() {
      console.log('Doing some work...')
    }, 2000);
  }
});

