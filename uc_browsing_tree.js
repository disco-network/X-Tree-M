/**
 * explorer_path is an array of nodes from the root of the tree upwards, exluding the root
 */
function uc_browsing_tree(explorer_path, tree_nodes) {
  var self = this;

  // public
  self.find_children_of = find_children_of;
  self.find_siblings_of = find_siblings_of;
  self.locate = locate;
  self.locate_pivot = locate_pivot;

  // private
  self.explorer_path = explorer_path;
  self.tree_nodes = tree_nodes;

  function locate(gui_id) {
    var node = find_node_in_tree_by_gui_id(gui_id) || find_node_in_explorer_path_by_gui_id(gui_id);
    if (node === null) {
      return null;
    }

    const path = [];

    while (node !== null) {
      path.unshift(node);
      node = find_node_in_tree_by_gui_id(node.parent_gui_id) || find_node_in_explorer_path_by_gui_id(node.parent_gui_id);
    }

    return new uc_browsing_tree_position(self, path);
  }

  function locate_pivot() {
    return new uc_browsing_tree_position(self, self.explorer_path.concat([]).reverse().concat([ self.tree_nodes[0] ]));
  }

  function find_node_in_explorer_path_by_gui_id(gui_id) {
    const predicate = function (node) { return node.gui_id === gui_id };
    const node = self.explorer_path.find(predicate);

    return node || null;
  }

  function find_node_in_tree_by_gui_id(gui_id) {
    const predicate = function (node) { return node.gui_id === gui_id };
    const node = self.tree_nodes.find(predicate);

    return node || null;
  }

  function find_children_of(pos) {
    const this_node = pos.get_node();
    const predicate = function (node) { return node.parent_gui_id === this_node.gui_id };
    
    return self.tree_nodes.filter(predicate);
  }

  function find_siblings_of(pos) {
    const this_node = pos.get_node();
    const predicate = function (node) { return node.parent_gui_id === this_node.parent_gui_id };
    
    return self.tree_nodes.filter(predicate);
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
  self.locate_parent_in_tree = locate_parent_in_tree;
  self.locate_children = locate_children;
  self.locate_siblings = locate_siblings;
  self.locate_next_sibling = locate_next_sibling;

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

    const children = tree.find_children_of(self);

    return children.map(function (child) {
      return new uc_browsing_tree_position(tree, self.downward_path.concat([ child ]));
    });
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

  function locate_siblings(gui_id) {
    const node = get_node(gui_id);

    const siblings = tree.find_siblings_of(self);

    return siblings.map(function (sibling) {
      return new uc_browsing_tree_position(tree, self.downward_path.slice(0, -1).concat([ sibling ]));
    });
  }
}

