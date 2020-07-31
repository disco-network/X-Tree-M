function uc_browsing_model(dispatcher, lib_data, logger) {
  var self = this;

  // public
  self.load_path = load_path;
  self.load_by_gui_id = load_by_gui_id;

  // private
  self.dispatcher = dispatcher;
  self.lib_data = lib_data;
  self.logger = logger;
  self.is_busy = false;
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
