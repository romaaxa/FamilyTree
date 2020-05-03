function FamilyTree() {
	var self = this;

	self.personNodes = [];

	self.addPerson = function (name, male) {
		var node = findPersonNodeByName(name);

		checkNodeNotExists(node, name);
		checkStringIsNotEmpty(name);
		checkIsBoolean(male);

		node = new PersonNode(name, male);

		node.visited = false;
		node.level = 0;

		self.personNodes.push(node);
	};

	self.marry = function (name1, name2) {
		var node1 = findPersonNodeByName(name1);
		var node2 = findPersonNodeByName(name2);

		checkNodeExists(node1, name1);
		checkNodeExists(node2, name2);
		checkNodesNotEqual(node1, node2);
		checkNotMarried(node1);
		checkNotMarried(node2);

		node1.marriagePartner = node2;
		node2.marriagePartner = node1;
	};

	self.addParentChildRelation = function (parentName, childName) {
		var parentNode = findPersonNodeByName(parentName);
		var childNode = findPersonNodeByName(childName);

		checkNodeExists(parentNode, parentName);
		checkNodeExists(childNode, childName);
		checkNodesNotEqual(parentNode, childNode);
		checkChildHasNotAlreadyParent(parentNode, childNode);
		checkCycle(parentNode, childNode);

		parentNode.children.push(childNode);

		if (parentNode.male)
			childNode.father = parentNode;
		else
			childNode.mother = parentNode;
	};

	self.querySiblings = function (name) {
		return nodesToNames(findPersonNodeByName(name).getSiblings());
	};

	self.queryCousins = function (name) {
		return nodesToNames(findPersonNodeByName(name).getCousins());
	}

	self.queryMaternalUnclesAndAunts = function (name) {
		return nodesToNames(findPersonNodeByName(name).getMaternalUnclesAndAunts());
	}

	self.queryPaternalUnclesAndAunts = function (name) {
		return nodesToNames(findPersonNodeByName(name).getPaternalUnclesAndAunts());
	}

	self.queryGrandparents = function (name) {
		return nodesToNames(findPersonNodeByName(name).getGrandparents());
	}

	self.queryGrandchildren = function (name) {
		return nodesToNames(findPersonNodeByName(name).getGrandchildren());
	}

	function findPersonNodeByName(name) {
		checkIsString(name);

		for (var i = 0; i < self.personNodes.length; i++) {
			var node = self.personNodes[i];
			if (name === node.name)
				return node;
		}

		return null;
	}

	function checkIsString(value) {
		if (typeof (value) !== "string")
			throw "Invalid Input!";
	}

	function checkIsBoolean(value) {
		if (typeof (value) !== "boolean")
			throw "Invalid Input!";
	}

	function checkStringIsNotEmpty(str) {
		if (str.trim().length === 0)
			throw "Invalid Input!";
	}

	function checkStringIsInteger(str) {
		var intVal = parseInt(str);
		if (isNaN(intVal))
			throw "Invalid Input!";
	}

	function checkNodeExists(node, name) {
		if (node === null)
			throw "'" + name + "' does not exist!";
	}

	function checkNodeNotExists(node, name) {
		if (node !== null)
			throw "'" + name + "' already exists!";
	}

	function checkNodesNotEqual(node1, node2) {
		if (node1 === node2)
			throw "The people must be different!";
	}

	function checkChildHasNotAlreadyParent(parentNode, childNode) {
		if (parentNode.male) {
			if (childNode.father !== null)
				throw "The child already has a father!";
		}
		else {
			if (childNode.mother !== null)
				throw "The child already has a mother!";
		}

		return true;
	}

	function checkNotMarried(node) {
		if (node.isMarried())
			throw "'" + node.name + "' is already married!";
	}

	function checkCycle(parentNode, childNode) {
		if (childNode.isAncestorOf(parentNode))
			throw "The relationship would create a cycle!";
	}

	function nodesToNames(nodes) {
		var names = [];
		nodes.forEach(function (node) {
			names.push(node.name);
		});
		return names;
	}

	// ----------------------------------------------------------------------------------------------------------
	// The following code converts the family tree in order to be displayed by the vis framework.
	// Therefor, we need to automatically calculate the "level" of each person which determines the hierarchy or
	// better the vertical position of the nodes.
	// ----------------------------------------------------------------------------------------------------------

	self.exportAsVisGraph = function () {
		var visNodes = [];
		var visEdges = [];

		self.personNodes.forEach(function (personNode) {
			if (!personNode.visited)
				setLevelOfConnectedComponent(personNode);
			personNode.visited = false;

			visNodes.push(personToVisNode(personNode));

			personNode.children.forEach(function (child) {
				visEdges.push({
					from: personNode.name,
					to: child.name
				});
			});

			var marriagePartner = personNode.marriagePartner;
			if (marriagePartner !== null) {
				visEdges.push({
					from: personNode.name,
					to: marriagePartner.name,
					color: "#A000A0"
				});
			}
		});

		return { nodes: visNodes, edges: visEdges };
	}

	function setLevelOfConnectedComponent(node) {
		var args = {
			lowestLevel: 0,
			nodesOfConnectedComponent: []
		};

		// Start at a random node and traverse the entire connected component to find the lowest level.
		setLevelRecursively(node, 0, args);
		// minimum level should be 0.
		normalizeLevels(args.nodesOfConnectedComponent, args.lowestLevel);
	}

	function setLevelRecursively(node, level, args) {
		node.level = level;
		node.visited = true;

		args.nodesOfConnectedComponent.push(node);

		if (level < args.lowestLevel)
			args.lowestLevel = level;

		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];

			if (!child.visited)
				setLevelRecursively(child, level + 1, args);
			else if (level + 1 > child.level)
				child.level = level + 1;
		}

		var mother = node.mother;
		if (mother !== null) {
			if (!mother.visited)
				setLevelRecursively(mother, level - 1, args);
			else if (level - 1 < mother.level)
				mother.level = level - 1;
		}

		var father = node.father;
		if (father !== null) {
			if (!father.visited)
				setLevelRecursively(father, level - 1, args);
			else if (level - 1 < father.level)
				father.level = level - 1;
		}
	}

	function normalizeLevels(nodes, lowestLevel) {
		nodes.forEach(function (node) {
			node.level -= lowestLevel;
		});
	}

	function personToVisNode(personNode) {
		var visNode = {
			id: personNode.name,
			label: personNode.name,
			level: personNode.level
		};

		if (personNode.male) {
			visNode.color = "#4682B4";
		}
		else
			visNode.color = "#FF69B4";

		return visNode;
	}
}
