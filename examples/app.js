
var util = require('util');
var App = require('../lib/app.js');

var MyApp = function() {

  this.name = 'test';

  this.registerPlugins(
    {path: './plugins/plugin-one'},
    {path: './plugins/plugin-two', opts: {foo: 'bar'}}
  );

  this.addInitSteps(
    this.startHandlingSignals,
    this.loadPlugins
  );

  this.addTermSteps(
    this.unloadPlugins
  );

};

util.inherits(MyApp, App);

var p = MyApp.prototype;

p.startHandlingSignals = function(next) {
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

