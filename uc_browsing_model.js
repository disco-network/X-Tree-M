import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";

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

  self.is_loading = is_loading;
  self.get_tree = get_tree;
  self.get_selected_gui_ids = get_selected_gui_ids;
  self.get_expanded_gui_ids = get_expanded_gui_ids;
  self.get_creating_parent = get_creating_parent;
  self.get_renaming_node = get_renaming_node;

  // private
  self.dispatcher = dispatcher;
  self.lib_data = lib_data;
  self.logger = logger;
  self.is_busy = false;
  self.is_tree_ready = false;
  self.renaming_gui_id = null;
  self.creating_below_gui_id = null;
  self.path_to_root = null;
  self.selected_gui_ids = null;
  self.action_in_clipboard = null;

  self.tree = null;
  self.expanded_node_gui_ids = null;

  function is_loading() {
    return self.is_tree_ready;
  }
  
  function get_tree() {
    return self.tree;
  }

  function get_selected_gui_ids() {
    return self.selected_gui_ids;
  }

  function get_expanded_gui_ids() {
    return self.expanded_node_gui_ids;
  }

  function get_creating_parent() {
    return self.creating_below_gui_id;
  }

  function get_renaming_node() {
    return self.renaming_gui_id;
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
    return self.selected_gui_ids.map(function (gui_id) {
      const pos = self.tree.locate(gui_id);
      if (pos === null) {
        console.log("ignored invalid gui_id");
        return null;
      }

      return pos.get_node().elem_id;
    }).filter(function (x) { return x !== null });
  }

  function get_selected_links() {
    return self.selected_gui_ids.map(function (gui_id) {
      const pos = self.tree.locate(gui_id);
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
    self.is_tree_ready = false;
    self.lib_data.command({
      src_elem: ids,
      dst_elem: parent_pos.get_node().elem_id,
      cb_success: function () {
        self.is_busy = false;
        cb_success();
      }
    }, "copy_item");

    self.dispatcher.tree_changed();
  }

  function delete_links(links, cb_success) {
    ensure(are_browsing_operations_available());

    self.is_busy = true;
    self.is_tree_ready = false;
    self.lib_data.command({
      links: links,
      cb_success: function () {
        self.is_busy = false;
        cb_success();
      }
    }, "delete_item");

    self.dispatcher.tree_changed();
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

    self.expanded_node_gui_ids[gui_id] = true;
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

    delete self.expanded_node_gui_ids[gui_id];
    self.dispatcher.tree_changed();
  }

  function move_selection_up() {
    ensure(are_single_selection_operations_available(), "");

    const position = locate_single_selected_node();
    const prev_pos = locate_node_before(position);

    if (prev_pos !== null && prev_pos.is_in_tree()) {
      const old_selection = self.selected_gui_ids;
      self.selected_gui_ids = [ prev_pos.get_node().gui_id ];

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
      const old_selection = self.selected_gui_ids;
      self.selected_gui_ids = [ next_pos.get_node().gui_id ];

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

    if (!position.is_in_tree() || self.expanded_node_gui_ids[gui_id]) {
      return position.locate_children();
    }

    return [];
  }

  function is_single_selection() {
    return self.selected_gui_ids.length === 1;
  }

  function locate_single_selected_node() {
    ensure(is_single_selection(), "");

    const gui_id = self.selected_gui_ids[0];
    return self.tree.locate(gui_id);
  }

  function reload() {
    select_and_zoom(self.path_to_root);
  }

  function select_and_zoom(path) {
    ensure(!self.is_busy, "Cannot reload the tree because it is busy.");
    ensure(are_browsing_operations_available(), "");

    self.is_busy = true;
    self.is_tree_ready = false;
    self.path_to_root = path;

    self.lib_data.command({
      path,
      cb_success: function(tree) {
        self.is_busy = false;
        self.tree = tree;

        const gui_id = self.tree.locate_pivot().get_node().gui_id;
        self.expanded_node_gui_ids = { [gui_id]: true };
        self.selected_gui_ids = [ gui_id ];
        self.is_tree_ready = true;

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

    const old_selection = self.selected_gui_ids;
    const selection_with_deselected_element = self.selected_gui_ids.filter(function (id) { return gui_id !== id });
    const was_present_in_old_selection = old_selection.length > selection_with_deselected_element.length;

    if (was_present_in_old_selection) {
      self.selected_gui_ids = selection_with_deselected_element;
    } else {
      self.selected_gui_ids = [ gui_id ].concat(old_selection);
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
    self.is_tree_ready = false;
    self.lib_data.command({
      links: [{id: selected.get_node().elem_id, parent_id: parent.get_node().elem_id}],
      cb_success: after_deletion,
    }, "delete_item");

    self.dispatcher.tree_changed();

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

    self.creating_below_gui_id = selected.gui_id;

    self.dispatcher.tree_changed();
  }

  function begin_renaming() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");

    const selected = locate_single_selected_node().get_node();

    self.renaming_gui_id = selected.gui_id;

    self.dispatcher.tree_changed();
  }

  function apply_name_input(name) {
    const rename = self.renaming_gui_id !== null;
    const create = self.creating_below_gui_id !== null;
    ensure(rename || create);
    ensure(!rename || !create);
    ensure(!self.is_busy, "");
    ensure(is_single_selection(), "");

    self.renaming_gui_id = self.creating_below_gui_id = null;

    const selected = locate_single_selected_node().get_node();

    if (rename) {
      self.is_busy = true;
      self.is_tree_ready = false;
      self.lib_data.command({
        elem_id: selected.elem_id,
        field_id: "name",
        content: name,
        cb_success: after_renaming,
      }, "change_item_field");
  
      function after_renaming() {
        self.is_busy = false;
        self.select_and_zoom(self.path_to_root);
      }
    } else {
      self.is_busy = true;
      self.is_tree_ready = false;
      self.lib_data.command({
        parent_elem_id: selected.elem_id,
        name: name,
        type: c_LANG_LIB_TREE_ELEMTYPE[1][0],
        cb_success: after_creating,
      }, "create_item");

      function after_creating() {
        self.is_busy = false;
        self.select_and_zoom(self.path_to_root);
      }
    }

    self.dispatcher.tree_changed();
  }

  function are_single_selection_operations_available() {
    return are_browsing_operations_available() && is_single_selection();
  }

  function are_browsing_operations_available() {
    return !self.is_busy && self.renaming_gui_id === null && self.creating_below_gui_id === null;
  }

  function path_to(gui_id) {
    return self.tree.locate(gui_id).get_downward_path();
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
