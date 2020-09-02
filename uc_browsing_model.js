import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";

import { VisibleState } from "./uc_browsing/state.js";
import { ClipboardSaga } from "./uc_browsing/clipboard.js";
import { BrowsingSaga } from "./uc_browsing/browse.js";
import { DeleteSaga } from "./uc_browsing/delete.js";

export function uc_browsing_model(dispatcher, lib_data, logger) {
  var self = this;

  // public
  self.get_state = get_state;

  self.reload = reload;
  self.select_and_zoom = select_and_zoom;
  self.select_and_zoom_to = select_and_zoom_to;

//  self.begin_renaming = begin_renaming;
//  self.begin_creating = begin_creating;
//  self.apply_name_input = apply_name_input;

  // private
  self.visible_state = new VisibleState();

  self.browsing_dispatcher = {
    tree_changed: () => dispatcher.tree_changed()
  };
  self.browsing_saga = new BrowsingSaga(self.browsing_dispatcher, self.visible_state, (path, cb_success) => lib_data.command({path, cb_success}, "req_tree_only"));
  self.edit_dispatcher = {
    tree_changed: () => dispatcher.tree_changed(),
    select_and_zoom_to: (gui_id) => self.browsing_saga.select_and_zoom_to(gui_id)
  };
  self.clipboard_saga = new ClipboardSaga(self.edit_dispatcher, self.visible_state,
    (copy_ids, target_id, cb_success) => lib_data.command({src_ids: copy_ids, target_id, cb_success}, "copy_item"),
    (copy_links, target_id, cb_success) => lib_data.command({sources: copy_links, target_id, cb_success}, "move_item"));
  self.delete_saga = new DeleteSaga(self.edit_dispatcher, self.visible_state,
    (links, cb_success) => lib_data.command({ links, cb_success }, "delete_item"));

  self.dispatcher = dispatcher;
  self.lib_data = lib_data;
  self.logger = logger;
//  self.action_in_clipboard = null;
  
  function get_state() {
    return self.visible_state;
  }

  function reload() {
    return self.browsing_saga.reload();
  }

  function select_and_zoom(path) {
    return self.browsing_saga.select_and_zoom(path);
  }

  function select_and_zoom_to(gui_id) {
    return self.browsing_saga.select_and_zoom_to(gui_id);
  }


  this.handle_key_press = (key_chord) => {

    self.browsing_saga.handle_key_press(key_chord);

    switch (key_chord) {
      case "Ctrl+L":
        self.clipboard_saga.copy_by_reference();
        break;
      case "Ctrl+X":
        self.clipboard_saga.cut();
        break;
      case "Ctrl+V":
        self.clipboard_saga.paste();
        break;
    }
  }

  this.expand_children = () => {
    this.browsing_saga.expand_children();
  };

  this.expand_children_of = (gui_id) => {
    this.browsing_saga.expand_children_of(gui_id);
  };

  this.collapse_children = () => {
    this.browsing_saga.collapse_children();
  };

  this.collapse_children_of = (gui_id) => {
    this.browsing_saga.collapse_children_of(gui_id);
  };

  this.move_selection_down = () => {
    this.browsing_saga.move_selection_down();
  };

  this.move_selection_up = () => {
    this.browsing_saga.move_selection_up();
  };

  this.delete_selected = () => {
    this.delete_saga.delete_selected();
  };

//  function delete_links(links, cb_success) {
//    ensure(are_browsing_operations_available());
//
//    self.is_busy = true;
//    self.visible_state.reset();
//    self.dispatcher.tree_changed();
//
//    self.lib_data.command({
//      links: links,
//      cb_success: function () {
//        self.is_busy = false;
//        cb_success();
//      }
//    }, "delete_item");
//  }
//
//  function delete_selected() {
//    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");
//
//    const selected = locate_single_selected_node();
//    const parent = selected.locate_parent();
//
//    if (parent === null) {
//      return;
//    }
//
//    self.is_busy = true;
//    self.visible_state.reset();
//    self.dispatcher.tree_changed();
//    self.lib_data.command({
//      links: [{id: selected.get_node().elem_id, parent_id: parent.get_node().elem_id}],
//      cb_success: after_deletion,
//    }, "delete_item");
//
//    function after_deletion() {
//      self.is_busy = false;
//      self.select_and_zoom_to(parent.get_node().gui_id);
//    }
//  }
//
//  function begin_creating() {
//    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");
//    ensure(is_single_selection(), "");
//
//    expand_children();
//
//    const selected = locate_single_selected_node().get_node();
//
//    self.visible_state.creating = selected.gui_id;
//    self.dispatcher.tree_changed();
//  }
//
//  function begin_renaming() {
//    ensure(are_single_selection_operations_available(), "Single-selection operations are not available.");
//
//    const selected = locate_single_selected_node().get_node();
//
//    self.visible_state.renaming = selected.gui_id;
//    self.dispatcher.tree_changed();
//  }
//
//  function apply_name_input(name) {
//    const rename = self.visible_state.renaming !== null;
//    const create = self.visible_state.creating !== null;
//    ensure(rename || create);
//    ensure(!rename || !create);
//    ensure(!self.is_busy, "");
//    ensure(is_single_selection(), "");
//
//    self.visible_state.renaming = self.visible_state.creating = null;
//
//    const selected = locate_single_selected_node().get_node();
//
//    self.is_busy = true;
//    self.visible_state.reset();
//    self.dispatcher.tree_changed();
//
//    if (rename) {
//      self.lib_data.command({
//        elem_id: selected.elem_id,
//        field_id: "name",
//        content: name,
//        cb_success: after_operation,
//      }, "change_item_field");
//    } else {
//      self.lib_data.command({
//        parent_elem_id: selected.elem_id,
//        name: name,
//        type: c_LANG_LIB_TREE_ELEMTYPE[1][0],
//        cb_success: after_operation,
//      }, "create_item");
//    }
//
//    function after_operation() {
//      self.is_busy = false;
//      self.select_and_zoom(self.path_to_root);
//    }
//  }
//
//  function are_single_selection_operations_available() {
//    return are_browsing_operations_available() && is_single_selection();
//  }
//
//  function are_browsing_operations_available() {
//    return !self.is_busy && self.visible_state.creating === null && self.visible_state.renaming === null;
//  }
//
//  function path_to(gui_id) {
//    return self.visible_state.tree.locate(gui_id).get_downward_path();
//  }

//  function error(msg) {
//    self.logger(msg);
//    alert("Error: " + msg);
//    throw new Error(msg);
//  }
//
//  function ensure(condition, msg) {
//    if (!condition) error(msg);
//  }
}
