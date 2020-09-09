import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";
import { LinearGraphBuilder, TreeGraphBuilder, Tree } from "./uc_browsing_tree.js";

const DEFAULT_TYPE = c_LANG_LIB_TREE_ELEMTYPE[1][0];

export function Database() {

  /**
   * (private)
   * Maps IDs to Nodes.
   * Node schema:
   *   elem_id
   *   name
   *   description
   *   eval
   *   child_links
   *     is_deleted
   *     child_id
   */
  this.nodes = new Map();

  /**
   * (public)
   * Call this function to prepare the available nodes.
   * For the node schema, see this.nodes above.
   */
  this.set_nodes = (nodes) => {
    this.nodes = nodes;
  };

  /**
   * (public)
   * Create the tree object that is associated to the given path.
   *
   * Arguments:
   *   downward_path: the downward explorer path including the pivot node (=root of the actual tree)
   *
   * The created node objects have the following attributes and are read-only:
   *   elem_id, name, description, type, is_deleted, isMultiPar, eval, gui_id, parent_gui_id.
   */
  this.get_tree = (downward_path) => {
    
    const downward_explorer_path = downward_path.slice(0, -1);
    const pivot_id = downward_path.slice(-1)[0];
    const upper_explorer_path = downward_explorer_path.slice(0, -1);
    const pivot_parent_id = downward_explorer_path.slice(-1)[0];
    const tree_origin_id = pivot_parent_id !== undefined ? pivot_parent_id : pivot_id;
    const depth = pivot_parent_id !== undefined ? 10 : 9;

    const upper_builders = upper_explorer_path
      .map(id => this.get_tree_builder(id, 0, 0));

    const lower_builders = [this.get_tree_builder(tree_origin_id, 0, depth)];

    const builder = new LinearGraphBuilder(upper_builders.concat(lower_builders), gui_id_list => gui_id_list);
    const result = builder.build();
    const graph = result.graph;

    let explorer_path;
    let pivot_parent_gui_id;
    if (pivot_parent_id !== undefined) {
      explorer_path = result.annotation.slice().reverse();
      pivot_parent_gui_id = explorer_path[0];
    } else {
      explorer_path = result.annotation.slice(0, -1).reverse();
      pivot_parent_gui_id = null;
    }

    const pivot_siblings = graph.get_gui_children_of(pivot_parent_gui_id);
    const pivot_gui_id = pivot_siblings
      .find(gui_id => graph.get_node_by_gui_id(gui_id).elem_id === pivot_id);

    const tree = new Tree(
      pivot_gui_id,
      explorer_path,
      result.graph,
    );

    return tree;
  };

  this.create_tree_item = (parent_elem_id, name, type) => {
    // Generate a unique ID
    let numeric_id = 0;
    let id;
    do {
      id = "ID_" + numeric_id++;
    } while (this.nodes.has(id));

    // Create the node
    const node = {
      elem_id: id,
      name: name,
      description: "",
      type: type,
      eval: [],
      child_links: []
    }
    this.nodes.set(id, node);

    // Link to the parent
    if (parent_elem_id !== null) {
      this.nodes.get(parent_elem_id).child_links.push({is_deleted: 0, child_id: id});
    }
    return id;
  };

  // private
  this.get_tree_builder = (id, is_deleted, depth) => {
    if (depth < 0) {
      throw new Error("invalid depth");
    }

    const load_children = depth > 0;
    const raw_node = this.nodes.get(id);
    const node = this.create_node(id, raw_node, is_deleted);

    const subtree_builders = load_children
      ? raw_node.child_links.map(link => this.get_tree_builder(link.child_id, link.is_deleted, depth - 1))
      : [];

    return new TreeGraphBuilder(node, subtree_builders, (node_gui_id, children_gui_ids) => node_gui_id);
  }

  // private
  this.create_node = (id, raw_node, is_deleted) => {
    const node = {
      elem_id: id,
      name: raw_node.name,
      description: raw_node.description,
      type: DEFAULT_TYPE,
      is_deleted: is_deleted,
      isMultiPar: false,
      eval: raw_node.eval,
    };
    return node;
  };
}

/**
 * An in-memory data provider.
 *
 * Its main purpose is the uncomplicated use in tests.
 */
export function lib_data_client() {

  this.database = new Database();

  /**
   * (public)
   * Call this function to prepare the available nodes.
   * For the node schema, see Database above.
   */
  this.set_nodes = (nodes) => {
    this.database.set_nodes(nodes);
  };

  /**
   * (public)
   * Create the tree object that is associated to the given path.
   *
   * Arguments: a single params object containing attributes
   *   path: the downward explorer path including the pivot node (=root of the actual tree)
   *   cb_success: callback that will be called after a successful request. The first argument will be the tree.
   *
   * The created node objects have the following attributes:
   *   elem_id, name, description, type, is_deleted, isMultiPar, eval, gui_id, parent_gui_id.
   */
  this.req_tree_only = ({ path, cb_success }) => {
    const tree = this.database.get_tree(path);
    setTimeout(() => cb_success(tree));
  };

  this.create_tree_item = ({ parent_elem_id, name, type, cb_success }) => {
    const id = this.database.create_tree_item(parent_elem_id, name, type);
    setTimeout(() => cb_success(id));
  };
}
