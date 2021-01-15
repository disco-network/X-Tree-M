/**
 * Tracks diff information between the current tree and some newer cache.
 */
export class TreeDiff {
  constructor(tree, new_cache) {
    this.tree = tree;
    this.new_cache = new_cache;
  }

  was_link_deleted(position) {
    const parent = position.locate_parent();
    if (parent === null) {
      return false;
    }

    const target_id = position.get_node().elem_id;
    const parent_id = parent.get_node().elem_id;

    return (
      undefined ===
      this.get_updated_child_links(parent_id).find(
        (link) => link.child_id === target_id
      )
    );
  }

  get_new_children(position) {
    const id = position.get_node().elem_id;
    const old_child_id_set = new Set(
      position.locate_children().map((child) => child.get_node().elem_id)
    );

    const updated_child_links = this.get_updated_node(id).child_links;

    if (updated_child_links === null) {
      return [];
    } else {
      return updated_child_links
        .filter((link) => !old_child_id_set.has(link.child_id))
        .map((link) => this.get_updated_node(link.child_id));
    }
  }

  get_new_name(position) {
    const id = position.get_node().elem_id;
    const updated_node = this.get_updated_node(id);

    const old_name = position.get_node().name;
    const new_name = updated_node.name;

    return old_name !== new_name ? new_name : null;
  }

  /**
   * private
   */
  get_updated_node(id) {
    if (this.new_cache.has(id)) {
      return this.new_cache.get(id);
    } else {
      throw new Error("new cache is incomplete: node " + id + " is missing");
    }
  }

  get_updated_child_links(id) {
    const node = this.get_updated_node(id);
    if (node.child_links === null) {
      throw new Error(
        "new cache is incomplete: children of " + id + " are missing"
      );
    } else {
      return node.child_links;
    }
  }
}
