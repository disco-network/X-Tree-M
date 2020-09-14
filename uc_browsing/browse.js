import { Graph, Tree } from "../uc_browsing_tree.js";
import { TreeDiff } from "./diff.js";

export function BrowsingSaga(dispatcher, state, cache_manager) {
  // Constructor, is called after initializing the methods
  this.init = () => {
    this.path_to_root = null;
    this.state = state;
    this.dispatcher = dispatcher;
    this.cache_manager = cache_manager;
    this.cache_manager_unsubscribe = this.cache_manager.subscribe(
      this.change_cache
    );
  };

  this.toggle_in_multiselection = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    const position = this.state.tree.locate(gui_id);
    const toggled_path = position.get_downward_path();
    this.state.selected.toggle(toggled_path);

    this.dispatcher.tree_changed();
  };

  this.expand_children = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    this.expand_children_of(this.state.locate_single_selected().get_gui_id());
  };

  this.expand_children_of = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    const pos = this.state.tree.locate(gui_id);
    this.state.expanded.add(pos.get_downward_path());
    this.update_tree();
  };

  this.collapse_children = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    this.collapse_children_of(this.state.locate_single_selected().get_gui_id());
  };

  this.collapse_children_of = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    const pos = this.state.tree.locate(gui_id);
    delete this.state.expanded.remove(pos.get_downward_path());
    this.dispatcher.tree_changed();
  };

  this.handle_key_press = (key_chord) => {
    if (this.are_single_selection_operations_available()) {
      switch (key_chord) {
        case "right":
          this.expand_children();
          return;
        case "left":
          this.collapse_children();
          return;
        case "up":
          this.move_selection_up();
          return;
        case "down":
          this.move_selection_down();
          return;
      }
    }
  };

  this.are_single_selection_operations_available = () => {
    return (
      this.are_browsing_operations_available() &&
      this.state.is_single_selection()
    );
  };

  this.are_browsing_operations_available = () => {
    return this.state.is_available && this.state.operation === "browse";
  };

  this.move_selection_up = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    const position = this.state.locate_single_selected();
    const prev_pos = this.locate_node_before(position);

    if (prev_pos !== null && prev_pos.is_in_tree()) {
      const selected_path = prev_pos.get_downward_path();

      this.state.selected.clear();
      this.state.selected.add(selected_path);

      this.dispatcher.tree_changed();
    } else if (prev_pos !== null) {
      this.select_and_zoom_to(prev_pos.get_gui_id());
    }
  };

  this.move_selection_down = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    const position = this.state.locate_single_selected();
    const next_pos = this.locate_node_after(position);

    if (next_pos !== null && next_pos.is_in_tree()) {
      const selected_path = next_pos.get_downward_path();

      this.state.selected.clear();
      this.state.selected.add(selected_path);

      this.dispatcher.tree_changed();
    }
  };

  this.locate_node_before = (position) => {
    const prev_sibling = position.locate_prev_sibling();
    if (prev_sibling !== null) {
      return this.locate_last_grandchild(prev_sibling);
    }

    const parent = position.locate_parent();
    if (parent !== null) {
      return parent;
    }

    return null;
  };

  this.locate_last_grandchild = (position) => {
    const visible_children = this.locate_visible_children(position);
    if (visible_children.length > 0) {
      return this.locate_last_grandchild(visible_children.slice(-1)[0]);
    } else {
      return position;
    }
  };

  this.locate_node_after = (position, include_children) => {
    if (include_children === undefined) {
      include_children = true;
    }

    if (include_children) {
      const children = this.locate_visible_children(position);
      if (children.length > 0) {
        return children[0];
      }
    }

    const next_sibling = position.locate_next_sibling();
    if (next_sibling !== null) {
      return next_sibling;
    }

    const parent = position.locate_parent();
    if (parent !== null) {
      return this.locate_node_after(parent, false);
    }

    return null;
  };

  this.locate_visible_children = (position) => {
    const gui_id = position.get_gui_id();
    const pos = this.state.tree.locate(gui_id);

    if (
      !position.is_in_tree() ||
      this.state.expanded.has(pos.get_downward_path())
    ) {
      return position.locate_children();
    }

    return [];
  };

  this.is_single_selection = () => {
    return this.state.selected.size() === 1;
  };

  this.reload = () => {
    this.select_and_zoom(this.path_to_root);
  };

  this.adopt_newest_cache = () => {
    this.cache_manager.adopt_newest_cache();
  };

  this.select_and_zoom = (path) => {
    this.state.selected.clear();
    this.state.selected.add(path);
    this.state.expanded.clear();
    this.state.expanded.add(path);
    this.change_path(path);
  };

  this.select_and_zoom_to = (gui_id) => {
    this.select_and_zoom(this.state.tree.locate(gui_id).get_downward_path());
  };

  this.get_eager_loading_list = () => {
    const ids =
      this.state.tree !== null
        ? new Set(
            [...this.get_visible_positions()].map(
              (pos) => pos.get_node().elem_id
            )
          )
        : new Set(this.path_to_root);

    return [{ ids: [...ids], depth: 2 }];
  };

  this.get_visible_positions = () => {
    const tree = this.state.tree;
    let expanded_positions = new Set();
    let visible_positions = new Set();

    const pivot = tree.locate_pivot();
    const pivot_parent = pivot.locate_parent();
    const expansion_root = pivot_parent !== null ? pivot_parent : pivot;

    pivot.locate_all_ancestors().forEach((ancestor) => {
      visible_positions.add(ancestor);
    });

    expanded_positions.add(expansion_root);
    expanded_positions.forEach((position) => {
      const children = position.locate_children();
      children.forEach((child) => {
        visible_positions.add(child);
        if (this.state.expanded.has(child.get_downward_path())) {
          expanded_positions.add(child);
        }
      });
    });

    return visible_positions;
  };

  this.change_path = (new_path) => {
    this.path_to_root = new_path;
    this.update_tree();
  };

  this.change_cache = () => {
    this.update_tree();
  };

  this.update_tree = () => {
    const cache = this.cache_manager.get_cache();
    const newest_cache = this.cache_manager.get_newest_cache();
    const path_to_root = this.path_to_root;

    this.state.tree = compute_gui_tree(cache, path_to_root);
    this.state.diff = new TreeDiff(this.state.tree, newest_cache);
    this.state.is_available = this.state.tree !== null;

    this.cache_manager.eager_loading_list_changed(
      this.get_eager_loading_list()
    );
    this.dispatcher.tree_changed();
  };

  function compute_gui_tree(cache, path_to_root) {
    const is_navigation_available = path_to_root.every((id) => cache.has(id));
    if (!is_navigation_available) {
      return null;
    }

    const gui_nodes = new Map();

    const navigation_ids = path_to_root.slice(0, -1);
    const pivot_id = path_to_root.slice(-1)[0];
    const navigation_path = add_navigation_bar(navigation_ids);
    let pivot_gui_id;
    if (navigation_path.length > 0) {
      const parent_id = navigation_ids.slice(-1)[0];
      const parent_gui_id = navigation_path.slice(-1)[0];
      const child_map = add_subtrees_below(
        parent_gui_id,
        navigation_ids,
        cache.get(parent_id)
      );
      pivot_gui_id = child_map.has(pivot_id) ? child_map.get(pivot_id) : null;
    } else {
      pivot_gui_id = add_tree_below(null, [], cache.get(path_to_root[0]));
    }

    const graph = new Graph(gui_nodes, cache);

    return new Tree(pivot_gui_id, navigation_path, graph);

    function add_navigation_bar(navigation_ids) {
      let parent_gui_id = null;
      return navigation_ids.map(
        (id) => (parent_gui_id = add_node(parent_gui_id, cache.get(id)).gui_id)
      );
    }

    function add_node(parent_gui_id, data) {
      const gui_id =
        parent_gui_id === null
          ? "Tree->" + data.elem_id
          : parent_gui_id + "->" + data.elem_id;

      const gui_node = {
        gui_id: gui_id,
        parent_gui_id: parent_gui_id,
        id: data.elem_id,
      };
      gui_nodes.set(gui_node.gui_id, gui_node);
      return gui_node;
    }

    function add_tree_below(parent_gui_id, path_to_parent, data) {
      const my_gui_node = add_node(parent_gui_id, data);
      const my_gui_id = my_gui_node.gui_id;
      const my_path = [...path_to_parent, my_gui_node.id];

      const are_children_available = data.child_links !== null;

      if (are_children_available) {
        add_subtrees_below(my_gui_id, my_path, data);
      }

      return my_gui_id;
    }

    function add_subtrees_below(parent_gui_id, path_to_parent, data) {
      return new Map(
        data.child_links.map((link) => {
          return [
            link.child_id,
            add_tree_below(
              parent_gui_id,
              path_to_parent,
              cache.get(link.child_id)
            ),
          ];
        })
      );
    }
  }

  this.init();
}
