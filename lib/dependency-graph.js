var semver = require('semver');
var _ = require('lodash');
var ArmatureError = require('./error');

function DependencyGraph() {
  this._nodes = {};
  this._dependencies = {};
  this._data = {};
}

var p = DependencyGraph.prototype;

p.addDependency = function(fromNode, toNode, version) {
  var deps = this._dependencies[fromNode]  = this._dependencies[fromNode] || [];
  deps.push({
    n: toNode,
    v: version
  });
  return this;
};

p.addNode = function(nodeId, version, data) {
  var clean = semver.clean(version)
  if(!clean) {
    throw new ArmatureError({
      message: 'Invalid version format' + version + '!'
    });
  }
  this._nodes[nodeId] = clean;
  this._data[nodeId] = data;
  return this;
};

p.getData = function(nodeId) {
  return this._data[nodeId];
};

function nodesIterator(version, nodeId) {
  var deps = this._dependencies[nodeId];
  if(deps && deps.length) {
    var unmetDeps = _.reject(deps, depsIterator.bind(this));
    if(unmetDeps && unmetDeps.length) {
      return {
        node: nodeId,
        dependencies: unmetDeps
      };
    }
  }
}

function depsIterator(dep) {
  var nodeVersion = this._nodes[dep.n];
  return semver.satisfies(nodeVersion, dep.v);
}

p.getUnmetDependencies = function() {
  var wrapped = _(this._nodes);
  wrapped = wrapped.map(nodesIterator.bind(this));
  wrapped = wrapped.compact();
  return wrapped.value();
};

p.getCycles = function() {

  var cycles = [];
  var dependencies = this._dependencies;
  var firstNode = Object.keys(this._nodes)[0];

  function findCycles(path) {
    var node = path[path.length-1];
    var deps = dependencies[node];
    if(deps) {
      deps.forEach(function(d) {
        if(~path.indexOf(d.n)) {
          var c = _.clone(path);
          c.push(d.n);
          c = c.slice(c.indexOf(d.n));
          cycles.push(c);
        } else {
          findCycles(path.concat(d.n));
        }
      });
    }
  }
  
  if(firstNode) {
    findCycles([firstNode]);
  }

  return cycles;
};

p.getOrderedNodes = function() {

  var ordered = [];
  var dependencies = this._dependencies;
  var unmarked = Object.keys(this._nodes);
  var temp = [];

  function visit(node) {
    if(typeof node !== 'string') {
      node = node.n;
    }
    var deps = dependencies[node];
    if(~temp.indexOf(node)) {
      throw new ArmatureError({
        message: 'Graph is not acyclic !'
      });
    }
    if(~unmarked.indexOf(node)) {
      temp.push(node);
      if(deps && deps.length) {
        deps.forEach(visit);
      }
      unmarked.pop();
      ordered.push(node);
    }
  }

  while (unmarked.length > 0) {
    temp.length = 0;
    visit(unmarked[unmarked.length-1])
  }

  return ordered;

};

module.exports = exports = DependencyGraph;
