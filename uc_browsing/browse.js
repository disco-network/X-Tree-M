import { Path } from "./state.js";

export function BrowsingSaga(dispatcher, state, request_tree) {
  this.is_busy = false;
  this.path_to_root = null;
  this.state = state;
  this.dispatcher = dispatcher;

  this.toggle_in_multiselection = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    const position = this.state.tree.locate(gui_id);
    const toggled_path = new Path(position.get_downward_path());
    this.state.selected.toggle(toggled_path);

    this.dispatcher.tree_changed();
  }


  this.expand_children = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    this.expand_children_of(this.state.locate_single_selected().get_gui_id());
  }

  this.expand_children_of = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    this.state.expanded[gui_id] = true;
    this.dispatcher.tree_changed();
  }

  this.collapse_children = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    this.collapse_children_of(this.state.locate_single_selected().get_gui_id());
  }

  this.collapse_children_of = (gui_id) => {
    if (!this.are_browsing_operations_available()) {
      return;
    }

    delete this.state.expanded[gui_id];
    this.dispatcher.tree_changed();
  }

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
  }

  this.are_single_selection_operations_available = () => {
    return this.are_browsing_operations_available() && this.state.is_single_selection();
  }

  this.are_browsing_operations_available = () => {
    return this.state.is_available && !this.is_busy && this.state.operation === "browse";
  }

  this.move_selection_up = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    const position = this.state.locate_single_selected();
    const prev_pos = this.locate_node_before(position);

    if (prev_pos !== null && prev_pos.is_in_tree()) {
      const selected_path = new Path(prev_pos.get_downward_path());

      this.state.selected.clear();
      this.state.selected.add(selected_path);

      this.dispatcher.tree_changed();
    } else if (prev_pos !== null) {
      this.select_and_zoom_to(prev_pos.get_gui_id());
    }
  }

  this.move_selection_down = () => {
    if (!this.are_single_selection_operations_available()) {
      return;
    }

    const position = this.state.locate_single_selected();
    const next_pos = this.locate_node_after(position);

    if (next_pos !== null && next_pos.is_in_tree()) {
      const selected_path = new Path(next_pos.get_downward_path());

      this.state.selected.clear();
      this.state.selected.add(selected_path);

      this.dispatcher.tree_changed();
    }
  }

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
  }

  this.locate_last_grandchild = (position) => {
    const visible_children = this.locate_visible_children(position);
    if (visible_children.length > 0) {
      return this.locate_last_grandchild(visible_children.slice(-1)[0]);
    } else {
      return position;
    }
  }

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
  }

  this.locate_visible_children = (position) => {
    const gui_id = position.get_gui_id();

    if (!position.is_in_tree() || this.state.expanded[gui_id]) {
      return position.locate_children();
    }

    return [];
  }

  this.is_single_selection = () => {
    return this.state.selected.size() === 1;
  }

  this.reload = () => {
    this.select_and_zoom(this.path_to_root);
  }

  this.select_and_zoom = (path) => {
    if (this.is_busy) {
      return;
    }

    this.is_busy = true;
    this.path_to_root = path;
    this.state.reset();

    request_tree(path, (tree) => {
        this.is_busy = false;
        const gui_id = tree.locate_pivot().get_gui_id();
        const expanded  = { [gui_id]: true };
        this.state.set(tree, expanded);

        const pivot_path = new Path(tree.locate_pivot().get_downward_path());
        this.state.selected.add(pivot_path);

        this.dispatcher.tree_changed();
      });

    this.dispatcher.tree_changed();
  };

  this.select_and_zoom_to = (gui_id) => {
    this.select_and_zoom(this.state.tree.locate(gui_id).get_downward_path());
  }
}

