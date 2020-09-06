import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";
import { LinearGraphBuilder, TreeGraphBuilder, Tree } from "./uc_browsing_tree.js";

const DEFAULT_TYPE = c_LANG_LIB_TREE_ELEMTYPE[1][0];

export function lib_data_client() {

  /**
   * Maps IDs to Nodes.
   * Node schema:
   *   elem_id
   *   name
   *   description
   *   eval
   *   child_links
   *     is_deleted
   *     child_id
   **/
  this.nodes = new Map();

  this.set_nodes = (nodes) => {
    this.nodes = nodes;
  };

  this.req_tree_only = ({ path, cb_success }) => {
    
    const downward_explorer_path = path.slice(0, -1);
    const upper_explorer_path = downward_explorer_path.slice(0, -1);
    const pivot_parent_id = downward_explorer_path.slice(-1)[0];
    const pivot_id = path.slice(-1)[0];
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

    const pivot_siblings = graph.find_children_of(pivot_parent_gui_id);
    const pivot = pivot_siblings.find(sibling => sibling.elem_id === pivot_id);

    const tree = new Tree(
      pivot.gui_id,
      explorer_path,
      result.graph,
    );

    setTimeout(() => cb_success(tree));
  };

  this.get_tree_builder = (id, is_deleted, depth) => {
    if (depth < 0) {
      throw new Error("invalid depth");
    }

    const raw_node = this.nodes.get(id);
    const node = this.create_node(id, raw_node, is_deleted);

    const subtree_builders = depth > 0
      ? raw_node.child_links.map(link => this.get_tree_builder(link.child_id, link.is_deleted, depth - 1))
      : [];

    return new TreeGraphBuilder(node, subtree_builders, (node_gui_id, children_gui_ids) => node_gui_id);
  }

  this.create_node = (id, raw_node, is_deleted) => {
    const node = {
      elem_id: id,
      name: raw_node.name,
      description: raw_node.description,
      type: DEFAULT_TYPE,
      is_deleted: is_deleted,
      isMultiPar: false,
      eval: raw_node.eval
    };
    return node;
  };
}
