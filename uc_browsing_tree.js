export function Graph(gui_node_map, node_map) {
  const self = this;

  self.gui_node_map = gui_node_map;
  self.node_map = node_map;

  self.get_gui_node = (gui_id) => {
    const gui_node = self.gui_node_map.get(gui_id) || null;
    return gui_node;
  };

  self.get_gui_parent = (gui_id) => {
    const gui_node = self.get_gui_node(gui_id);
    if (gui_node !== null) {
      return gui_node.parent_gui_id;
    } else {
      throw new Error("GUI Node not found: " + gui_id);
    }
  };

  self.get_node = (id) => {
    const node = self.node_map.get(id) || null;
    return node;
  };

  self.get_node_by_gui_id = (gui_id) => {
    const gui_node = self.get_gui_node(gui_id);

    if (gui_node === null) {
      return null;
    }
    const id = gui_node.id;
    return self.get_node(id);
  };

  /*
   * gui_id may be null to find roots
   */
  self.get_gui_children_of = (wanted_gui_id) => {
    const predicate = ([_, gui_node]) =>
      gui_node.parent_gui_id === wanted_gui_id;

    return [...self.gui_node_map.entries()]
      .filter(predicate)
      .map(([gui_id, _]) => gui_id);
  };

  /*
   * gui_id must not be null
   */
  self.get_gui_siblings_of = (gui_id) => {
    const parent_gui_id = self.get_gui_parent(gui_id);
    return self.get_gui_children_of(parent_gui_id);
  };
}

/**
 * explorer_path is an array of nodes from the pivot of the tree upwards, EXCLUDING the pivot
 * The pivot is the root of the tree (the target of the explorer path, not its root;
 * and not the selection of the tree).
 * [pivot_gui_id, ...]
 */
export function Tree(pivot_gui_id, explorer_path, graph) {
  var self = this;

  // public
  self.get_graph = get_graph;
  self.locate = locate;
  self.locate_pivot = locate_pivot;
  self.locate_using_downward_path = locate_using_downward_path;

  // private
  self.graph = graph;
  self.explorer_path = explorer_path;

  /*
   * Determines the position (path from the explorer root) of the item with the given gui_id.
   * Returns null if not found, neither in the explorer path nor the tree.
   */
  function locate(gui_id) {
    let cursor_gui_id = gui_id;
    const path = [];

    while (cursor_gui_id !== null) {
      path.unshift(cursor_gui_id);
      cursor_gui_id = graph.get_gui_parent(cursor_gui_id);
    }

    return new uc_browsing_tree_position(self, path);
  }

  function locate_pivot() {
    return locate(pivot_gui_id);
  }

  function locate_root() {
    const root_gui_id = self.graph.get_gui_children_of(null)[0];
    return self.locate(root_gui_id);
  }

  function locate_using_downward_path(downward_path) {
    const root_pos = locate_root();
    const root_id = root_pos.get_node().elem_id;

    if (root_id !== downward_path[0]) {
      return null;
    }

    let i = 1;
    let prefix_position = root_pos;
    for (; i < downward_path.length; ++i) {
      prefix_position = prefix_position.locate_child_by_id(downward_path[i]);
      if (prefix_position === null) {
        return null;
      }
    }
    return prefix_position;
  }

  function get_graph() {
    return self.graph;
  }
}

function is_prefix(prefix, array, equals_to) {
  return prefix.every(function (a, i) {
    return equals_to(a, array[i]);
  });
}

function uc_browsing_tree_position(tree, downward_path) {
  const self = this;

  self.equals_to = equals_to;
  self.get_downward_path = get_downward_path;
  self.get_gui_id = get_gui_id;
  self.get_node = get_node;
  self.is_in_tree = is_in_tree;
  self.locate_parent = locate_parent;
  self.locate_parent_in_tree = locate_parent_in_tree;
  self.locate_all_ancestors = locate_all_ancestors;
  self.locate_children = locate_children;
  self.locate_child_by_id = locate_child_by_id;
  self.locate_siblings = locate_siblings;
  self.locate_next_sibling = locate_next_sibling;
  self.locate_prev_sibling = locate_prev_sibling;

  self.tree = tree;
  self.downward_path = downward_path;

  if (self.downward_path.length === 0) {
    throw new Error("downward_path must be non-empty.");
  }

  if (
    !is_prefix(
      self.tree.explorer_path.slice(0, self.downward_path.length),
      self.downward_path,
      function (a, b) {
        return a === b;
      }
    )
  ) {
    throw new Error("downward_path is incompatible with explorer_path.");
  }

  function equals_to(other) {
    return self.tree === other.tree && self.get_gui_id() === other.get_gui_id();
  }

  function get_downward_path() {
    const graph = self.tree.get_graph();
    return self.downward_path.map(
      (gui_id) => graph.get_node_by_gui_id(gui_id).elem_id
    );
  }

  function is_in_tree() {
    return self.downward_path.length > self.tree.explorer_path.length;
  }

  function locate_parent() {
    if (self.downward_path.length < 2) {
      return null;
    }

    const parent = new uc_browsing_tree_position(
      tree,
      self.downward_path.slice(0, -1)
    );
    return parent;
  }

  function locate_parent_in_tree() {
    const parent = locate_parent();
    if (parent === null) {
      return parent;
    }

    return parent.is_in_tree() ? parent : null;
  }

  function locate_all_ancestors() {
    return self.downward_path.map(
      (_, index) =>
        new uc_browsing_tree_position(
          tree,
          self.downward_path.slice(0, index + 1)
        )
    );
  }

  function get_gui_id() {
    return self.downward_path.slice(-1)[0];
  }

  function get_node() {
    const gui_id = self.get_gui_id();
    return self.tree.get_graph().get_node_by_gui_id(gui_id);
  }

  function locate_children() {
    const children = tree.get_graph().get_gui_children_of(self.get_gui_id());

    return children.map(function (child) {
      return new uc_browsing_tree_position(
        tree,
        self.downward_path.concat([child])
      );
    });
  }

  function locate_child_by_id(id) {
    const child = locate_children().find(
      (child) => child.get_node().elem_id === id
    );
    return child !== undefined ? child : null;
  }

  function locate_prev_sibling() {
    const siblings = locate_siblings();
    const my_index = siblings.findIndex(function (pos) {
      return self.equals_to(pos);
    });

    if (my_index === -1) {
      throw new Error("Tree position is invalid: Node is not its own sibling.");
    }

    const prev_sibling = siblings[my_index - 1];
    return prev_sibling !== undefined ? prev_sibling : null;
  }

  function locate_next_sibling() {
    const siblings = locate_siblings();
    const my_index = siblings.findIndex(function (pos) {
      return self.equals_to(pos);
    });

    if (my_index === -1) {
      throw new Error("Tree position is invalid: Node is not its own sibling.");
    }

    const next_sibling = siblings[my_index + 1];
    return next_sibling !== undefined ? next_sibling : null;
  }

  function locate_siblings() {
    const siblings = tree.graph.get_gui_siblings_of(self.get_gui_id());

    return siblings.map(function (sibling) {
      return new uc_browsing_tree_position(
        tree,
        self.downward_path.slice(0, -1).concat([sibling])
      );
    });
  }
}

function GraphBuilder() {
  // abstract:
  //
  // function attach (parent_gui_id, graph); <-- returns id of the root

  this.build = function () {
    const gui_nodes = new Map();
    const nodes = new Map();
    const annotation = this.attach(null, gui_nodes, nodes);
    return {
      graph: new Graph(gui_nodes, nodes),
      annotation: annotation,
    };
  };
}

export function LinearGraphBuilder(builders, reducer) {
  this.__proto__ = new GraphBuilder();

  if (builders.length === 0) {
    throw new Error("Trying to create empty linear graph");
  }

  this.attach = function (parent_id, gui_nodes, nodes) {
    var prev_id = parent_id;
    const ids = builders.map((builder) => {
      prev_id = builder.attach(prev_id, gui_nodes, nodes);
      return prev_id;
    });
    return reducer(ids);
  };
}

export function TreeGraphBuilder(root_data, subtree_builders, reducer) {
  this.__proto__ = new GraphBuilder();

  this.attach = function (parent_id, gui_nodes, nodes) {
    const gui_node = {
      gui_id: "T" + gui_nodes.size,
      parent_gui_id: parent_id,
      id: root_data.elem_id,
    };

    gui_nodes.set(gui_node.gui_id, gui_node);

    if (!nodes.has(root_data.elem_id)) {
      nodes.set(root_data.elem_id, root_data);
    }

    const subtree_annotations = subtree_builders.map((builder) =>
      builder.attach(gui_node.gui_id, gui_nodes, nodes)
    );
    return reducer(gui_node.gui_id, subtree_annotations);
  };
}
