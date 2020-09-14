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
      throw new Error("new cache is incomplete: children of " + id + " are missing");
    } else {
      return node.child_links;
    }
  }
}
