/* jshint node: true */
var util = require('util');
var _ = require('lodash');

var ArmatureError = function(opts) {
  Error.call(this);
  Error.captureStackTrace(this, this.constructor);
  this.name = 'ArmatureError';
  this.message = 'Error';
  _.extend(this, opts);
};

util.inherits(ArmatureError, Error);

module.exports = ArmatureError;