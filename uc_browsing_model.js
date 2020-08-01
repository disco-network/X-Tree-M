function uc_browsing_model(dispatcher, lib_data, logger) {
  var self = this;

  // public
  self.handle_key_press = handle_key_press;
  self.select_and_zoom = select_and_zoom;
  self.select_and_zoom_to = select_and_zoom_to;
  self.delete_selected = delete_selected;
  self.begin_renaming = begin_renaming;
  self.begin_creating = begin_creating;
  self.apply_name_input = apply_name_input;

  // private
  self.dispatcher = dispatcher;
  self.lib_data = lib_data;
  self.logger = logger;
  self.is_busy = false;
  self.is_name_input_active = false;
  self.is_renaming_not_creating = null;
  self.path_to_root = null;
  self.selected_gui_ids = null;

  self.tree = null;
  self.expanded_node_gui_ids = null;

  function handle_key_press(key_chord) {

    if (!are_browsing_operations_available()) {
      return;
    }

    switch (key_chord) {
      case "right":
        expand_children();
        break;
      case "left":
        collapse_children();
        break;
      case "down":
        move_selection_down();
    }
  }

  function expand_children() {
    ensure(are_single_selection_operations_available(), "");

    const gui_id = locate_single_selected_node().get_node().gui_id;
    self.expanded_node_gui_ids[gui_id] = true;
    self.dispatcher.expand_children_by_gui_id(gui_id);
  }

  function collapse_children() {
    ensure(are_single_selection_operations_available(), "");

    const gui_id = locate_single_selected_node().get_node().gui_id;
    delete self.expanded_node_gui_ids[gui_id];
    self.dispatcher.collapse_children_by_gui_id(gui_id);
  }

  function move_selection_down() {
    ensure(are_single_selection_operations_available(), "");

    const position = locate_single_selected_node();
    const next_pos = locate_node_after(position);

    if (next_pos !== null) {
      const old_selection = self.selected_gui_ids;
      self.selected_gui_ids = [ next_pos.get_node().gui_id ];

      self.dispatcher.selection_changed(old_selection, self.selected_gui_ids);
    }
  }

  function locate_node_after(position) {
    const gui_id = position.get_node().gui_id;
    if (self.expanded_node_gui_ids[gui_id]) {
      const children = position.locate_children();
      if (children.length > 0) {
        return children[0];
      }
    }

    const next_sibling = position.locate_next_sibling();
    if (next_sibling !== null) {
      return next_sibling;
    }

    const parent = position.locate_parent_in_tree();
    if (parent !== null) {
      const next_parent_sibling = parent.locate_next_sibling();
      return next_sibling;
    }

    return null;
  }

  function is_single_selection() {
    return self.selected_gui_ids.length === 1;
  }

  function locate_single_selected_node() {
    ensure(is_single_selection(), "");

    const gui_id = self.selected_gui_ids[0];
    return self.tree.locate(gui_id);
  }

  function select_and_zoom(path) {
    ensure(!self.is_busy, "Cannot reload the tree because it is busy.");

    self.is_busy = true;
    self.path_to_root = path;

    self.lib_data.command({
      path,
      cb_success: function(tree) {
        self.is_busy = false;
        self.tree = new uc_browsing_tree(tree.explorer_path, tree.tree_nodes);

        const gui_id = self.tree.locate_pivot().get_node().gui_id;
        self.expanded_node_gui_ids = { [gui_id]: true };
        self.selected_gui_ids = [ gui_id ];

        // seems strange to use the elem_id here..?
        dispatcher.tree_panel_changed({
          explorer_path: tree.explorer_path,
          tree_nodes: tree.tree_nodes
        }, locate_single_selected_node().get_node().elem_id);
      }
    }, "req_tree_only");
  }

  function select_and_zoom_to(gui_id) {
    self.select_and_zoom(path_to(gui_id));
  }

  function delete_selected() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");

    const selected = locate_single_selected_node().get_node();

    if (selected.parent_elem_id == null) {
      return;
    }

    self.is_busy = true;
    self.lib_data.command({
      elem_id: selected.elem_id,
      parent_elem_id: selected.parent_elem_id,
      cb_success: after_deletion,
    }, "delete_item");

    function after_deletion() {
      self.is_busy = false;
      self.select_and_zoom_to(locate_single_selected_node().get_node().parent_gui_id);
    }
  }

  function begin_creating() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");
    ensure(is_single_selection(), "");

    const selected = locate_single_selected_node().get_node();

    self.is_name_input_active = true;
    self.is_renaming_not_creating = false;

    dispatcher.creating_started(selected);
  }

  function begin_renaming() {
    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");

    const selected = locate_single_selected_node().get_node();

    self.is_name_input_active = true;
    self.is_renaming_not_creating = true;

    dispatcher.renaming_started(selected);
  }

  function apply_name_input(name) {
    ensure(self.is_name_input_active, "");
    ensure(!self.is_busy, "");
    ensure(is_single_selection(), "");

    self.is_name_input_active = false;
    self.is_renaming_not_creating = null;

    const selected = locate_single_selected_node().get_node();

    if (self.is_renaming_not_creating) {
      self.is_busy = true;
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
  }

  function are_single_selection_operations_available() {
    return are_browsing_operations_available() && is_single_selection();
  }

  function are_browsing_operations_available() {
    return !self.is_busy && !self.is_name_input_active;
  }

  function path_to(gui_id) {
    return self.tree.locate(gui_id).get_downward_path();
//    var id = gui_id;
//    var path = [];
//  
//    while (id != null) {
//      var item = get_item_by_gui_id(id);
//      path.unshift(item.elem_id);
//      id = item.parent_gui_id;
//    }
//    
//    return path;
  }

//  function get_item_by_gui_id(gui_id)
//  {
//    const predicate = function(node) {
//      return node.gui_id === gui_id;
//    };
//
//    const explorer_hit = self.tree.explorer_path.find(predicate);
//    const tree_hit = self.tree.tree_nodes.find(predicate);
//
//    const result = explorer_hit || tree_hit || null;
//
//    ensure(result !== null, "Could not find item by its gui_id.");
//    return result;
//  }

  function error(msg) {
    self.logger(msg);
    alert("Error: " + msg);
    throw new Error(msg);
  }

  function ensure(condition, msg) {
    if (!condition) error(msg);
  }
}
