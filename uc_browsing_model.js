function uc_browsing_model(dispatcher, lib_data, logger) {
  var self = this;

  // public
  self.load_path = load_path;
  self.load_by_gui_id = load_by_gui_id;
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
  self.path_to_selected = [uc_browsing_setup.tree_path_to_selected];
  self.tree = null;

  function load_path(path) {
    ensure(!self.is_busy, "Cannot reload the tree because it is busy.");
    self.is_busy = true;
    self.path_to_selected = path;

    self.lib_data.command({
      path,
      cb_success: function(tree) {
        self.is_busy = false;
        self.tree = tree
        dispatcher.tree_panel_changed(tree, get_selected_id());
      }
    }, "req_tree_only");
  }

  function load_by_gui_id(gui_id) {
    self.load_path(path_to(gui_id));
  }

  function delete_selected() {
    ensure(!self.is_busy, "");
    ensure(!self.is_name_input_active, "");

    const selected = self.path_to_selected.slice(-1)[0];
    const parent = self.path_to_selected.slice(-2)[0];

    if (parent === undefined) {
      return;
    }

    self.is_busy = true;
    self.lib_data.command({
      elem_id: selected,
      parent_elem_id: parent,
      cb_success: after_deletion,
    }, "delete_item");

    function after_deletion() {
      self.is_busy = false;
      self.load_path(self.path_to_selected.slice(0, -1));
    }
  }

  function begin_creating() {
    ensure(are_browsing_operations_available(), "Browsing operations are not available.");

    const selected_node = self.tree.tree_nodes[0]; // ugly

    self.is_name_input_active = true;
    self.is_renaming_not_creating = false;

    dispatcher.creating_started(selected_node);
  }

  function begin_renaming() {
    ensure(are_browsing_operations_available(), "Browsing operations are not available.");

    const selected_node = self.tree.tree_nodes[0]; // ugly

    self.is_name_input_active = true;
    self.is_renaming_not_creating = true;

    dispatcher.renaming_started(selected_node);
  }

  function apply_name_input(name) {
    ensure(self.is_name_input_active, "");
    ensure(!self.is_busy, "");

    const selected_node = self.tree.tree_nodes[0]; // ugly

    if (self.is_renaming_not_creating) {
      self.is_busy = true;
      self.lib_data.command({
        elem_id: get_selected_id(),
        field_id: "name",
        content: name,
        cb_success: after_renaming,
      }, "change_item_field");
  
      function after_renaming() {
        self.is_busy = false;
        self.load_path(self.path_to_selected);
      }
    } else {
      self.is_busy = true;
      self.lib_data.command({
        parent_elem_id: get_selected_id(),
        name: name,
        type: c_LANG_LIB_TREE_ELEMTYPE[1][0],
        cb_success: after_creating,
      }, "create_item");

      function after_creating() {
        self.is_busy = false;
        self.load_path(self.path_to_selected);
      }
    }

    self.is_name_input_active = false;
    self.is_renaming_not_creating = null;
  }

  function are_browsing_operations_available() {
    return !self.is_busy && !self.is_name_input_active;
  }

  function path_to(gui_id) {
    var id = gui_id;
    var path = [];
  
    while (id != null) {
      var item = get_item_by_gui_id(id);
      path.unshift(item.elem_id);
      id = item.parent_gui_id;
    }
    
    return path;
  }

  function get_item_by_gui_id(gui_id)
  {
    const predicate = function(node) {
      return node.gui_id === gui_id;
    };

    const explorer_hit = self.tree.explorer_path.find(predicate);
    const tree_hit = self.tree.tree_nodes.find(predicate);

    const result = explorer_hit || tree_hit || null;

    ensure(result !== null, "Could not find item by its gui_id.");
    return result;
  }

  function get_selected_id() {
    return self.path_to_selected.slice(-1)[0];
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
