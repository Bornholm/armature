var DependencyGraph = require('../lib/dependency-graph');

var graph = new DependencyGraph();

graph.addNode('A', 'v0.0.0');
graph.addNode('B', 'v0.1.0');
graph.addNode('C', 'v0.2.0');
graph.addNode('D', 'v0.0.3');
graph.addNode('E', 'v0.0.4');
graph.addNode('F', 'v0.5.3');

graph.addDependency('A', 'C', '*');
graph.addDependency('A', 'B', '*');
graph.addDependency('A', 'F', '*');

graph.addDependency('F', 'B', '*');

graph.addDependency('B', 'C', '*');

graph.addDependency('C', 'D', '*');
graph.addDependency('C', 'E', '0.0.0');

// Cycles
graph.addDependency('C', 'F', '*');
graph.addDependency('E', 'A', '*');

console.log('Cycles', graph.getCycles());
console.log('Unmet Deps', graph.getUnmetDependencies());
console.log('Ordered nodes', graph.getOrderedNodes());
