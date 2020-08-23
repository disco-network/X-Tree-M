import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";

function VisibleState() {

  this.set = (tree, selected, expanded) => {
    this.is_available = true;
    this.tree = tree;
    this.selected = selected;
    this.expanded = expanded;
    this.creating = null;
    this.renaming = null;
  };
  this.reset = () => {
    this.is_available = false;
    this.tree = null;
    this.selected = null;
    this.expanded = null;
    this.creating = null;
    this.renaming = null;
  };

  this.reset();

  this.begin_creating = parent_gui_id => this.creating = parent_gui_id;
  this.end_creating = () => this.creating = null;
  this.begin_renaming = gui_id => this.renaming = gui_id;
  this.end_renaming = () => this.renaming = null;

  this.can_browse = () => this.is_available && !this.creating && !this.renaming;

  this.is_valid = () => (!this.creating || !this.renaming) &&
    (!this.is_available || (typeof this.tree === "object" && typeof this.selected !== "object" && typeof this.expanded === "object")) &&
    (typeof this.is_available === "boolean");
}

export function uc_browsing_model(dispatcher, lib_data, logger) {
  var self = this;

  // public
  self.handle_key_press = handle_key_press;
  self.reload = reload;
  self.select_and_zoom = select_and_zoom;
  self.select_and_zoom_to = select_and_zoom_to;
  self.toggle_in_multiselection = toggle_in_multiselection;
  self.delete_selected = delete_selected;
  self.begin_renaming = begin_renaming;
  self.begin_creating = begin_creating;
  self.apply_name_input = apply_name_input;
  self.expand_children_of = expand_children_of;
  self.collapse_children_of = collapse_children_of;

  self.get_state = get_state;

  // private
  self.visible_state = new VisibleState();
  self.dispatcher = dispatcher;
  self.lib_data = lib_data;
  self.logger = logger;
  self.is_busy = false;
  self.path_to_root = null;
  self.action_in_clipboard = null;
  
  function get_state() {
    return self.visible_state;
  }

  function handle_key_press(key_chord) {

    if (are_single_selection_operations_available()) {
      switch (key_chord) {
        case "right":
          expand_children();
          return;
        case "left":
          collapse_children();
          return;
        case "up":
          move_selection_up();
          return;
        case "down":
          move_selection_down();
          return;
      }
    }

    if (are_browsing_operations_available()) {
      switch (key_chord) {
        case "Ctrl+L":
          copy_by_reference();
          return;
        case "Ctrl+C":
          alert("Cloning is a bad idea, so this was not implemented!");
        case "Ctrl+X":
          cut();
          break;
        case "Ctrl+V":
          if (self.action_in_clipboard !== null) {
            self.action_in_clipboard();
          }
          return;
      }
    }
  }

  function copy_by_reference() {

    if (!are_browsing_operations_available()) {
      return;
    }

    const copied_elem_ids = get_selected_elem_ids();

    self.action_in_clipboard = function() {
      if (!are_single_selection_operations_available()) {
        return;
      }

      const selected = locate_single_selected_node();

      paste_by_ref(copied_elem_ids, selected, function () {
        self.select_and_zoom_to(selected.get_node().gui_id);
      });
    };
  }

  function cut() {
    if (!are_browsing_operations_available()) {
      return;
    }

    const cut_ids = get_selected_elem_ids();
    const cut_links = get_selected_links();

    self.action_in_clipboard = function () {
      if (!are_single_selection_operations_available()) {
        return;
      }

      const selected = locate_single_selected_node();

      delete_links(cut_links, function () {
        paste_by_ref(cut_ids, selected, function () {
          self.select_and_zoom_to(selected.get_node().gui_id);
        });
      });
    };
  }

  function get_selected_elem_ids() {
    const selected = self.visible_state.selected;
    const tree = self.visible_state.tree;

    return selected.map(function (gui_id) {
      const pos = tree.locate(gui_id);
      if (pos === null) {
        console.log("ignored invalid gui_id");
        return null;
      }

      return pos.get_node().elem_id;
    }).filter(function (x) { return x !== null });
  }

  function get_selected_links() {
    const selected = self.visible_state.selected;
    const tree = self.visible_state.tree;

    return selected.map(function (gui_id) {
      const pos = tree.locate(gui_id);
      if (pos === null) {
        console.log("ignored invalid gui_id");
        return null;
      }

      const parent_pos = pos.locate_parent();
      if (parent_pos === null) {
        console.log("ignored selected item without parent");
        return null;
      }

      return { id: pos.get_node().elem_id, parent_id: parent_pos.get_node().elem_id };
    }).filter(function (x) { return x !== null });
  }

  function paste_by_ref(ids, parent_pos, cb_success) {
    ensure(are_single_selection_operations_available());

    self.is_busy = true;
    self.visible_state.reset();
    self.dispatcher.tree_changed();

    self.lib_data.command({
      src_elem: ids,
      dst_elem: parent_pos.get_node().elem_id,
      cb_success: function () {
        self.is_busy = false;
        cb_success();
      }
    }, "copy_item");
  }

  function delete_links(links, cb_success) {
    ensure(are_browsing_operations_available());

    self.is_busy = true;
    self.visible_state.reset();
    self.dispatcher.tree_changed();

    self.lib_data.command({
      links: links,
      cb_success: function () {
        self.is_busy = false;
        cb_success();
      }
    }, "delete_item");
  }

  function expand_children() {
    if (!are_single_selection_operations_available()) {
      return;
    }

    self.expand_children_of(locate_single_selected_node().get_node().gui_id);
  }

  function expand_children_of(gui_id) {
    if (!are_single_selection_operations_available()) {
      return;
    }

    self.visible_state.expanded[gui_id] = true;
    self.dispatcher.tree_changed();
  }

  function collapse_children() {
    if (!are_single_selection_operations_available()) {
      return;
    }

    self.collapse_children_of(locate_single_selected_node().get_node().gui_id);
  }


  function collapse_children_of(gui_id) {
    ensure(are_single_selection_operations_available(), "");

    delete self.visible_state.expanded[gui_id];
    self.dispatcher.tree_changed();
  }

  function move_selection_up() {
    ensure(are_single_selection_operations_available(), "");

    const position = locate_single_selected_node();
    const prev_pos = locate_node_before(position);

    if (prev_pos !== null && prev_pos.is_in_tree()) {
      const old_selection = self.visible_state.selected;
      self.visible_state.selected = [ prev_pos.get_node().gui_id ];

      self.dispatcher.tree_changed();
    } else if (prev_pos !== null) {
      self.select_and_zoom_to(prev_pos.get_node().gui_id);
    }
  }

  function move_selection_down() {
    ensure(are_single_selection_operations_available(), "");

    const position = locate_single_selected_node();
    const next_pos = locate_node_after(position);

    if (next_pos !== null && next_pos.is_in_tree()) {
      const old_selection = self.visible_state.selected;
      self.visible_state.selected = [ next_pos.get_node().gui_id ];

      self.dispatcher.tree_changed();
    }
  }

  function locate_node_before(position) {
    const prev_sibling = position.locate_prev_sibling();
    if (prev_sibling !== null) {
      return locate_last_grandchild(prev_sibling);
    }

    const parent = position.locate_parent();
    if (parent !== null) {
      return parent;
    }

    return null;
  }

  function locate_last_grandchild(position) {
    const visible_children = locate_visible_children(position);
    if (visible_children.length > 0) {
      return locate_last_grandchild(visible_children.slice(-1)[0]);
    } else {
      return position;
    }
  }

  function locate_node_after(position, include_children) {
    if (include_children === undefined) {
      include_children = true;
    }

    if (include_children) {
      const children = locate_visible_children(position);
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
      return locate_node_after(parent, false);
    }

    return null;
  }

  function locate_visible_children(position) {
    const gui_id = position.get_node().gui_id;

    if (!position.is_in_tree() || self.visible_state.expanded[gui_id]) {
      return position.locate_children();
    }

    return [];
  }

  function is_single_selection() {
    return self.visible_state.selected.length === 1;
  }

  function locate_single_selected_node() {
    ensure(is_single_selection(), "");

    const selected = self.visible_state.selected;
    const tree = self.visible_state.tree;

    const gui_id = selected[0];
    return tree.locate(gui_id);
  }

  function reload() {
    select_and_zoom(self.path_to_root);
  }

  function select_and_zoom(path) {
    ensure(!self.is_busy, "Cannot reload the tree because it is busy.");
    ensure(are_browsing_operations_available(), "");

    self.is_busy = true;
    self.path_to_root = path;
    self.visible_state.reset();

    self.lib_data.command({
      path,
      cb_success: function(tree) {
        self.is_busy = false;
        const gui_id = tree.locate_pivot().get_node().gui_id;
        const expanded  = { [gui_id]: true };
        const selected = [ gui_id ];
        self.visible_state.set(tree, selected, expanded);

        // seems strange to use the elem_id here..?
        self.dispatcher.tree_changed();
      }
    }, "req_tree_only");

    self.dispatcher.tree_changed();
  }

  function select_and_zoom_to(gui_id) {
    self.select_and_zoom(path_to(gui_id));
  }

  function toggle_in_multiselection(gui_id) {
    if (!are_browsing_operations_available()) {
      return;
    }

    const old_selection = self.visible_state.selected;
    const selection_with_deselected_element = self.visible_state.selected.filter(function (id) { return gui_id !== id });
    const was_present_in_old_selection = old_selection.length > selection_with_deselected_element.length;

    if (was_present_in_old_selection) {
      self.visible_state.selected = selection_with_deselected_element;
    } else {
      self.visible_state.selected = [ gui_id ].concat(old_selection);
    }

    self.dispatcher.tree_changed();
  }

  function delete_selected() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");

    const selected = locate_single_selected_node();
    const parent = selected.locate_parent();

    if (parent === null) {
      return;
    }

    self.is_busy = true;
    self.visible_state.reset();
    self.dispatcher.tree_changed();
    self.lib_data.command({
      links: [{id: selected.get_node().elem_id, parent_id: parent.get_node().elem_id}],
      cb_success: after_deletion,
    }, "delete_item");

    function after_deletion() {
      self.is_busy = false;
      self.select_and_zoom_to(parent.get_node().gui_id);
    }
  }

  function begin_creating() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");
    ensure(is_single_selection(), "");

    expand_children();

    const selected = locate_single_selected_node().get_node();

    self.visible_state.creating = selected.gui_id;
    self.dispatcher.tree_changed();
  }

  function begin_renaming() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");

    const selected = locate_single_selected_node().get_node();

    self.visible_state.renaming = selected.gui_id;
    self.dispatcher.tree_changed();
  }

  function apply_name_input(name) {
    const rename = self.visible_state.renaming !== null;
    const create = self.visible_state.creating !== null;
    ensure(rename || create);
    ensure(!rename || !create);
    ensure(!self.is_busy, "");
    ensure(is_single_selection(), "");

    self.visible_state.renaming = self.visible_state.creating = null;

    const selected = locate_single_selected_node().get_node();

    self.is_busy = true;
    self.visible_state.reset();
    self.dispatcher.tree_changed();

    if (rename) {
      self.lib_data.command({
        elem_id: selected.elem_id,
        field_id: "name",
        content: name,
        cb_success: after_operation,
      }, "change_item_field");
    } else {
      self.lib_data.command({
        parent_elem_id: selected.elem_id,
        name: name,
        type: c_LANG_LIB_TREE_ELEMTYPE[1][0],
        cb_success: after_operation,
      }, "create_item");
    }

    function after_operation() {
      self.is_busy = false;
      self.select_and_zoom(self.path_to_root);
    }
  }

  function are_single_selection_operations_available() {
    return are_browsing_operations_available() && is_single_selection();
  }

  function are_browsing_operations_available() {
    return !self.is_busy && self.visible_state.creating === null && self.visible_state.renaming === null;
  }

  function path_to(gui_id) {
    return self.visible_state.tree.locate(gui_id).get_downward_path();
  }

  function error(msg) {
    self.logger(msg);
    alert("Error: " + msg);
    throw new Error(msg);
  }

  function ensure(condition, msg) {
    if (!condition) error(msg);
  }
}
