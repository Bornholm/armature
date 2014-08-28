var assert = require('assert');

describe('DependencyGraph', function() {

	var DependencyGraph = require('../lib/dependency-graph');

	describe('addNode', function() {
		
		it('should add a node', function() {

			var g = new DependencyGraph();
			g.addNode('A', 'v0.0.0');
			assert.equal(Object.keys(g._nodes).length, 1);

		});

	});

	describe('getCycles', function() {
		
		it('should find a cycle', function() {

			var g = new DependencyGraph();

			g.addNode('A', 'v0.0.0');
			g.addNode('B', 'v0.0.0');
			g.addNode('C', 'v0.0.0');

			g.addDependency('A', 'B', 'v0.0.0');
			g.addDependency('B', 'C', 'v0.0.0');
			g.addDependency('C', 'A', 'v0.0.0');

			var cycles = g.getCycles();

			assert.equal(cycles.length, 1);

		});
		
	});

	describe('getUnmetDependencies', function() {
		
		it('should find an unmet dependency', function() {

			var g = new DependencyGraph();

			g.addNode('A', 'v0.0.0');

			g.addDependency('A', 'B', 'v0.0.0');

			var unmetDeps = g.getUnmetDependencies();

			assert.equal(unmetDeps.length, 1);

		});
		
	});

});




/*graph.addNode('B', 'v0.1.0');
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
console.log('Ordered nodes', graph.getOrderedNodes());*/
