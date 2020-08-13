function Graph (nodes) {
  const self = this;

  self.node_dict = {};
  self.node_arr = nodes;
  nodes.forEach(node => {
    self.node_dict[node.gui_id] = node;
  });

  self.find_node_by_gui_id = function find_node_by_gui_id (gui_id) {
    return self.node_dict[gui_id] || null;
  };

  /*
   * gui_id may be null to find roots
   */
  self.find_children_of = function find_children_of(gui_id) {
    const predicate = function (node) { return node.parent_gui_id === gui_id };
    
    return self.node_arr.filter(predicate);
  }

  /*
   * gui_id must not be null
   */
  self.find_siblings_of = function find_siblings_of(gui_id) {
    const node = self.find_node_by_gui_id(gui_id);
    const parent_gui_id = node.parent_gui_id;
    const predicate = function (node) { return node.parent_gui_id === parent_gui_id };
    
    return self.node_arr.filter(predicate);
  }
}

/**
 * explorer_path is an array of nodes from the pivot of the tree upwards, EXCLUDING the pivot
 * The pivot is the root of the tree (the target of the explorer path, not its root;
 * and not the selection of the tree).
 * [pivot_gui_id, ...]
 */
function uc_browsing_tree(pivot_gui_id, explorer_path, graph) {
  var self = this;

  // public
  self.get_graph = get_graph;
  self.locate = locate;
  self.locate_pivot = locate_pivot;

  // private
  self.graph = graph;
  self.explorer_path = explorer_path.map(id => graph.find_node_by_gui_id(id));

  /*
   * Determines the position (path from the explorer root) of the item with the given gui_id.
   * Returns null if not found, neither in the explorer path nor the tree.
   */
  function locate(gui_id) {
    var node = graph.find_node_by_gui_id(gui_id);
    if (node === null) {
      return null;
    }

    const path = [];

    while (node !== null) {
      path.unshift(node);
      node = graph.find_node_by_gui_id(node.parent_gui_id);
    }

    return new uc_browsing_tree_position(self, path);
  }

  function locate_pivot() {
    return locate(pivot_gui_id);
  }

  function get_graph() {
    return self.graph;
  }
}

function is_prefix(prefix, array, equals_to) {
  return prefix.every(function (a, i) { return equals_to(a, array[i]) });
}

function uc_browsing_tree_position(tree, downward_path) {
  const self = this;

  self.equals_to = equals_to;
  self.get_downward_path = get_downward_path;
  self.get_node = get_node;
  self.is_in_tree = is_in_tree;
  self.locate_parent = locate_parent;
  self.locate_parent_in_tree = locate_parent_in_tree;
  self.locate_children = locate_children;
  self.locate_siblings = locate_siblings;
  self.locate_next_sibling = locate_next_sibling;
  self.locate_prev_sibling = locate_prev_sibling;

  self.tree = tree;
  self.downward_path = downward_path;

  if (self.downward_path.length === 0) {
    throw new Error("downward_path must be non-empty.");
  }

  if (!is_prefix(self.tree.explorer_path.concat([]).reverse().slice(0, self.downward_path.length), self.downward_path, function (a, b) { return a.gui_id === b.gui_id })) {
    throw new Error("downward_path is incompatible with explorer_path.");
  }

  function equals_to(other) {
    return self.tree === other.tree && self.get_node().gui_id === other.get_node().gui_id;
  }

  function get_downward_path() {
    return self.downward_path
      .map(function (node) { return node.elem_id });
  }

  function is_in_tree() {
    return self.downward_path.length > self.tree.explorer_path.length;
  }
  
  function locate_parent() {
    if (self.downward_path.length < 2) {
      return null;
    }

    const parent = new uc_browsing_tree_position(tree, self.downward_path.slice(0, -1));
    return parent;
  }

  function locate_parent_in_tree() {
    const parent = locate_parent();
    if (parent === null) {
      return parent;
    }
    
    return parent.is_in_tree()
      ? parent
      : null;
  }

  function get_node() {
    return self.downward_path.slice(-1)[0];
  }

  function locate_children() {
    const node = get_node();

    const children = tree.graph.find_children_of(self.get_node().gui_id);

    return children.map(function (child) {
      return new uc_browsing_tree_position(tree, self.downward_path.concat([ child ]));
    });
  }

  function locate_prev_sibling() {
    const siblings = locate_siblings();
    const my_index = siblings.findIndex(function (pos) { return self.equals_to(pos) });
    
    if (my_index === -1) {
      throw new Error("Tree position is invalid: Node is not its own sibling.");
    }

    const prev_sibling = siblings[my_index - 1];
    return prev_sibling !== undefined ? prev_sibling : null;
  }

  function locate_next_sibling() {
    const siblings = locate_siblings();
    const my_index = siblings.findIndex(function (pos) { return self.equals_to(pos) });
    
    if (my_index === -1) {
      throw new Error("Tree position is invalid: Node is not its own sibling.");
    }

    const next_sibling = siblings[my_index + 1];
    return next_sibling !== undefined ? next_sibling : null;
  }

  function locate_siblings() {
    const siblings = tree.graph.find_siblings_of(self.get_node().gui_id);

    return siblings.map(function (sibling) {
      return new uc_browsing_tree_position(tree, self.downward_path.slice(0, -1).concat([ sibling ]));
    });
  }
}

function GraphBuilder () {
  // abstract:
  //
  // function attach (parent_gui_id, graph); <-- returns id of the root
  
  this.build = function () {
    const nodes = [];
    const annotation = this.attach(null, nodes);
    return {
      graph: new Graph(nodes),
      annotation: annotation
    };
  };
}

function LinearGraphBuilder (builders, reducer) {
  this.__proto__ = new GraphBuilder();

  if (builders.length === 0) {
    throw new Error("Trying to create empty linear graph");
  }

  this.attach = function (parent_id, nodes) {
    var prev_id = parent_id;
    const ids = builders.map(builder => {
      prev_id = builder.attach(prev_id, nodes);
      return prev_id;
    });
    return reducer(ids);
  };
}

function TreeGraphBuilder (root_data, subtree_builders, reducer) {
  this.__proto__ = new GraphBuilder();

  this.attach = function (parent_id, nodes) {
    const root = {
      gui_id: "T" + nodes.length,
      parent_gui_id: parent_id,
      ...root_data
    };
    nodes.push(root);
    const subtree_annotations = subtree_builders.map(builder => builder.attach(root.gui_id, nodes));
    return reducer(root.gui_id, subtree_annotations);
  };
}

