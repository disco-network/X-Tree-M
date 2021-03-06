import { c_LANG_LIB_TREE_ELEMTYPE } from "./lib_tree_lang.js";

import { VisibleState } from "./uc_browsing/state.js";
import { ClipboardSaga } from "./uc_browsing/clipboard.js";
import { BrowsingSaga } from "./uc_browsing/browse.js";
import { DeleteSaga } from "./uc_browsing/delete.js";
import { RenameSaga } from "./uc_browsing/rename.js";
import { CreateSaga } from "./uc_browsing/create.js";

export function uc_browsing_model(dispatcher, cache_manager) {
  var self = this;

  // public
  self.get_state = get_state;

  self.reload = reload;
  self.adopt_newest_cache = adopt_newest_cache;
  self.select_and_zoom = select_and_zoom;
  self.select_and_zoom_to = select_and_zoom_to;
  self.toggle_in_multiselection = toggle_in_multiselection;

  //  self.begin_renaming = begin_renaming;
  //  self.begin_creating = begin_creating;
  //  self.apply_name_input = apply_name_input;

  // private
  self.visible_state = new VisibleState();
  self.dispatcher = dispatcher;
  self.cache_manager = cache_manager;

  self.browsing_dispatcher = {
    tree_changed: () => dispatcher.tree_changed(),
  };
  self.browsing_saga = new BrowsingSaga(
    self.browsing_dispatcher,
    self.visible_state,
    self.cache_manager
  );
  self.edit_dispatcher = {
    tree_changed: () => dispatcher.tree_changed(),
    select_and_zoom: (path) => self.browsing_saga.select_and_zoom(path),
    expand_children: () => self.browsing_saga.expand_children(),
  };
  self.clipboard_saga = new ClipboardSaga(
    self.edit_dispatcher,
    self.visible_state,
    (copy_ids, target_id, cb_success) =>
      cache_manager.copy_items({ src_ids: copy_ids, target_id, cb_success }),
    (copy_links, target_id, cb_success) =>
      cache_manager.move_items({ sources: copy_links, target_id, cb_success })
  );
  self.delete_saga = new DeleteSaga(
    self.edit_dispatcher,
    self.visible_state,
    (links) => {
      const deferred = $.Deferred();
      cache_manager.delete_tree_item({
        links,
        cb_success: () => deferred.resolve(),
      });
      return deferred.promise();
    }
  );
  self.rename_saga = new RenameSaga(
    self.edit_dispatcher,
    self.visible_state,
    (id, name, cb_success) =>
      cache_manager.change_tree_item_field({
        elem_id: id,
        field_id: "name",
        content: name,
        cb_success: cb_success,
      })
  );
  self.create_saga = new CreateSaga(
    self.edit_dispatcher,
    self.visible_state,
    (id, name, cb_success) =>
      cache_manager.create_tree_item({
        parent_elem_id: id,
        name: name,
        type: c_LANG_LIB_TREE_ELEMTYPE[1][0],
        cb_success: cb_success,
      })
  );
  //  self.action_in_clipboard = null;

  function get_state() {
    return self.visible_state;
  }

  function reload() {
    return self.browsing_saga.reload();
  }

  function adopt_newest_cache() {
    return self.browsing_saga.adopt_newest_cache();
  }

  function select_and_zoom(path) {
    return self.browsing_saga.select_and_zoom(path);
  }

  function select_and_zoom_to(gui_id) {
    return self.browsing_saga.select_and_zoom_to(gui_id);
  }

  function toggle_in_multiselection(gui_id) {
    return self.browsing_saga.toggle_in_multiselection(gui_id);
  }

  this.handle_key_press = (key_chord, shift_pressed) => {
    self.browsing_saga.handle_key_press(key_chord, shift_pressed);

    switch (key_chord) {
      case "Ctrl+C":
        self.clipboard_saga.copy_by_reference();
        break;
      case "Ctrl-L":
        // cloning not yet supported
        break;
      case "Ctrl+X":
        self.clipboard_saga.cut();
        break;
      case "Ctrl+V":
        self.clipboard_saga.paste();
        break;
    }
  };

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

  this.move_selection_down = (shift_pressed) => {
    this.browsing_saga.move_selection_down(shift_pressed);
  };

  this.move_selection_up = (shift_pressed) => {
    this.browsing_saga.move_selection_up(shift_pressed);
  };

  this.delete_selected = () => {
    this.delete_saga.delete_selected().then((path) => {
      path && this.select_and_zoom(path);
    });
  };

  this.begin_renaming = () => {
    this.rename_saga.begin();
  };

  this.begin_creating = () => {
    this.create_saga.begin();
  };

  this.apply_name_input = (name) => {
    this.rename_saga.apply(name);
    this.create_saga.apply(name);
  };
  
  this.skip_name_input = () => {
  	this.rename_saga.skip();
  };
}
